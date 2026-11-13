(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const Engine = window.VaanamRaster;
  let map = null, baseLayer = null, resultOverlay = null, result = null;
  let analysisGeneration = 0;
  let beforeMeta = null, afterMeta = null;

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (value, digits = 2) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : '—';
  const dateValue = id => $(id).value || 'Not supplied';
  const dateLabel = () => {
    const a = dateValue('beforeDate'), b = dateValue('afterDate');
    return `${a} → ${b}`;
  };

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
      $('mapEmpty').hidden = false;
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
    baseLayer = L.tileLayer(config.url, { maxZoom: name === 'satellite' ? 19 : 19, attribution: config.attribution, crossOrigin: true }).addTo(map);
  }

  function clearOverlay() {
    if (map && resultOverlay) map.removeLayer(resultOverlay);
    resultOverlay = null;
    $('mapLegend').hidden = true;
    $('mapEmpty').hidden = false;
  }

  function showOverlay(rasterResult) {
    if (!map) return;
    try {
      const canvas = Engine.makePreviewCanvas(rasterResult, 'change');
      const bounds = Engine.leafletBounds(rasterResult.meta);
      if (resultOverlay) map.removeLayer(resultOverlay);
      resultOverlay = L.imageOverlay(canvas.toDataURL('image/png'), bounds, { opacity: .9, interactive: false }).addTo(map);
      map.fitBounds(bounds, { padding: [18, 18], maxZoom: 15 });
      $('mapEmpty').hidden = true;
      $('mapLegend').hidden = false;
      $('mapTitle').textContent = 'Pixel change detection';
      $('mapSubtitle').textContent = `EPSG:${rasterResult.meta.epsg} · ${rasterResult.meta.width.toLocaleString()} × ${rasterResult.meta.height.toLocaleString()} pixels`;
    } catch (error) {
      $('mapEmpty').hidden = false;
      $('mapEmpty').innerHTML = `<div><span class="raster-empty-icon">!</span><b>Map overlay unavailable</b><p>${escapeHTML(error.message)} Downloadable analysis statistics are still available.</p></div>`;
      $('mapSubtitle').textContent = `Analysis complete · EPSG:${rasterResult.meta.epsg}`;
    }
  }

  function setFileMeta(inputId, outputId) {
    analysisGeneration++;
    const file = $(inputId).files?.[0];
    $(outputId).textContent = file ? `${file.name} · ${(file.size / 1048576).toFixed(2)} MB` : 'No file selected';
    $('runChangeBtn').disabled = !($('beforeFile').files?.[0] && $('afterFile').files?.[0]);
    $('runChangeBtn').textContent = 'Run change detection';
    result = null;
    beforeMeta = null;
    afterMeta = null;
    clearOverlay();
    $('changeResults').innerHTML = '<div class="raster-empty-results"><span class="raster-empty-icon">◫</span><strong>Ready to analyse</strong><p>Run the comparison after selecting both rasters.</p></div>';
    $('resultDateLabel').textContent = 'No analysis has been run yet.';
    $('changeRunStatus').textContent = $('runChangeBtn').disabled ? 'Select both rasters to begin.' : 'Both files selected. Check the settings, then run.';
  }

  function renderResults(output) {
    const s = output.stats;
    const unit = $('changeUnits').value.trim() || 'input units';
    const area = Engine.areaLabel(s.areaM2);
    const beforeDate = dateValue('beforeDate');
    const afterDate = dateValue('afterDate');
    $('resultDateLabel').textContent = `${beforeDate} → ${afterDate}`;
    const total = s.count || 1;
    const bars = [
      { label: 'Decrease', count: s.decrease, color: '#4387be' },
      { label: 'Stable', count: s.stable, color: '#d3b074' },
      { label: 'Increase', count: s.increase, color: '#dc644a' }
    ].map(item => `<div class="raster-bar-row"><span>${item.label}</span><div class="raster-bar"><i style="width:${(item.count / total * 100).toFixed(2)}%;background:${item.color}"></i></div><b>${fmt(item.count / total * 100, 1)}%</b></div>`).join('');

    $('changeResults').innerHTML = `
      <div class="raster-metric-grid">
        <div class="raster-metric"><small>VALID PIXELS</small><strong>${fmt(s.count, 0)}</strong><span>Overlap after NoData masking</span></div>
        <div class="raster-metric"><small>PIXELS CHANGED</small><strong>${fmt(s.changed, 0)}</strong><span>${fmt(s.changedPercent, 1)}% of valid pixels</span></div>
        <div class="raster-metric"><small>MEAN CHANGE</small><strong>${fmt(s.mean, 3)}</strong><span>${escapeHTML(unit)} · after − before</span></div>
        <div class="raster-metric"><small>MEAN ABSOLUTE CHANGE</small><strong>${fmt(s.meanAbsoluteChange, 3)}</strong><span>${escapeHTML(unit)}</span></div>
      </div>
      <section class="raster-result-section"><h3>CHANGE BREAKDOWN</h3>${bars}</section>
      <section class="raster-result-section"><h3>PIXEL STATISTICS</h3>
        <div class="raster-stat-row"><span>Decrease pixels</span><b>${fmt(s.decrease, 0)} · ${fmt(s.decreasePercent, 1)}%</b></div>
        <div class="raster-stat-row"><span>Increase pixels</span><b>${fmt(s.increase, 0)} · ${fmt(s.increasePercent, 1)}%</b></div>
        <div class="raster-stat-row"><span>Within threshold</span><b>${fmt(s.stable, 0)} · ${fmt(s.stablePercent, 1)}%</b></div>
        <div class="raster-stat-row"><span>Minimum / maximum</span><b>${fmt(s.min, 3)} / ${fmt(s.max, 3)} ${escapeHTML(unit)}</b></div>
        <div class="raster-stat-row"><span>Standard deviation</span><b>${fmt(s.stdDev, 3)} ${escapeHTML(unit)}</b></div>
        <div class="raster-stat-row"><span>Valid area estimate</span><b>${escapeHTML(area)}</b></div>
      </section>
      <section class="raster-result-section"><h3>GRID CHECK</h3>
        <div class="raster-stat-row"><span>Coordinate system</span><b>EPSG:${output.meta.epsg}</b></div>
        <div class="raster-stat-row"><span>Raster size</span><b>${output.meta.width.toLocaleString()} × ${output.meta.height.toLocaleString()}</b></div>
        <div class="raster-stat-row"><span>Threshold</span><b>±${fmt(output.threshold, 4)} ${escapeHTML(unit)}</b></div>
        <div class="raster-stat-row"><span>Difference</span><b>Later − earlier</b></div>
      </section>
      <section class="raster-result-section"><h3>EXPORT</h3>
        <div class="raster-result-actions">
          <button class="raster-button primary small" id="exportChangeTiff">Download difference GeoTIFF</button>
          <button class="raster-button secondary small" id="exportChangeClasses">Download class GeoTIFF</button>
          <button class="raster-button secondary small" id="exportChangeCsv">Download summary CSV</button>
        </div>
      </section>
      <div class="raster-method"><b>Method:</b> paired pixel subtraction (after − before). Increase/decrease classes are based on the threshold supplied above. The percentage denominator is valid overlapping pixels only; this is not an object-based classification or proof of real-world cause.</div>`;

    $('exportChangeTiff').addEventListener('click', async () => {
      try { await Engine.writeGeoTIFF(output, 'change-detection-difference.tif', { description: 'Pixel difference (later minus earlier) calculated by VAANAM from user-supplied raster inputs. Source data ownership, copyright, licence and attribution remain with the respective data providers. Preserve the original source citations when redistributing this derived file.' }); toast('Difference GeoTIFF exported.'); }
      catch (error) { toast(error.message || 'GeoTIFF export failed.'); }
    });
    $('exportChangeClasses').addEventListener('click', async () => {
      try {
        await Engine.writeGeoTIFF(output, 'change-detection-classes.tif', { dataKey: 'classChunks', bitsPerSample: 8, sampleFormat: 1, noData: '0', description: 'Change classes calculated by VAANAM from user-supplied raster inputs: 1 decrease, 2 within threshold, 3 increase. Source data ownership, copyright, licence and attribution remain with the respective data providers.' });
        toast('Change class GeoTIFF exported. Codes: 1 decrease, 2 within threshold, 3 increase.');
      } catch (error) { toast(error.message || 'Class GeoTIFF export failed.'); }
    });
    $('exportChangeCsv').addEventListener('click', () => {
      const rows = [
        ['metric', 'value', 'unit'],
        ['processing_software', 'VAANAM Spatial Intelligence Platform', ''],
        ['analysis_method', 'Pixel-wise difference: after minus before', ''],
        ['source_rights', 'Source data rights and required attribution remain with the respective input data providers.', ''],
        ['source_citation_note', 'Record and retain the original data provider, dataset title, licence and citation for both input rasters.', ''],
        ['before_file', $('beforeFile').files[0]?.name || '', ''],
        ['after_file', $('afterFile').files[0]?.name || '', ''],
        ['before_date', beforeDate, ''],
        ['after_date', afterDate, ''],
        ['crs', `EPSG:${output.meta.epsg}`, ''],
        ['width', output.meta.width, 'pixels'],
        ['height', output.meta.height, 'pixels'],
        ['threshold', output.threshold, unit],
        ['valid_pixels', s.count, 'pixels'],
        ['decrease_pixels', s.decrease, 'pixels'],
        ['stable_pixels', s.stable, 'pixels'],
        ['increase_pixels', s.increase, 'pixels'],
        ['changed_percent', s.changedPercent, '%'],
        ['mean_change', s.mean, unit],
        ['mean_absolute_change', s.meanAbsoluteChange, unit],
        ['minimum_change', s.min, unit],
        ['maximum_change', s.max, unit],
        ['standard_deviation', s.stdDev, unit],
        ['valid_area_estimate', s.areaM2 ?? '', 'm²']
      ];
      const csv = rows.map(row => row.map(Engine.csvCell).join(',')).join('\r\n');
      Engine.downloadText('\ufeff' + csv, 'text/csv;charset=utf-8', 'change-detection-summary.csv');
    });
  }

  async function runAnalysis() {
    const beforeFile = $('beforeFile').files?.[0];
    const afterFile = $('afterFile').files?.[0];
    if (!beforeFile || !afterFile) { toast('Select both the earlier and later rasters.'); return; }
    const threshold = Number($('changeThreshold').value);
    if (!Number.isFinite(threshold) || threshold < 0) { toast('Enter a valid non-negative change threshold.'); return; }
    const d1 = $('beforeDate').value, d2 = $('afterDate').value;
    if (d1 && d2 && d1 >= d2) { toast('The later observation date must be after the earlier date.'); return; }

    const generation = ++analysisGeneration;
    const button = $('runChangeBtn');
    button.disabled = true;
    button.textContent = 'Analysing…';
    $('changeRunStatus').textContent = 'Opening GeoTIFF metadata and checking their geospatial grids…';
    try {
      const [before, after] = await Promise.all([Engine.openRasterSource(beforeFile), Engine.openRasterSource(afterFile)]);
      if (generation !== analysisGeneration) return;
      beforeMeta = before.meta;
      afterMeta = after.meta;
      Engine.assertSameGrid(before.meta, after.meta, 'Later raster');
      $('changeRunStatus').textContent = 'Grid matched. Reading and comparing raster tiles…';
      result = await Engine.analyzeChangeStream({
        beforeSource: before, afterSource: after, threshold,
        onProgress: message => { if (generation === analysisGeneration) $('changeRunStatus').textContent = message; },
        isCancelled: () => generation !== analysisGeneration
      });
      if (generation !== analysisGeneration) return;
      renderResults(result);
      showOverlay(result);
      $('changeRunStatus').textContent = 'Analysis complete. Input bands were processed locally in row tiles; the full-resolution result is ready for export.';
      window.dispatchEvent(new CustomEvent('vaanam:workspace-result', { detail: { kind: 'change-detection', label: 'Change detection', summary: { before: $('beforeFile').files[0]?.name || '', after: $('afterFile').files[0]?.name || '', threshold, units: $('changeUnits').value, ...result.stats, epsg: result.meta.epsg, width: result.meta.width, height: result.meta.height } } }));
      toast('Change detection completed.');
    } catch (error) {
      if (generation === analysisGeneration) {
        $('changeRunStatus').textContent = error.message || 'Analysis failed. Check the input rasters and retry.';
        toast(error.message || 'Change detection failed.');
      }
    } finally {
      if (generation === analysisGeneration) {
        button.disabled = !($('beforeFile').files?.[0] && $('afterFile').files?.[0]);
        button.textContent = 'Run change detection';
      }
    }
  }

  $('beforeFile').addEventListener('change', () => setFileMeta('beforeFile', 'beforeFileMeta'));
  $('afterFile').addEventListener('change', () => setFileMeta('afterFile', 'afterFileMeta'));
  $('runChangeBtn').addEventListener('click', runAnalysis);
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
