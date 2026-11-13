(() => {
  'use strict';

  const mapElement = document.getElementById('downloadMap');
  if (!mapElement) return;

  if (!window.L) {
    mapElement.innerHTML = '<p class="map-unavailable">The map library could not be loaded. Refresh the page or check your internet connection.</p>';
    return;
  }

  const map = L.map(mapElement, {
    zoomControl: true,
    scrollWheelZoom: false,
    worldCopyJump: true,
    preferCanvas: true
  }).setView([20.5937, 78.9629], 5);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    crossOrigin: true
  }).addTo(map);

  window.getOSMMapBounds = () => map.getBounds();
  window.getVAANAMHomeMapView = () => ({ center: [map.getCenter().lat, map.getCenter().lng], zoom: map.getZoom() });
  window.setVAANAMHomeMapView = view => {
    if (Array.isArray(view?.center) && view.center.length === 2 && view.center.every(Number.isFinite)) {
      map.setView(view.center, Number.isFinite(view.zoom) ? view.zoom : 5, { animate: false });
    }
  };
  const announceMapMove = () => window.dispatchEvent(new Event('osm-map-moved'));
  map.on('moveend', announceMapMove);
  window.addEventListener('resize', () => map.invalidateSize({ pan: false }));
  window.addEventListener('load', () => window.setTimeout(() => {
    map.invalidateSize({ pan: false });
    announceMapMove();
  }, 120));
})();
