import { cat } from './constants.js';
import { esc, isFeatured } from './util.js';

let map, tiles, draft = null, pickCb = null;
const markers = new Map();
const dark = window.matchMedia('(prefers-color-scheme: dark)');

function setTiles() {
  tiles?.remove();
  const style = dark.matches ? 'dark_all' : 'rastertiles/voyager';
  tiles = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`, {
    maxZoom: 20, subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map);
}

const markerIcon = (p, selected) => {
  const c = cat(p.category); const f = isFeatured(p);
  return L.divIcon({
    className: '', iconSize: f ? [46, 46] : [38, 38], iconAnchor: f ? [23, 46] : [19, 38],
    html: `<div class="mk${f ? ' mk-featured' : ''}${selected ? ' mk-selected' : ''}" style="--c:${c.color}"><span>${c.emoji}</span></div>`,
  });
};

export function initMap(el, { onSelect, onContext }) {
  map = L.map(el, { zoomControl: false, worldCopyJump: true, minZoom: 2 }).setView([35, 10], 3);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  setTiles();
  dark.addEventListener?.('change', setTiles);
  map.on('click', (e) => { if (pickCb) { const cb = pickCb; stopPick(); cb(e.latlng.lat, e.latlng.lng); } });
  map.on('contextmenu', (e) => onContext?.(e.latlng.lat, e.latlng.lng));
  map._onSelect = onSelect;
  return map;
}

export function setMarkers(places, selectedId) {
  const ids = new Set(places.map((p) => p.id));
  for (const [id, m] of markers) if (!ids.has(id)) { m.remove(); markers.delete(id); }
  for (const p of places) {
    let m = markers.get(p.id);
    if (!m) {
      m = L.marker([p.lat, p.lng], { keyboard: true, title: p.name }).on('click', () => map._onSelect?.(p.id)).addTo(map);
      markers.set(p.id, m);
    }
    m.setLatLng([p.lat, p.lng]).setIcon(markerIcon(p, p.id === selectedId))
      .setZIndexOffset(p.id === selectedId ? 2000 : isFeatured(p) ? 1000 : 0);
    m.unbindTooltip().bindTooltip(esc(p.name), { direction: 'top', offset: [0, isFeatured(p) ? -46 : -38], className: 'mk-tip' });
  }
}

// Ist die Karte unsichtbar (z. B. am Handy in der Listenansicht), wird die
// gewünschte Ansicht gemerkt und beim nächsten Sichtbarwerden angewendet.
let pending = null;
const visible = () => { const s = map.getContainer(); return s.offsetWidth > 0 && s.offsetHeight > 0; };
function apply(fn) { if (visible()) { map.invalidateSize(); fn(); pending = null; } else pending = fn; }

export function fitTo(places) {
  if (!places.length) return;
  apply(() => map.fitBounds(L.latLngBounds(places.map((p) => [p.lat, p.lng])), { maxZoom: 13, padding: [40, 40] }));
}
export const flyTo = (lat, lng, zoom = 15) =>
  apply(() => map.flyTo([lat, lng], Math.max(zoom, map.getZoom()), { duration: 0.6 }));
export function refresh() {
  if (!map || !visible()) return;
  map.invalidateSize();
  if (pending) { const fn = pending; pending = null; fn(); }
}

export function setDraft(lat, lng, category, onMove) {
  const icon = L.divIcon({ className: '', iconSize: [38, 38], iconAnchor: [19, 38],
    html: `<div class="mk mk-draft" style="--c:${cat(category).color}"><span>${cat(category).emoji}</span></div>` });
  if (draft) draft.setLatLng([lat, lng]).setIcon(icon);
  else draft = L.marker([lat, lng], { icon, draggable: true, zIndexOffset: 3000 })
    .on('dragend', (e) => { const p = e.target.getLatLng(); onMove?.(p.lat, p.lng); }).addTo(map);
}
export function clearDraft() { draft?.remove(); draft = null; }

export function startPick(cb) { pickCb = cb; map.getContainer().classList.add('picking'); }
export function stopPick() { pickCb = null; map.getContainer().classList.remove('picking'); }
export const isPicking = () => !!pickCb;
