(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const Engine = window.VaanamRaster;
  let map = null, baseLayer = null, resultOverlay = null, result = null;
  let analysisGeneration = 0;

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (value, digits = 2) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : '—';
  const areaText = area => Engine.areaLabel(area);
  let toastTimer = null;

  function toast(message) {
    const el = $('rasterToast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
  }

  function initMap() {
    if (!window.L) {
      $('mapSubtitle').textContent = 'Map library unavailable. Statistics can still be calculated.';
      return;
    }
    map = L.map('analysisMap', { zoomControl: true, preferCanvas: true, worldCopyJump: true }).setView([20.5937, 78.9629], 5);
    setBasemap('osm');
    window.addEventListener('resize', () => map?.invalidateSize({ pan: false }));
  }

  function setBasemap(name) {
    if (!map) return;
    if (baseLayer) map.removeLayer(baseLayer);
    const config = name === 'satellite'
      ? { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> · Sources: Esri, Maxar, Earthstar Geographics and the GIS User Community' }
      : { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>' };
    baseLayer = L.tileLayer(config.url, { maxZoom: 19, attribution: config.attribution, crossOrigin: true }).addTo(map);
  }

  function clearOverlay() {
    if (map && resultOverlay) map.removeLayer(resultOverlay);
    resultOverlay = null;
    $('mapLegend').hidden = true;
    $('mapEmpty').hidden = false;
  }

  function showOverlay(output) {
    if (!map) return;
    try {
      const canvas = Engine.makePreviewCanvas(output, 'lst');
      const bounds = Engine.leafletBounds(output.meta);
      if (resultOverlay) map.removeLayer(resultOverlay);
      resultOverlay = L.imageOverlay(canvas.toDataURL('image/png'), bounds, { opacity: .9, interactive: false }).addTo(map);
      map.fitBounds(bounds, { padding: [18, 18], maxZoom: 15 });
      $('mapEmpty').hidden = true;
      $('mapLegend').hidden = false;
      $('legendMin').textContent = `${fmt(output.stats.min, 1)} °C`;
      $('legendMax').textContent = `${fmt(output.stats.max, 1)} °C`;
      $('mapTitle').textContent = 'Land surface temperature';
      $('mapSubtitle').textContent = `EPSG:${output.meta.epsg} · ${output.meta.width.toLocaleString()} × ${output.meta.height.toLocaleString()} pixels`;
    } catch (error) {
      $('mapEmpty').hidden = false;
      $('mapEmpty').innerHTML = `<div><span class="raster-empty-icon">!</span><b>Map overlay unavailable</b><p>${escapeHTML(error.message)} Downloadable temperature data and statistics are still available.</p></div>`;
      $('mapSubtitle').textContent = `Calculation complete · EPSG:${output.meta.epsg}`;
    }
  }

  function setFileMeta(inputId, outputId, emptyLabel) {
    analysisGeneration++;
    const file = $(inputId).files?.[0];
    $(outputId).textContent = file ? `${file.name} · ${(file.size / 1048576).toFixed(2)} MB` : emptyLabel;
    $('runLstBtn').disabled = !$('stFile').files?.[0];
    $('runLstBtn').textContent = 'Calculate LST';
    result = null;
    clearOverlay();
    $('lstResults').innerHTML = '<div class="raster-empty-results"><span class="raster-empty-icon">◫</span><strong>Ready for thermal analysis</strong><p>Click Calculate LST to process the selected inputs.</p></div>';
    $('resultDateLabel').textContent = 'No calculation has been run yet.';
    if (inputId === 'qaFile') {
      $('excludeWater').disabled = !file;
      if (!file) $('excludeWater').checked = false;
      $('lstMaskWarning').textContent = file
        ? 'QA_PIXEL will be checked against the ST_B10 raster. Fill, dilated cloud, cirrus, cloud, cloud shadow and snow flags are excluded.'
        : 'For a defensible result, upload the matching QA_PIXEL file. Without it, the calculation cannot identify cloud, shadow or snow pixels and the output will be marked unmasked.';
      $('lstMaskWarning').classList.toggle('success', Boolean(file));
      $('lstMaskWarning').classList.toggle('warning', !file);
    }
  }

  function inferDate(fileName) {
    const match = String(fileName || '').match(/(?:^|_)(20\d{6})(?:_|\.)/);
    if (!match) return '';
    const value = match[1];
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }

  function renderResults(output, quality) {
    const s = output.stats;
    const date = $('lstDate').value || inferDate($('stFile').files[0]?.name) || 'Not supplied';
    const validPercent = s.count / output.meta.pixelCount * 100;
    $('resultDateLabel').textContent = `Observation: ${date}`;
    const area = areaText(s.areaM2);
    const qaStatus = quality.hasQA ? 'QA_PIXEL cloud / shadow / snow mask applied' : 'No QA_PIXEL mask supplied';
    const uncertaintyStatus = quality.hasSTQA ? `ST_QA uncertainty threshold ≤ ${fmt(quality.maxUncertainty, 1)} K` : 'No ST_QA uncertainty band supplied';

    $('lstResults').innerHTML = `
      <div class="raster-metric-grid">
        <div class="raster-metric"><small>MEAN LST</small><strong>${fmt(s.mean, 1)} °C</strong><span>Valid pixels only</span></div>
        <div class="raster-metric"><small>MEDIAN LST</small><strong>${fmt(s.median, 1)} °C</strong><span>512-bin approximation</span></div>
        <div class="raster-metric"><small>MAXIMUM LST</small><strong>${fmt(s.max, 1)} °C</strong><span>Valid pixels only</span></div>
        <div class="raster-metric"><small>VALID AREA</small><strong>${s.areaM2 == null ? '—' : (s.areaM2 >= 1000000 ? `${fmt(s.areaM2 / 1000000, 2)} km²` : `${fmt(s.areaM2, 0)} m²`)}</strong><span>${fmt(validPercent, 1)}% of raster</span></div>
      </div>
      <section class="raster-result-section"><h3>TEMPERATURE STATISTICS</h3>
        <div class="raster-stat-row"><span>Minimum temperature</span><b>${fmt(s.min, 2)} °C</b></div>
        <div class="raster-stat-row"><span>Maximum temperature</span><b>${fmt(s.max, 2)} °C</b></div>
        <div class="raster-stat-row"><span>Mean temperature</span><b>${fmt(s.mean, 2)} °C</b></div>
        <div class="raster-stat-row"><span>Median (approx.)</span><b>${fmt(s.median, 2)} °C</b></div>
        <div class="raster-stat-row"><span>90th percentile (approx.)</span><b>${fmt(s.p90, 2)} °C</b></div>
        <div class="raster-stat-row"><span>Standard deviation</span><b>${fmt(s.stdDev, 2)} °C</b></div>
        <div class="raster-stat-row"><span>Valid pixels</span><b>${fmt(s.count, 0)} / ${fmt(output.meta.pixelCount, 0)}</b></div>
        <div class="raster-stat-row"><span>Estimated valid area</span><b>${escapeHTML(area)}</b></div>
      </section>
      <section class="raster-result-section"><h3>QUALITY CONTROL</h3>
        <div class="raster-stat-row"><span>Invalid / fill</span><b>${fmt(output.invalid, 0)}</b></div>
        <div class="raster-stat-row"><span>QA_PIXEL rejected</span><b>${fmt(output.cloudMasked, 0)}</b></div>
        <div class="raster-stat-row"><span>Water excluded</span><b>${fmt(output.waterMasked, 0)}</b></div>
        <div class="raster-stat-row"><span>High uncertainty</span><b>${fmt(output.uncertaintyMasked, 0)}</b></div>
        <div class="raster-stat-row"><span>Cloud mask</span><b>${quality.hasQA ? 'Applied' : 'Not applied'}</b></div>
        <div class="raster-stat-row"><span>Uncertainty mask</span><b>${quality.hasSTQA ? 'Applied' : 'Not applied'}</b></div>
      </section>
      <section class="raster-result-section"><h3>DATA & EXPORT</h3>
        <div class="raster-stat-row"><span>Input</span><b>${escapeHTML($('stFile').files[0]?.name || '')}</b></div>
        <div class="raster-stat-row"><span>CRS / raster size</span><b>EPSG:${output.meta.epsg} · ${output.meta.width} × ${output.meta.height}</b></div>
        <div class="raster-stat-row"><span>Scale applied</span><b>DN × 0.00341802 + 149 K</b></div>
        <div class="raster-result-actions">
          <button class="raster-button primary small" id="exportLstTiff">Download LST GeoTIFF</button>
          <button class="raster-button secondary small" id="exportLstCsv">Download summary CSV</button>
        </div>
      </section>
      <div class="raster-method"><b>Quality status:</b> ${escapeHTML(qaStatus)}. ${escapeHTML(uncertaintyStatus)}. This is satellite-derived land surface temperature, not near-surface air temperature. USGS documents remaining product limitations, including gaps where ASTER GED emissivity data are unavailable and known cloud-related errors.</div>`;

    $('exportLstTiff').addEventListener('click', async () => {
      try { await Engine.writeGeoTIFF(output, 'landsat-land-surface-temperature-celsius.tif', { description: 'Land surface temperature derived from user-supplied Landsat 8/9 Collection 2 Level-2 ST_B10. USGS is the source of the Landsat data; acknowledge USGS and retain the product-specific scene citation. Landsat data are public domain. VAANAM performs the calculation only.' }); toast('LST GeoTIFF exported.'); }
      catch (error) { toast(error.message || 'GeoTIFF export failed.'); }
    });
    $('exportLstCsv').addEventListener('click', () => {
      const rows = [
        ['metric', 'value', 'unit'],
        ['source_dataset', 'User-supplied Landsat 8/9 Collection 2 Level-2 ST_B10', ''],
        ['source_credit', 'U.S. Geological Survey (USGS)', ''],
        ['source_citation', 'Use the product-specific Landsat scene citation supplied by USGS / EarthExplorer.', ''],
        ['source_rights', 'Landsat data are public domain; USGS acknowledgement requested.', ''],
        ['source_url', 'https://www.usgs.gov/landsat-missions/landsat-collection-2-level-2-science-products', ''],
        ['processing_software', 'VAANAM Spatial Intelligence Platform', ''],
        ['input_file', $('stFile').files[0]?.name || '', ''],
        ['observation_date', date, ''],
        ['crs', `EPSG:${output.meta.epsg}`, ''],
        ['width', output.meta.width, 'pixels'],
        ['height', output.meta.height, 'pixels'],
        ['mean', s.mean, '°C'],
        ['median_approx', s.median, '°C'],
        ['minimum', s.min, '°C'],
        ['maximum', s.max, '°C'],
        ['p90_approx', s.p90, '°C'],
        ['standard_deviation', s.stdDev, '°C'],
        ['valid_pixels', s.count, 'pixels'],
        ['invalid_or_fill_pixels', output.invalid, 'pixels'],
        ['qa_pixel_rejected', output.cloudMasked, 'pixels'],
        ['water_excluded', output.waterMasked, 'pixels'],
        ['high_uncertainty_excluded', output.uncertaintyMasked, 'pixels'],
        ['valid_area_estimate', s.areaM2 ?? '', 'm²'],
        ['qa_pixel_mask_applied', quality.hasQA, 'boolean'],
        ['st_qa_mask_applied', quality.hasSTQA, 'boolean'],
        ['scale_factor', 0.00341802, 'K per DN'],
        ['offset', 149, 'K']
      ];
      const csv = rows.map(row => row.map(Engine.csvCell).join(',')).join('\r\n');
      Engine.downloadText('\ufeff' + csv, 'text/csv;charset=utf-8', 'landsat-lst-summary.csv');
    });
  }

  async function runAnalysis() {
    const stFile = $('stFile').files?.[0];
    if (!stFile) { toast('Select the Landsat ST_B10 GeoTIFF first.'); return; }
    const hasQA = Boolean($('qaFile').files?.[0]);
    const hasSTQA = Boolean($('stQaFile').files?.[0]);
    const maxUncertainty = Number($('maxUncertainty').value);
    if (hasSTQA && (!Number.isFinite(maxUncertainty) || maxUncertainty < 0)) {
      toast('Enter a valid non-negative ST_QA uncertainty threshold.'); return;
    }

    const generation = ++analysisGeneration;
    const qaFile = $('qaFile').files?.[0];
    const stQaFile = $('stQaFile').files?.[0];
    const excludeWater = $('excludeWater').checked;
    const button = $('runLstBtn');
    button.disabled = true;
    button.textContent = 'Calculating…';
    $('lstRunStatus').textContent = 'Opening ST_B10 and optional QA metadata…';
    try {
      const stPromise = Engine.openRasterSource(stFile);
      const qaPromise = qaFile ? Engine.openRasterSource(qaFile) : Promise.resolve(null);
      const stQaPromise = stQaFile ? Engine.openRasterSource(stQaFile) : Promise.resolve(null);
      const [st, qa, stQa] = await Promise.all([stPromise, qaPromise, stQaPromise]);
      if (generation !== analysisGeneration) return;
      if (qa) Engine.assertSameGrid(st.meta, qa.meta, 'QA_PIXEL raster');
      if (stQa) Engine.assertSameGrid(st.meta, stQa.meta, 'ST_QA raster');
      $('lstRunStatus').textContent = 'Applying Landsat scale factors and quality masks in tiles…';
      result = await Engine.analyzeLSTStream({
        stSource: st, qaSource: qa, stQaSource: stQa, excludeWater, maxUncertainty,
        onProgress: message => { if (generation === analysisGeneration) $('lstRunStatus').textContent = message; },
        isCancelled: () => generation !== analysisGeneration
      });
      const quality = { hasQA: Boolean(qa), hasSTQA: Boolean(stQa), maxUncertainty };
      if (generation !== analysisGeneration) return;
      renderResults(result, quality);
      showOverlay(result);
      $('lstRunStatus').textContent = qa ? 'Calculation complete. QA_PIXEL mask applied; full-resolution output is ready.' : 'Calculation complete without a cloud / shadow mask. Add QA_PIXEL for a stronger result.';
      window.dispatchEvent(new CustomEvent('vaanam:workspace-result', { detail: { kind: 'land-surface-temperature', label: 'Land surface temperature', summary: { input: stFile.name, observationDate: $('lstDate').value || '', maxUncertainty, excludeWater, ...result.stats, epsg: result.meta.epsg, width: result.meta.width, height: result.meta.height } } }));
      toast(qa ? 'Land surface temperature calculated.' : 'LST calculated — cloud mask was not supplied.');
    } catch (error) {
      if (generation === analysisGeneration) {
        $('lstRunStatus').textContent = error.message || 'LST calculation failed. Check the input files and retry.';
        toast(error.message || 'LST calculation failed.');
      }
    } finally {
      if (generation === analysisGeneration) {
        button.disabled = !$('stFile').files?.[0];
        button.textContent = 'Calculate LST';
      }
    }
  }

  $('excludeWater').disabled = true;
  $('stFile').addEventListener('change', () => setFileMeta('stFile', 'stFileMeta', 'No file selected'));
  $('qaFile').addEventListener('change', () => setFileMeta('qaFile', 'qaFileMeta', 'No QA_PIXEL file selected'));
  $('stQaFile').addEventListener('change', () => setFileMeta('stQaFile', 'stQaFileMeta', 'No ST_QA file selected'));
  $('runLstBtn').addEventListener('click', runAnalysis);
  $('mapBasemap').addEventListener('change', e => setBasemap(e.target.value));
  initMap();
  window.VAANAMCloud?.registerAdapter('rasterWorkspace', {
    collect: () => ({
      basemap: $('mapBasemap').value,
      center: map ? [map.getCenter().lat, map.getCenter().lng] : null,
      zoom: map ? map.getZoom() : null
    }),
    restore: saved => {
      if (saved.basemap && ['osm', 'satellite'].includes(saved.basemap)) {
        $('mapBasemap').value = saved.basemap;
        setBasemap(saved.basemap);
      }
      if (map && Array.isArray(saved.center) && saved.center.length === 2 && saved.center.every(Number.isFinite)) {
        map.setView(saved.center, Number.isFinite(saved.zoom) ? saved.zoom : 5, { animate: false });
      }
    }
  });
})();
