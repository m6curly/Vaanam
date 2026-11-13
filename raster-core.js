/* VAANAM raster engine — browser-side GeoTIFF analysis. */
(function (root) {
  'use strict';

  const NODATA = NaN;
  const MAX_PIXELS = Number.MAX_SAFE_INTEGER; // Processing is tiled; no arbitrary pixel-count cap.
  const MAX_FILE_BYTES = Infinity; // File size is constrained by the browser and available storage.
  const EARTH_RADIUS = 6371008.8;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function finitePair(value) {
    return Array.isArray(value) && value.length >= 2 && value.slice(0, 2).every(Number.isFinite);
  }

  function directoryValue(image, name) {
    const directory = image.fileDirectory;
    if (!directory) return undefined;
    if (typeof directory.getValue === 'function') return directory.getValue(name);
    return directory[name];
  }

  function getNoData(image) {
    let value;
    try { value = image.getGDALNoData?.(); } catch (_) { /* metadata may be absent */ }
    if (value === undefined || value === null || value === '') value = directoryValue(image, 'GDAL_NODATA');
    if (typeof value === 'string' && value.toLowerCase() === 'nan') return NaN;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function readGeoKeys(image) {
    if (image.geoKeys && typeof image.geoKeys === 'object') return image.geoKeys;
    if (typeof image.getGeoKeys === 'function') {
      const value = image.getGeoKeys();
      if (value && typeof value === 'object') return value;
    }
    return {};
  }

  function isGeographicMeta(meta) {
    const projectedCode = Number(meta?.geoKeys?.ProjectedCSTypeGeoKey || 0);
    if (projectedCode > 0 && projectedCode !== 32767) return false;
    return Number(meta?.epsg) === 4326 || Number(meta?.geoKeys?.GeographicTypeGeoKey || 0) > 0;
  }

  function extractMetadata(image, fileName) {
    const width = Number(image.getWidth());
    const height = Number(image.getHeight());
    const pixelCount = width * height;
    assert(Number.isSafeInteger(pixelCount) && pixelCount > 0, 'This GeoTIFF has invalid raster dimensions.');
    assert(Number(image.getSamplesPerPixel()) === 1,
      'Use a single-band GeoTIFF. Export the required band from QGIS as a one-band GeoTIFF and retry.');

    let bbox, origin, resolution;
    try {
      bbox = image.getBoundingBox?.();
      origin = image.getOrigin?.();
      resolution = image.getResolution?.();
    } catch (_) {
      throw new Error('This TIFF has no usable georeferencing transform. Assign its CRS and export a north-up GeoTIFF with a valid affine transform from QGIS.');
    }
    assert(Array.isArray(bbox) && bbox.length >= 4 && bbox.slice(0, 4).every(Number.isFinite),
      'The GeoTIFF has no usable georeferenced bounding box. Export it with its CRS and transform preserved.');
    if (!finitePair(origin) || !finitePair(resolution)) {
      origin = [bbox[0], bbox[3]];
      resolution = [(bbox[2] - bbox[0]) / width, (bbox[1] - bbox[3]) / height];
    }
    assert(finitePair(origin) && finitePair(resolution), 'The GeoTIFF transform could not be read.');

    const modelTransform = directoryValue(image, 'ModelTransformation');
    if (modelTransform && modelTransform.length >= 8) {
      const rotated = Math.abs(Number(modelTransform[1]) || 0) > 1e-12 ||
        Math.abs(Number(modelTransform[4]) || 0) > 1e-12;
      assert(!rotated, 'Rotated or skewed GeoTIFF grids are not supported yet. Reproject to a north-up grid in QGIS.');
    }
    assert(resolution[0] > 0 && resolution[1] < 0,
      'This workflow requires a north-up GeoTIFF (positive X resolution and negative Y resolution). Reproject it to a north-up grid in QGIS.');
    const expectedBounds = [
      Number(origin[0]),
      Number(origin[1]) + height * Number(resolution[1]),
      Number(origin[0]) + width * Number(resolution[0]),
      Number(origin[1])
    ];
    assert(expectedBounds.every(Number.isFinite), 'The GeoTIFF transform contains invalid coordinates.');
    assert(expectedBounds.every((value, index) => Math.abs(value - Number(bbox[index])) <= Math.max(1e-7, Math.abs(value) * 1e-10)),
      'The GeoTIFF bounding box does not agree with its pixel transform. Re-export the raster with a consistent georeferencing transform.');

    const geoKeys = readGeoKeys(image);
    const epsg = Number(geoKeys.ProjectedCSTypeGeoKey || geoKeys.GeographicTypeGeoKey || 0);
    assert(Number.isInteger(epsg) && epsg > 0 && epsg !== 32767,
      'The GeoTIFF does not contain a recognised EPSG coordinate reference system. Define its CRS and export it again.');
    if (epsg === 4326) {
      assert(bbox[0] >= -180 && bbox[2] <= 180 && bbox[1] >= -90 && bbox[3] <= 90,
        'The EPSG:4326 raster extent is outside valid longitude / latitude limits. Check the CRS and georeferencing.');
    }

    return {
      fileName,
      width,
      height,
      pixelCount,
      samplesPerPixel: 1,
      bbox: bbox.slice(0, 4).map(Number),
      origin: [Number(origin[0]), Number(origin[1])],
      resolution: [Number(resolution[0]), Number(resolution[1])],
      epsg,
      geoKeys,
      noData: getNoData(image),
      image
    };
  }

  async function openRaster(file) {
    assert(file instanceof Blob, 'Choose a GeoTIFF file first.');
    assert(file.size > 0, 'The selected file is empty.');
    assert(root.GeoTIFF && typeof root.GeoTIFF.fromBlob === 'function',
      'The GeoTIFF reader did not load. Check the internet connection, then reload this page.');

    const tiff = await root.GeoTIFF.fromBlob(file);
    const image = await tiff.getImage();
    const meta = extractMetadata(image, file.name || 'raster.tif');
    const bands = await image.readRasters({ samples: [0] });
    const values = bands?.[0];
    assert(values && values.length === meta.pixelCount, 'The GeoTIFF pixel data could not be decoded.');
    return { meta, values };
  }

  const TILE_ROWS = 128;
  const PREVIEW_MAX_SIDE = 1200;

  function firstRasterBand(block) {
    if (ArrayBuffer.isView(block)) return block;
    if (Array.isArray(block) && block.length && ArrayBuffer.isView(block[0])) return block[0];
    if (block && ArrayBuffer.isView(block.data)) return block.data;
    throw new Error('GeoTIFF.js returned an unsupported raster block. Check that the source is a readable single-band GeoTIFF.');
  }

  async function openRasterSource(file) {
    assert(file instanceof Blob, 'Choose a GeoTIFF file first.');
    assert(file.size > 0, 'The selected file is empty.');
    assert(root.GeoTIFF && typeof root.GeoTIFF.fromBlob === 'function',
      'The GeoTIFF reader did not load. Check the internet connection, then reload this page.');
    const tiff = await root.GeoTIFF.fromBlob(file);
    const image = await tiff.getImage();
    const meta = extractMetadata(image, file.name || 'raster.tif');
    return { file, tiff, image, meta };
  }

  async function readRasterWindow(source, firstRow, rowCount) {
    const { width, height } = source.meta;
    const top = Math.max(0, Math.min(height, firstRow));
    const bottom = Math.max(top, Math.min(height, firstRow + rowCount));
    assert(bottom > top, 'The requested raster window is empty.');
    const raw = await source.image.readRasters({
      window: [0, top, width, bottom],
      samples: [0],
      interleave: true
    });
    const values = firstRasterBand(raw);
    assert(values.length === width * (bottom - top),
      `GeoTIFF window decode returned ${values.length.toLocaleString()} values; expected ${(width * (bottom - top)).toLocaleString()}.`);
    return values;
  }

  function previewDimensions(meta) {
    const scale = Math.min(1, PREVIEW_MAX_SIDE / Math.max(meta.width, meta.height));
    return {
      scale,
      width: Math.max(1, Math.round(meta.width * scale)),
      height: Math.max(1, Math.round(meta.height * scale))
    };
  }

  function colorizeLSTPreview(previewValues, width, height, min, max) {
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < previewValues.length; i++) {
      const value = previewValues[i];
      const p = i * 4;
      if (!Number.isFinite(value)) continue;
      const color = rampColor(value, min, max);
      pixels[p] = color[0]; pixels[p + 1] = color[1]; pixels[p + 2] = color[2]; pixels[p + 3] = 222;
    }
    return pixels;
  }

  function colorizeChangePreview(previewClasses, width, height) {
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < previewClasses.length; i++) {
      const cls = previewClasses[i];
      const p = i * 4;
      if (!cls) continue;
      const color = cls === 3 ? [220, 100, 74] : cls === 1 ? [67, 135, 190] : [211, 176, 116];
      pixels[p] = color[0]; pixels[p + 1] = color[1]; pixels[p + 2] = color[2];
      pixels[p + 3] = cls === 2 ? 118 : 220;
    }
    return pixels;
  }

  async function nextPaint() {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  async function analyzeChangeStream(options) {
    const { beforeSource, afterSource, threshold = 0, onProgress, isCancelled } = options;
    assert(beforeSource?.meta && afterSource?.meta, 'Both raster sources must be open before analysis.');
    assert(Number.isFinite(threshold) && threshold >= 0, 'The change threshold must be a non-negative number.');
    const meta = beforeSource.meta;
    assertSameGrid(meta, afterSource.meta, 'Later raster');

    const preview = previewDimensions(meta);
    const chunkRows = Math.max(1, Math.min(TILE_ROWS, Math.floor(1000000 / meta.width) || 1));
    const previewClasses = new Uint8Array(preview.width * preview.height);
    const valueChunks = [], classChunks = [];
    const validByRow = new Uint32Array(meta.height);
    let decrease = 0, stable = 0, increase = 0, count = 0;
    let min = Infinity, max = -Infinity, mean = 0, m2 = 0, sumAbs = 0;

    for (let y = 0; y < meta.height; y += chunkRows) {
      if (isCancelled?.()) throw new Error('Analysis cancelled because an input file or setting changed.');
      const rows = Math.min(chunkRows, meta.height - y);
      const [beforeValues, afterValues] = await Promise.all([
        readRasterWindow(beforeSource, y, rows),
        readRasterWindow(afterSource, y, rows)
      ]);
      const n = beforeValues.length;
      const values = new Float32Array(n);
      const classes = new Uint8Array(n);
      values.fill(NODATA);

      for (let localRow = 0; localRow < rows; localRow++) {
        const rowStart = localRow * meta.width;
        let rowValid = 0;
        for (let col = 0; col < meta.width; col++) {
          const i = rowStart + col;
          const a = Number(beforeValues[i]), b = Number(afterValues[i]);
          if (isNoData(a, meta.noData) || isNoData(b, afterSource.meta.noData)) continue;
          const delta = b - a;
          if (!Number.isFinite(delta)) continue;
          values[i] = delta;
          count++;
          min = Math.min(min, delta); max = Math.max(max, delta);
          const d = delta - mean;
          mean += d / count;
          m2 += d * (delta - mean);
          sumAbs += Math.abs(delta);
          rowValid++;
          if (delta > threshold) { classes[i] = 3; increase++; }
          else if (delta < -threshold) { classes[i] = 1; decrease++; }
          else { classes[i] = 2; stable++; }
        }
        validByRow[y + localRow] = rowValid;
      }

      // Preview sampling is performed from each decoded tile; no full-resolution source copy is retained.
      for (let py = 0; py < preview.height; py++) {
        const sourceY = Math.min(meta.height - 1, Math.floor((py + 0.5) / preview.scale));
        if (sourceY < y || sourceY >= y + rows) continue;
        const localY = sourceY - y;
        for (let px = 0; px < preview.width; px++) {
          const sourceX = Math.min(meta.width - 1, Math.floor((px + 0.5) / preview.scale));
          previewClasses[py * preview.width + px] = classes[localY * meta.width + sourceX];
        }
      }

      valueChunks.push(values);
      classChunks.push(classes);
      onProgress?.(`Comparing raster tiles · ${Math.min(y + rows, meta.height).toLocaleString()} / ${meta.height.toLocaleString()} rows`);
      await nextPaint();
    }

    assert(count > 0, 'The two rasters have no overlapping valid pixels. Check NoData values and alignment.');
    const stats = {
      count, min, max, mean, stdDev: Math.sqrt(m2 / count), meanAbsoluteChange: sumAbs / count,
      decrease, stable, increase, changed: decrease + increase,
      changedPercent: (decrease + increase) / count * 100,
      decreasePercent: decrease / count * 100,
      stablePercent: stable / count * 100,
      increasePercent: increase / count * 100,
      areaM2: estimateAreaSquareMetres(meta, validByRow)
    };
    return {
      meta, valueChunks, classChunks, chunkRows, stats, validByRow, threshold,
      previewPixels: colorizeChangePreview(previewClasses, preview.width, preview.height),
      previewWidth: preview.width, previewHeight: preview.height,
      noData: NODATA
    };
  }

  async function analyzeLSTStream(options) {
    const { stSource, qaSource = null, stQaSource = null, excludeWater = false, maxUncertainty = 2, onProgress, isCancelled } = options;
    assert(stSource?.meta, 'The ST_B10 raster must be opened before analysis.');
    const meta = stSource.meta;
    if (qaSource) assertSameGrid(meta, qaSource.meta, 'QA_PIXEL raster');
    if (stQaSource) assertSameGrid(meta, stQaSource.meta, 'ST_QA raster');
    assert(Number.isFinite(maxUncertainty) && maxUncertainty >= 0,
      'The maximum ST_QA uncertainty must be a non-negative number.');
    assert(!excludeWater || qaSource, 'Upload the matching QA_PIXEL raster before excluding water pixels.');

    const preview = previewDimensions(meta);
    const chunkRows = Math.max(1, Math.min(TILE_ROWS, Math.floor(1000000 / meta.width) || 1));
    const previewValues = new Float32Array(preview.width * preview.height);
    previewValues.fill(NODATA);
    const valueChunks = [];
    const validByRow = new Uint32Array(meta.height);
    const histogram = new Uint32Array(2048);
    const histogramMin = -125, histogramMax = 100;
    const histogramScale = histogram.length / (histogramMax - histogramMin);
    let count = 0, invalid = 0, cloudMasked = 0, waterMasked = 0, uncertaintyMasked = 0;
    let min = Infinity, max = -Infinity, mean = 0, m2 = 0, highestSourceDn = -Infinity;
    const qaMask = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5);

    for (let y = 0; y < meta.height; y += chunkRows) {
      if (isCancelled?.()) throw new Error('LST calculation cancelled because an input file or setting changed.');
      const rows = Math.min(chunkRows, meta.height - y);
      const tasks = [readRasterWindow(stSource, y, rows)];
      if (qaSource) tasks.push(readRasterWindow(qaSource, y, rows));
      if (stQaSource) tasks.push(readRasterWindow(stQaSource, y, rows));
      const blocks = await Promise.all(tasks);
      const stValues = blocks[0];
      const qaValues = qaSource ? blocks[1] : null;
      const stQaValues = stQaSource ? blocks[qaSource ? 2 : 1] : null;
      const out = new Float32Array(stValues.length);
      out.fill(NODATA);

      for (let localRow = 0; localRow < rows; localRow++) {
        const rowStart = localRow * meta.width;
        let rowValid = 0;
        for (let col = 0; col < meta.width; col++) {
          const i = rowStart + col;
          const dn = Number(stValues[i]);
          if (isNoData(dn, meta.noData) || dn < 293 || dn > 65535) { invalid++; continue; }
          highestSourceDn = Math.max(highestSourceDn, dn);

          if (qaValues) {
            const q = Number(qaValues[i]);
            if (isNoData(q, qaSource.meta.noData) || !Number.isInteger(q) || q < 0 || q > 65535) { invalid++; continue; }
            if ((q & qaMask) !== 0) { cloudMasked++; continue; }
            if (excludeWater && (q & (1 << 7)) !== 0) { waterMasked++; continue; }
          }
          if (stQaValues) {
            const uncertaintyDn = Number(stQaValues[i]);
            if (isNoData(uncertaintyDn, stQaSource.meta.noData) || !Number.isFinite(uncertaintyDn) || uncertaintyDn < 0) { invalid++; continue; }
            if (uncertaintyDn * 0.01 > maxUncertainty) { uncertaintyMasked++; continue; }
          }

          const celsius = (dn * 0.00341802 + 149.0) - 273.15;
          if (!Number.isFinite(celsius)) { invalid++; continue; }
          out[i] = celsius;
          count++;
          min = Math.min(min, celsius); max = Math.max(max, celsius);
          const delta = celsius - mean;
          mean += delta / count;
          m2 += delta * (celsius - mean);
          const bin = Math.max(0, Math.min(histogram.length - 1, Math.floor((celsius - histogramMin) * histogramScale)));
          histogram[bin]++;
          rowValid++;
        }
        validByRow[y + localRow] = rowValid;
      }

      for (let py = 0; py < preview.height; py++) {
        const sourceY = Math.min(meta.height - 1, Math.floor((py + 0.5) / preview.scale));
        if (sourceY < y || sourceY >= y + rows) continue;
        const localY = sourceY - y;
        for (let px = 0; px < preview.width; px++) {
          const sourceX = Math.min(meta.width - 1, Math.floor((px + 0.5) / preview.scale));
          previewValues[py * preview.width + px] = out[localY * meta.width + sourceX];
        }
      }

      valueChunks.push(out);
      onProgress?.(`Calculating LST tiles · ${Math.min(y + rows, meta.height).toLocaleString()} / ${meta.height.toLocaleString()} rows`);
      await nextPaint();
    }

    assert(highestSourceDn >= 1000,
      'The ST_B10 values do not look like native Landsat Collection 2 raw digital numbers. Use the original ST_B10 DN GeoTIFF, not a Celsius/Kelvin-scaled output.');
    assert(count > 0,
      'No valid temperature pixels remain after fill, QA and uncertainty checks. Check that ST_B10, QA_PIXEL and ST_QA are matching Landsat scenes and that the uncertainty threshold is suitable.');

    const percentile = p => {
      const target = Math.max(1, Math.ceil(count * p));
      let seen = 0;
      for (let i = 0; i < histogram.length; i++) {
        seen += histogram[i];
        if (seen >= target) return histogramMin + (i + 0.5) / histogramScale;
      }
      return max;
    };
    const stats = {
      count, min, max, mean, stdDev: Math.sqrt(m2 / count), median: percentile(0.5), p90: percentile(0.9),
      areaM2: estimateAreaSquareMetres(meta, validByRow)
    };
    return {
      meta, valueChunks, chunkRows, stats, validByRow,
      invalid, cloudMasked, waterMasked, uncertaintyMasked,
      previewPixels: colorizeLSTPreview(previewValues, preview.width, preview.height, min, max),
      previewWidth: preview.width, previewHeight: preview.height,
      noData: NODATA
    };
  }

  function sameNumber(a, b) {
    const tolerance = Math.max(1e-8, Math.max(Math.abs(a), Math.abs(b)) * 1e-11);
    return Math.abs(a - b) <= tolerance;
  }

  function assertSameGrid(reference, candidate, label) {
    assert(reference.width === candidate.width && reference.height === candidate.height,
      `${label} must have the same pixel width and height as the main raster.`);
    assert(reference.epsg === candidate.epsg,
      `${label} CRS does not match the main raster (EPSG:${candidate.epsg} vs EPSG:${reference.epsg}). Reproject both to the same CRS.`);
    assert(reference.origin.every((v, i) => sameNumber(v, candidate.origin[i])) &&
      reference.resolution.every((v, i) => sameNumber(v, candidate.resolution[i])) &&
      reference.bbox.every((v, i) => sameNumber(v, candidate.bbox[i])),
      `${label} is not pixel-aligned with the main raster. Align both rasters to the same grid in QGIS before analysis.`);
  }

  function isNoData(value, noData) {
    if (!Number.isFinite(Number(value))) return true;
    if (noData === null || noData === undefined) return false;
    if (Number.isNaN(noData)) return Number.isNaN(Number(value));
    return Number(value) === noData;
  }

  function sphericalRingArea(coords) {
    let sum = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const [lon1, lat1] = coords[i], [lon2, lat2] = coords[i + 1];
      let dLon = lon2 - lon1;
      while (dLon > 180) dLon -= 360;
      while (dLon < -180) dLon += 360;
      sum += dLon * Math.PI / 180 * (2 + Math.sin(lat1 * Math.PI / 180) + Math.sin(lat2 * Math.PI / 180));
    }
    return Math.abs(sum * EARTH_RADIUS * EARTH_RADIUS / 2);
  }

  function estimateAreaSquareMetres(meta, validByRow) {
    const code = meta.epsg;
    const [dx, dy] = meta.resolution;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    let total = 0;

    if (code === 4326) {
      const dLon = absDx * Math.PI / 180;
      for (let row = 0; row < meta.height; row++) {
        const north = (meta.origin[1] + row * dy) * Math.PI / 180;
        const south = (meta.origin[1] + (row + 1) * dy) * Math.PI / 180;
        const perPixel = EARTH_RADIUS * EARTH_RADIUS * dLon * Math.abs(Math.sin(north) - Math.sin(south));
        total += validByRow[row] * perPixel;
      }
      return total;
    }

    if (code === 3857) {
      const mapPixelArea = absDx * absDy;
      for (let row = 0; row < meta.height; row++) {
        const y = meta.origin[1] + (row + 0.5) * dy;
        const latitude = 2 * Math.atan(Math.exp(y / 6378137)) - Math.PI / 2;
        const groundPixelArea = mapPixelArea * Math.cos(latitude) ** 2;
        total += validByRow[row] * groundPixelArea;
      }
      return total;
    }

    if ((code >= 32601 && code <= 32660) || (code >= 32701 && code <= 32760)) {
      if (!root.proj4) return null;
      const zone = code % 100;
      const south = code >= 32700;
      const source = `EPSG:${code}`;
      root.proj4.defs(source, `+proj=utm +zone=${zone} ${south ? '+south ' : ''}+datum=WGS84 +units=m +no_defs +type=crs`);
      const toWgs84 = point => root.proj4(source, 'EPSG:4326', point);
      const xCenter = meta.origin[0] + meta.width * dx / 2;
      for (let row = 0; row < meta.height; row++) {
        if (!validByRow[row]) continue;
        const yTop = meta.origin[1] + row * dy, yBottom = yTop + dy, halfX = absDx / 2;
        const corners = [
          toWgs84([xCenter - halfX, yTop]), toWgs84([xCenter + halfX, yTop]),
          toWgs84([xCenter + halfX, yBottom]), toWgs84([xCenter - halfX, yBottom]),
          toWgs84([xCenter - halfX, yTop])
        ];
        if (!corners.every(finitePair)) return null;
        total += validByRow[row] * sphericalRingArea(corners);
      }
      return total;
    }
    return null;
  }

  function buildStats(values, validByRow, meta) {
    let count = 0, min = Infinity, max = -Infinity, mean = 0, m2 = 0, sumAbs = 0, sum = 0;
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (value === NODATA || !Number.isFinite(value)) continue;
      count++;
      min = Math.min(min, value);
      max = Math.max(max, value);
      sum += value;
      sumAbs += Math.abs(value);
      const delta = value - mean;
      mean += delta / count;
      m2 += delta * (value - mean);
    }
    if (!count) return { count: 0, min: null, max: null, mean: null, stdDev: null, median: null, p90: null, sumAbs: null, areaM2: null };

    const bins = 512;
    const histogram = new Uint32Array(bins);
    const range = max - min;
    if (range === 0) histogram[0] = count;
    else {
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (value === NODATA || !Number.isFinite(value)) continue;
        const index = Math.max(0, Math.min(bins - 1, Math.floor((value - min) / range * bins)));
        histogram[index]++;
      }
    }
    const percentile = p => {
      const target = Math.max(1, Math.ceil(count * p));
      let seen = 0;
      for (let i = 0; i < bins; i++) {
        seen += histogram[i];
        if (seen >= target) return range === 0 ? min : min + (i + 0.5) / bins * range;
      }
      return max;
    };
    return {
      count, min, max, mean, stdDev: Math.sqrt(m2 / count), median: percentile(0.5), p90: percentile(0.9),
      sumAbs: sumAbs / count,
      netMean: sum / count,
      areaM2: estimateAreaSquareMetres(meta, validByRow)
    };
  }

  function calculateLST(options) {
    const { meta, stValues, qa, stQa, excludeWater = false, maxUncertainty = 2 } = options;
    assert(meta && Number.isSafeInteger(meta.pixelCount) && Number.isSafeInteger(meta.width) && Number.isSafeInteger(meta.height),
      'The ST_B10 raster metadata is incomplete.');
    assert(stValues && stValues.length === meta.pixelCount,
      'The ST_B10 pixel array does not match its raster dimensions.');
    if (qa) {
      assert(qa.values && qa.values.length === meta.pixelCount,
        'The QA_PIXEL raster does not contain the same number of pixels as ST_B10.');
    }
    if (stQa) {
      assert(stQa.values && stQa.values.length === meta.pixelCount,
        'The ST_QA raster does not contain the same number of pixels as ST_B10.');
    }
    assert(Number.isFinite(maxUncertainty) && maxUncertainty >= 0,
      'The maximum ST_QA uncertainty must be a non-negative number.');
    assert(!excludeWater || qa,
      'Upload the matching QA_PIXEL raster before excluding water pixels.');

    const out = new Float32Array(meta.pixelCount);
    out.fill(NODATA);
    const validByRow = new Uint32Array(meta.height);
    // Landsat 8/9 Collection 2 QA_PIXEL bits: fill, dilated cloud, cirrus,
    // cloud, cloud shadow and snow. Water is bit 7 and remains optional.
    const mask = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5);
    let invalid = 0, cloudMasked = 0, waterMasked = 0, uncertaintyMasked = 0;
    let highestSourceDn = -Infinity;

    for (let row = 0; row < meta.height; row++) {
      const rowStart = row * meta.width;
      for (let col = 0; col < meta.width; col++) {
        const i = rowStart + col;
        const dn = Number(stValues[i]);
        if (isNoData(dn, meta.noData) || dn < 293 || dn > 65535) {
          invalid++;
          continue;
        }
        // Inspect raw ST_B10 values before QA masks. Otherwise a completely
        // cloud-masked but correctly scaled scene is misdiagnosed as pre-scaled.
        highestSourceDn = Math.max(highestSourceDn, dn);

        if (qa) {
          const q = Number(qa.values[i]);
          if (isNoData(q, qa.meta?.noData) || !Number.isInteger(q) || q < 0 || q > 65535) {
            invalid++;
            continue;
          }
          if ((q & mask) !== 0) {
            cloudMasked++;
            continue;
          }
          if (excludeWater && (q & (1 << 7)) !== 0) {
            waterMasked++;
            continue;
          }
        }

        if (stQa) {
          const uncertaintyDn = Number(stQa.values[i]);
          if (isNoData(uncertaintyDn, stQa.meta?.noData) || !Number.isFinite(uncertaintyDn) || uncertaintyDn < 0) {
            invalid++;
            continue;
          }
          const uncertaintyK = uncertaintyDn * 0.01;
          if (uncertaintyK > maxUncertainty) {
            uncertaintyMasked++;
            continue;
          }
        }

        const celsius = (dn * 0.00341802 + 149.0) - 273.15;
        if (!Number.isFinite(celsius)) {
          invalid++;
          continue;
        }
        out[i] = celsius;
        validByRow[row]++;
      }
    }

    assert(highestSourceDn >= 1000,
      'The ST_B10 values do not look like native Landsat Collection 2 raw digital numbers. Use the original ST_B10 DN GeoTIFF (valid DN range starts at 293); do not upload a Celsius/Kelvin-scaled output.');
    const stats = buildStats(out, validByRow, meta);
    assert(stats.count > 0,
      'No valid temperature pixels remain after fill, QA and uncertainty checks. Check the matching QA_PIXEL / ST_QA files, NoData settings and uncertainty threshold.');
    return { values: out, stats, validByRow, invalid, cloudMasked, waterMasked, uncertaintyMasked, meta, noData: NODATA };
  }

  function calculateChange(options) {
    const { before, after, threshold = 0 } = options;
    assert(before?.meta && after?.meta, 'Both raster inputs must include geospatial metadata.');
    assert(Number.isFinite(threshold) && threshold >= 0, 'The change threshold must be a non-negative number.');
    const meta = before.meta;
    assert(before.values?.length === meta.pixelCount && after.values?.length === meta.pixelCount,
      'The input pixel arrays do not match the raster dimensions.');
    const values = new Float32Array(meta.pixelCount);
    values.fill(NODATA);
    const classes = new Uint8Array(meta.pixelCount); // 0 invalid, 1 decrease, 2 within threshold, 3 increase
    const classValues = new Float32Array(meta.pixelCount);
    classValues.fill(NODATA);
    const validByRow = new Uint32Array(meta.height);
    let decrease = 0, stable = 0, increase = 0, min = Infinity, max = -Infinity;
    let mean = 0, m2 = 0, count = 0, sumAbs = 0;

    for (let row = 0; row < meta.height; row++) {
      const rowStart = row * meta.width;
      for (let col = 0; col < meta.width; col++) {
        const i = rowStart + col;
        const a = Number(before.values[i]), b = Number(after.values[i]);
        if (isNoData(a, before.meta.noData) || isNoData(b, after.meta.noData)) continue;
        const delta = b - a;
        if (!Number.isFinite(delta)) continue;
        values[i] = delta;
        count++;
        min = Math.min(min, delta);
        max = Math.max(max, delta);
        const d = delta - mean;
        mean += d / count;
        m2 += d * (delta - mean);
        sumAbs += Math.abs(delta);
        validByRow[row]++;
        if (delta > threshold) { classes[i] = 3; classValues[i] = 3; increase++; }
        else if (delta < -threshold) { classes[i] = 1; classValues[i] = 1; decrease++; }
        else { classes[i] = 2; classValues[i] = 2; stable++; }
      }
    }

    assert(count > 0, 'The two rasters have no overlapping valid pixels. Check NoData values and alignment.');
    const stats = {
      count, min, max, mean, stdDev: Math.sqrt(m2 / count), meanAbsoluteChange: sumAbs / count,
      decrease, stable, increase,
      changed: decrease + increase,
      changedPercent: (decrease + increase) / count * 100,
      decreasePercent: decrease / count * 100,
      stablePercent: stable / count * 100,
      increasePercent: increase / count * 100,
      areaM2: estimateAreaSquareMetres(meta, validByRow)
    };
    return { values, classes, classValues, stats, validByRow, meta, noData: NODATA, threshold };
  }

  function rampColor(value, min, max) {
    const stops = [
      [35, 59, 138], [32, 131, 177], [73, 165, 133], [221, 190, 82], [220, 112, 64], [151, 49, 58]
    ];
    const t = max === min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
    const scaled = t * (stops.length - 1);
    const index = Math.min(stops.length - 2, Math.floor(scaled));
    const local = scaled - index;
    return [0, 1, 2].map(k => Math.round(stops[index][k] * (1 - local) + stops[index + 1][k] * local));
  }

  function makePreviewCanvas(result, mode) {
    if (result.previewPixels && result.previewWidth && result.previewHeight) {
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = result.previewWidth;
      previewCanvas.height = result.previewHeight;
      const previewContext = previewCanvas.getContext('2d', { willReadFrequently: false });
      const previewImage = previewContext.createImageData(result.previewWidth, result.previewHeight);
      previewImage.data.set(result.previewPixels);
      previewContext.putImageData(previewImage, 0, 0);
      return previewCanvas;
    }
    const { width, height } = result.meta;
    const maxSide = 1200;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const outWidth = Math.max(1, Math.round(width * scale));
    const outHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const context = canvas.getContext('2d', { willReadFrequently: false });
    const image = context.createImageData(outWidth, outHeight);
    const data = image.data;
    const values = result.values;
    const stats = result.stats;

    for (let y = 0; y < outHeight; y++) {
      const sourceY = Math.min(height - 1, Math.floor((y + 0.5) / scale));
      for (let x = 0; x < outWidth; x++) {
        const sourceX = Math.min(width - 1, Math.floor((x + 0.5) / scale));
        const sourceIndex = sourceY * width + sourceX;
        const index = (y * outWidth + x) * 4;
        if (mode === 'change') {
          const cls = result.classes[sourceIndex];
          if (!cls) { data[index + 3] = 0; continue; }
          const color = cls === 3 ? [220, 100, 74] : cls === 1 ? [67, 135, 190] : [211, 176, 116];
          data[index] = color[0]; data[index + 1] = color[1]; data[index + 2] = color[2]; data[index + 3] = cls === 2 ? 118 : 220;
        } else {
          const value = values[sourceIndex];
          if (value === NODATA || !Number.isFinite(value)) { data[index + 3] = 0; continue; }
          const color = rampColor(value, stats.min, stats.max);
          data[index] = color[0]; data[index + 1] = color[1]; data[index + 2] = color[2]; data[index + 3] = 222;
        }
      }
    }
    context.putImageData(image, 0, 0);
    return canvas;
  }

  function leafletBounds(meta) {
    const bbox = meta.bbox;
    const transform = (() => {
      if (isGeographicMeta(meta)) return point => point;
      const p4 = root.proj4;
      if (!p4) throw new Error('The map projection library did not load. Raster statistics are ready, but the map overlay is unavailable.');
      const source = `EPSG:${meta.epsg}`;
      if ((meta.epsg >= 32601 && meta.epsg <= 32660) || (meta.epsg >= 32701 && meta.epsg <= 32760)) {
        const zone = meta.epsg % 100;
        const south = meta.epsg >= 32700;
        p4.defs(source, `+proj=utm +zone=${zone} ${south ? '+south ' : ''}+datum=WGS84 +units=m +no_defs +type=crs`);
      }
      return point => p4(source, 'EPSG:4326', point);
    })();
    const [minX, minY, maxX, maxY] = bbox;
    const samplesPerEdge = 32;
    const points = [];
    for (let i = 0; i <= samplesPerEdge; i++) {
      const t = i / samplesPerEdge;
      const x = minX + (maxX - minX) * t;
      const y = minY + (maxY - minY) * t;
      points.push(transform([x, minY]), transform([x, maxY]));
      points.push(transform([minX, y]), transform([maxX, y]));
    }
    assert(points.every(finitePair), 'The raster extent could not be transformed to WGS84 for map display.');
    const lats = points.map(point => point[1]);
    const lons = points.map(point => point[0]);
    assert(Math.max(...lats) <= 90 && Math.min(...lats) >= -90 && Math.max(...lons) <= 180 && Math.min(...lons) >= -180,
      'The raster extent is outside valid WGS84 coordinates.');
    return [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]];
  }

  async function writeGeoTIFF(result, fileName, options = {}) {
    const meta = result.meta;
    assert(meta && Number.isSafeInteger(meta.width) && Number.isSafeInteger(meta.height), 'Raster export metadata is incomplete.');
    assert(meta.pixelCount === meta.width * meta.height, 'Raster export dimensions do not match the raster metadata.');

    const dataKey = options.dataKey || 'valueChunks';
    let chunks = result[dataKey];
    if (!Array.isArray(chunks) || !chunks.length) {
      const legacy = dataKey === 'valueChunks' ? result.values : result.classValues;
      assert(legacy && legacy.length === meta.pixelCount, 'Raster export values do not match the raster dimensions.');
      chunks = [legacy];
    }
    const bitsPerSample = Number(options.bitsPerSample || 32);
    const sampleFormat = Number(options.sampleFormat || (bitsPerSample === 8 ? 1 : 3));
    assert(bitsPerSample === 8 || bitsPerSample === 32, 'Only 8-bit class and 32-bit Float32 GeoTIFF exports are supported.');
    const bytesPerSample = bitsPerSample / 8;
    const totalSamples = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    assert(totalSamples === meta.pixelCount, 'Raster export chunks do not match the raster dimensions.');
    const dataBytes = meta.pixelCount * bytesPerSample;

    // Classic TIFF uses 32-bit offsets. Chunked inputs/analysis are not capped;
    // only this legacy TIFF export container has a 4 GB address-space ceiling.
    assert(dataBytes < 0xffffffff, 'This output would exceed the classic TIFF 4 GB limit. The analysis can run, but this browser exporter cannot create a single TIFF larger than 4 GB.');

    const epsg = Number(meta.epsg);
    assert(Number.isInteger(epsg) && epsg > 0 && epsg <= 65535 && epsg !== 32767, 'A recognised EPSG code that fits the GeoTIFF GeoKey is required for export.');
    const geographic = isGeographicMeta(meta);
    const geoKeyValues = [1, 1, 0, 3,
      1024, 0, 1, geographic ? 2 : 1,
      1025, 0, 1, 1,
      geographic ? 2048 : 3072, 0, 1, epsg
    ];
    const noDataText = String(options.noData ?? (bitsPerSample === 8 ? '0' : 'nan')) + '\0';
    const softwareText = 'VAANAM Spatial Intelligence Platform\0';
    const descriptionText = `${String(options.description || 'Geospatial analysis output created by VAANAM. Review the source dataset licence and attribution before redistribution.')}\0`;
    const stripByteCounts = chunks.map(chunk => chunk.length * bytesPerSample);
    let rowsPerStrip = Number(result.chunkRows || meta.height);
    if (!Number.isSafeInteger(rowsPerStrip) || rowsPerStrip < 1) rowsPerStrip = meta.height;

    const tags = [
      { tag: 256, type: 4, count: 1, value: meta.width },
      { tag: 257, type: 4, count: 1, value: meta.height },
      { tag: 258, type: 3, count: 1, value: bitsPerSample },
      { tag: 259, type: 3, count: 1, value: 1 },
      { tag: 262, type: 3, count: 1, value: 1 },
      { tag: 273, type: 4, count: chunks.length, value: new Array(chunks.length).fill(0) },
      { tag: 277, type: 3, count: 1, value: 1 },
      { tag: 278, type: 4, count: 1, value: rowsPerStrip },
      { tag: 279, type: 4, count: stripByteCounts.length, value: stripByteCounts },
      { tag: 270, type: 2, count: new TextEncoder().encode(descriptionText).length, value: descriptionText },
      { tag: 284, type: 3, count: 1, value: 1 },
      { tag: 305, type: 2, count: new TextEncoder().encode(softwareText).length, value: softwareText },
      { tag: 339, type: 3, count: 1, value: sampleFormat },
      { tag: 33550, type: 12, count: 3, value: [Math.abs(meta.resolution[0]), Math.abs(meta.resolution[1]), 0] },
      { tag: 33922, type: 12, count: 6, value: [0, 0, 0, meta.origin[0], meta.origin[1], 0] },
      { tag: 34735, type: 3, count: geoKeyValues.length, value: geoKeyValues },
      { tag: 42113, type: 2, count: noDataText.length, value: noDataText }
    ].sort((a, b) => a.tag - b.tag);

    const typeSize = { 2: 1, 3: 2, 4: 4, 12: 8 };
    const ifdOffset = 8;
    const ifdBytes = 2 + tags.length * 12 + 4;
    let extraOffset = ifdOffset + ifdBytes;
    for (const tag of tags) {
      const size = typeSize[tag.type] * tag.count;
      if (size <= 4) continue;
      const alignment = tag.type === 12 ? 8 : 2;
      extraOffset = Math.ceil(extraOffset / alignment) * alignment;
      tag.offset = extraOffset;
      extraOffset += size;
    }
    if (extraOffset % 2) extraOffset++;
    const pixelOffset = extraOffset;
    let runningOffset = pixelOffset;
    const stripOffsets = chunks.map((chunk, index) => {
      const current = runningOffset;
      runningOffset += stripByteCounts[index];
      return current;
    });
    assert(runningOffset <= 0xffffffff, 'The classic TIFF output would exceed its 4 GB file-size limit.');
    tags.find(tag => tag.tag === 273).value = stripOffsets;

    // Build only the small TIFF header in memory. Pixel strips are passed to Blob
    // as separate parts so the browser never needs one full-size output ArrayBuffer.
    const header = new Uint8Array(pixelOffset);
    const view = new DataView(header.buffer);
    view.setUint16(0, 0x4949, true);
    view.setUint16(2, 42, true);
    view.setUint32(4, ifdOffset, true);
    view.setUint16(ifdOffset, tags.length, true);
    let entryOffset = ifdOffset + 2;
    for (const tag of tags) {
      view.setUint16(entryOffset, tag.tag, true);
      view.setUint16(entryOffset + 2, tag.type, true);
      view.setUint32(entryOffset + 4, tag.count, true);
      const size = typeSize[tag.type] * tag.count;
      if (size > 4) {
        view.setUint32(entryOffset + 8, tag.offset, true);
        if (tag.type === 3) tag.value.forEach((value, i) => view.setUint16(tag.offset + i * 2, value, true));
        else if (tag.type === 4) tag.value.forEach((value, i) => view.setUint32(tag.offset + i * 4, value, true));
        else if (tag.type === 12) tag.value.forEach((value, i) => view.setFloat64(tag.offset + i * 8, value, true));
        else if (tag.type === 2) header.set(new TextEncoder().encode(tag.value), tag.offset);
      } else if (tag.type === 2) {
        header.set(new TextEncoder().encode(tag.value), entryOffset + 8);
      } else if (tag.type === 3) {
        view.setUint16(entryOffset + 8, tag.value, true);
      } else if (tag.type === 4) {
        view.setUint32(entryOffset + 8, tag.value, true);
      }
      entryOffset += 12;
    }
    view.setUint32(entryOffset, 0, true);

    const littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
    const parts = [header];
    for (const chunk of chunks) {
      if (bitsPerSample === 8) {
        parts.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      } else if (chunk instanceof Float32Array && littleEndian) {
        parts.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      } else {
        const bytes = new Uint8Array(chunk.length * 4);
        const dataView = new DataView(bytes.buffer);
        for (let i = 0; i < chunk.length; i++) dataView.setFloat32(i * 4, Number.isFinite(Number(chunk[i])) ? Number(chunk[i]) : NaN, true);
        parts.push(bytes);
      }
    }

    const blob = new Blob(parts, { type: 'image/tiff' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function csvCell(value) {
    let text = String(value ?? '');
    if (typeof value !== 'number' && /^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function downloadText(content, mime, fileName) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function areaLabel(areaM2) {
    if (!Number.isFinite(areaM2)) return 'Not available for this CRS';
    return areaM2 >= 1000000 ? `${(areaM2 / 1000000).toFixed(3)} km²` : `${Math.round(areaM2).toLocaleString()} m²`;
  }

  root.VaanamRaster = {
    NODATA, MAX_PIXELS, MAX_FILE_BYTES,
    openRaster, openRasterSource, readRasterWindow, assertSameGrid, calculateLST, calculateChange,
    analyzeLSTStream, analyzeChangeStream, makePreviewCanvas, leafletBounds, writeGeoTIFF, downloadText, csvCell, areaLabel
  };
})(typeof window !== 'undefined' ? window : globalThis);
