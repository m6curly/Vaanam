'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
require('../raster-core.js');
const Engine = globalThis.VaanamRaster;

function makeSource(values, overrides = {}) {
  const width = overrides.width || 2;
  const height = overrides.height || Math.ceil(values.length / width);
  const meta = {
    fileName: 'synthetic.tif', width, height, pixelCount: width * height,
    epsg: 4326,
    origin: [0, height],
    resolution: [1, -1],
    bbox: [0, 0, width, height],
    noData: null,
    geoKeys: { GeographicTypeGeoKey: 4326 },
    ...overrides
  };
  return {
    meta,
    image: {
      async readRasters({ window }) {
        const [, top, , bottom] = window;
        const rows = bottom - top;
        return Float32Array.from(values.slice(top * width, (top + rows) * width));
      }
    }
  };
}

test('Change Detection classifies pixel differences and excludes NoData', async () => {
  const before = makeSource([1, 2, -9999, 4], { noData: -9999 });
  const after = makeSource([0, 2.5, 100, 3], { noData: -9999 });
  const result = await Engine.analyzeChangeStream({ beforeSource: before, afterSource: after, threshold: 0.5 });

  assert.equal(result.stats.count, 3);
  assert.equal(result.stats.decrease, 2);
  assert.equal(result.stats.stable, 1);
  assert.equal(result.stats.increase, 0);
  assert.deepEqual(Array.from(result.classChunks[0]), [1, 2, 0, 1]);
  assert.equal(result.stats.mean, (-1 + 0.5 - 1) / 3);
});

test('Change Detection rejects rasters that do not share a spatial grid', async () => {
  const before = makeSource([1, 2, 3, 4]);
  const after = makeSource([1, 2, 3, 4], { origin: [0.5, 2], bbox: [0.5, 0, 2.5, 2] });
  await assert.rejects(
    Engine.analyzeChangeStream({ beforeSource: before, afterSource: after, threshold: 0 }),
    /not pixel-aligned/
  );
});

test('LST applies Landsat scale factors and QA / water / uncertainty masks', async () => {
  const st = makeSource([40000, 41000, 42000, 43000], { noData: 0 });
  const qa = makeSource([0, 8, 128, 0], { noData: 65535 });
  const stQa = makeSource([50, 50, 50, 250], { noData: 65535 });
  const result = await Engine.analyzeLSTStream({
    stSource: st, qaSource: qa, stQaSource: stQa,
    excludeWater: true, maxUncertainty: 1
  });

  assert.equal(result.stats.count, 1);
  assert.equal(result.cloudMasked, 1);
  assert.equal(result.waterMasked, 1);
  assert.equal(result.uncertaintyMasked, 1);
  assert.ok(Math.abs(result.valueChunks[0][0] - ((40000 * 0.00341802 + 149) - 273.15)) < 1e-5);
  assert.equal(Number.isNaN(result.valueChunks[0][1]), true);
});

test('GeoTIFF output writes VAANAM software and source attribution metadata', async () => {
  const previousDocument = globalThis.document;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let exportedBlob = null;
  globalThis.document = {
    body: { append() {}, appendChild() {} },
    createElement() { return { click() {}, remove() {}, set href(value) {}, set download(value) {} }; }
  };
  URL.createObjectURL = blob => { exportedBlob = blob; return 'blob:vaanam-test'; };
  URL.revokeObjectURL = () => {};

  try {
    await Engine.writeGeoTIFF({
      meta: {
        width: 2, height: 2, pixelCount: 4, epsg: 4326,
        geoKeys: { GeographicTypeGeoKey: 4326 },
        resolution: [1, -1], origin: [0, 2]
      },
      valueChunks: [new Float32Array([1, 2, 3, 4])],
      chunkRows: 2
    }, 'metadata-test.tif', {
      description: 'Source: USGS Landsat; acknowledgement and product citation required.'
    });
    assert.ok(exportedBlob instanceof Blob);
    const bytes = new Uint8Array(await exportedBlob.arrayBuffer());
    const view = new DataView(bytes.buffer);
    assert.equal(view.getUint16(0, true), 0x4949);
    const ifdOffset = view.getUint32(4, true);
    const tagCount = view.getUint16(ifdOffset, true);
    const tags = new Map();
    for (let i = 0; i < tagCount; i++) {
      const offset = ifdOffset + 2 + i * 12;
      const tag = view.getUint16(offset, true);
      const type = view.getUint16(offset + 2, true);
      const count = view.getUint32(offset + 4, true);
      if (type === 2) {
        const valueOffset = count <= 4 ? offset + 8 : view.getUint32(offset + 8, true);
        tags.set(tag, new TextDecoder().decode(bytes.slice(valueOffset, valueOffset + count)).replace(/\0+$/, ''));
      }
    }
    assert.match(tags.get(270), /USGS Landsat/);
    assert.match(tags.get(305), /VAANAM Spatial Intelligence Platform/);
  } finally {
    globalThis.document = previousDocument;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  }
});
