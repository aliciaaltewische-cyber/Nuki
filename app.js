import { store } from './storage.js';

const CATEGORIES = [
  { id: 'cafe', label: 'Café', icon: '☕' },
  { id: 'restaurant', label: 'Restaurant & Bar', icon: '🍽️' },
  { id: 'hotel', label: 'Unterkunft', icon: '🏨' },
  { id: 'park', label: 'Park & Hundewiese', icon: '🌳' },
  { id: 'beach', label: 'Hundestrand', icon: '🏖️' },
  { id: 'hike', label: 'Wanderweg', icon: '🥾' },
  { id: 'shop', label: 'Geschäft', icon: '🛍️' },
  { id: 'vet', label: 'Tierarzt', icon: '🩺' },
  { id: 'other', label: 'Sonstiges', icon: '📍' },
];
const AMENITIES = [
  { id: 'water', label: '💧 Wassernapf' },
  { id: 'treats', label: '🦴 Leckerlis' },
  { id: 'indoor', label: '🏠 Drinnen erlaubt' },
  { id: 'offleash', label: '🐕 Leinenfrei' },
  { id: 'fenced', label: '🚧 Eingezäunt' },
  { id: 'shade', label: '🌳 Schatten' },
  { id: 'bags', label: '🛍️ Kotbeutel' },
  { id: 'bigdogs', label: '🐕‍🦺 Große Hunde ok' },
];
const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const amenById = Object.fromEntries(AMENITIES.map((a) => [a.id, a]));

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : '');
const stars = (n) => (n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '');

let places = [];
let activeCat = 'all';
let query = '';
let editingId = null;
let picking = false;
const markers = new Map();

// ---------- Karte ----------
const map = L.map('map', { worldCopyJump: true }).setView([30, 10], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const pinIcon = (cat, draft = false) => L.divIcon({
  className: '', iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -32],
  html: `<div class="pin${draft ? ' draft' : ''}"><span>${(catById[cat] || catById.other).icon}</span></div>`,
});
let draftMarker = null;

function setDraft(lat, lng) {
  const f = $('#form');
  f.lat.value = lat; f.lng.value = lng;
  const hint = $('#pos-hint');
  hint.textContent = `Position gesetzt: ${(+lat).toFixed(5)}, ${(+lng).toFixed(5)}`;
  hint.classList.add('ok');
  if (draftMarker) draftMarker.setLatLng([lat, lng]);
  else draftMarker = L.marker([lat, lng], { icon: pinIcon(f.category.value, true), draggable: true })
    .on('dragend', (e) => { const p = e.target.getLatLng(); setDraft(p.lat, p.lng); })
    .addTo(map);
}
function clearDraft() { if (draftMarker) { draftMarker.remove(); draftMarker = null; } }

map.on('click', async (e) => {
  if (!picking) return;
  picking = false;
  map.getContainer().style.cursor = '';
  setDraft(e.latlng.lat, e.latlng.lng);
  $('#dlg').showModal();
  if (!$('#form').address.value) $('#form').address.value = await reverseGeocode(e.latlng.lat, e.latlng.lng);
});
// Rechtsklick / langes Drücken auf der Karte: direkt hier einen Ort anlegen
map.on('contextmenu', (e) => {
  openForm();
  setDraft(e.latlng.lat, e.latlng.lng);
  reverseGeocode(e.latlng.lat, e.latlng.lng).then((a) => { if (!$('#form').address.value) $('#form').address.value = a; });
});

// ---------- Geocoding (OpenStreetMap Nominatim) ----------
async function geocode(q) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { 'Accept-Language': 'de' } });
  const [hit] = await r.json();
  return hit ? { lat: +hit.lat, lng: +hit.lon, label: hit.display_name } : null;
}
async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${lat}&lon=${lng}`, { headers: { 'Accept-Language': 'de' } });
    return (await r.json()).display_name?.slice(0, 200) || '';
  } catch { return ''; }
}

// ---------- Darstellung ----------
function filtered() {
  const q = query.trim().toLowerCase();
  return places.filter((p) => (activeCat === 'all' || p.category === activeCat) &&
    (!q || [p.name, p.address, p.description, catById[p.category]?.label].some((v) => v?.toLowerCase().includes(q))));
}

function popupHtml(p) {
  const cat = catById[p.category] || catById.other;
  const url = safeUrl(p.website);
  return `<h3>${esc(p.name)}</h3>
    <div class="meta">${cat.icon} ${esc(cat.label)} ${p.rating ? `· <span title="${p.rating} von 5">${stars(p.rating)}</span>` : ''}</div>
    ${p.address ? `<p class="meta">${esc(p.address)}</p>` : ''}
    ${p.description ? `<p>${esc(p.description)}</p>` : ''}
    ${(p.amenities || []).length ? `<div class="tags">${p.amenities.map((a) => `<span class="tag">${esc(amenById[a]?.label || a)}</span>`).join('')}</div>` : ''}
    <div class="popup-actions">
      ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Website</a>` : ''}
      <a href="https://www.openstreetmap.org/directions?to=${p.lat},${p.lng}" target="_blank" rel="noopener noreferrer">Route</a>
      ${store.canEdit(p) ? `<button class="ghost" data-edit="${esc(p.id)}">Bearbeiten</button>` : ''}
    </div>`;
}

function render() {
  const list = filtered();
  const visible = new Set(list.map((p) => p.id));

  for (const [id, m] of markers) if (!visible.has(id)) { m.remove(); markers.delete(id); }
  for (const p of list) {
    let m = markers.get(p.id);
    if (!m) { m = L.marker([p.lat, p.lng]).addTo(map); markers.set(p.id, m); }
    m.setLatLng([p.lat, p.lng]).setIcon(pinIcon(p.category)).bindPopup(popupHtml(p));
  }

  $('#count').textContent = `${list.length} ${list.length === 1 ? 'Ort' : 'Orte'}`;
  $('#list').innerHTML = list.length ? list.map((p) => {
    const cat = catById[p.category] || catById.other;
    return `<li tabindex="0" data-id="${esc(p.id)}">
      <h3>${cat.icon} ${esc(p.name)}</h3>
      <div class="meta">${esc(cat.label)}${p.rating ? ' · ' + stars(p.rating) : ''}</div>
      ${p.address ? `<div class="meta">${esc(p.address)}</div>` : ''}
    </li>`;
  }).join('') : `<li class="empty">${places.length ? 'Keine Treffer für diesen Filter.' : 'Noch keine Orte – füge den ersten hundefreundlichen Ort hinzu! 🐶'}</li>`;
}

function renderFilters() {
  const all = [{ id: 'all', label: 'Alle', icon: '🐾' }, ...CATEGORIES];
  $('#filters').innerHTML = all.map((c) => `<button data-cat="${c.id}" aria-pressed="${c.id === activeCat}">${c.icon} ${esc(c.label)}</button>`).join('');
}

function focusPlace(id) {
  const p = places.find((x) => x.id === id);
  const m = markers.get(id);
  if (!p || !m) return;
  map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15));
  m.openPopup();
  if (window.matchMedia('(max-width: 760px)').matches) $('#map').scrollIntoView({ behavior: 'smooth' });
}

// ---------- Formular ----------
function buildForm() {
  const f = $('#form');
  f.category.innerHTML = CATEGORIES.map((c) => `<option value="${c.id}">${c.icon} ${esc(c.label)}</option>`).join('');
  $('#amenities').innerHTML = AMENITIES.map((a) => `<label><input type="checkbox" name="amenities" value="${a.id}">${esc(a.label)}</label>`).join('');
  $('#stars').innerHTML = [1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-label="${n} Sterne">★</button>`).join('');
  f.category.addEventListener('change', () => draftMarker?.setIcon(pinIcon(f.category.value, true)));
}
function setRating(n) {
  $('#form').rating.value = n;
  $('#stars').querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.star <= n));
}

function openForm(p = null) {
  const f = $('#form');
  f.reset();
  editingId = p?.id ?? null;
  $('#dlg-title').textContent = p ? 'Ort bearbeiten' : 'Neuen Ort hinzufügen';
  $('#btn-delete').hidden = !p;
  $('#pos-hint').textContent = 'Noch keine Position – Adresse suchen oder auf der Karte wählen.';
  $('#pos-hint').classList.remove('ok');
  f.lat.value = ''; f.lng.value = '';
  clearDraft();
  if (p) {
    for (const k of ['name', 'category', 'address', 'description', 'website']) f[k].value = p[k] || '';
    f.querySelectorAll('[name=amenities]').forEach((c) => { c.checked = (p.amenities || []).includes(c.value); });
    setDraft(p.lat, p.lng);
  }
  setRating(p?.rating || 0);
  map.closePopup();
  $('#dlg').showModal();
}
function closeForm() { $('#dlg').close(); clearDraft(); editingId = null; }

async function save(e) {
  e.preventDefault();
  const f = $('#form');
  if (!f.lat.value) {
    if (f.address.value.trim()) await doGeocode();
    if (!f.lat.value) return toast('Bitte zuerst die Position festlegen.');
  }
  const data = {
    name: f.name.value.trim(),
    category: f.category.value,
    address: f.address.value.trim(),
    lat: +f.lat.value, lng: +f.lng.value,
    amenities: [...f.querySelectorAll('[name=amenities]:checked')].map((c) => c.value),
    rating: +f.rating.value || 0,
    description: f.description.value.trim(),
    website: safeUrl(f.website.value.trim()),
  };
  try {
    if (editingId) {
      const updated = await store.update(editingId, data);
      places = places.map((x) => (x.id === editingId ? updated : x));
      toast('Gespeichert ✔');
    } else {
      const created = await store.add(data);
      places = [created, ...places];
      toast('Danke! Ort hinzugefügt 🐾');
    }
    const id = editingId;
    closeForm();
    render();
    focusPlace(id || places[0].id);
  } catch (err) { toast(err.message); }
}

async function doGeocode() {
  const f = $('#form');
  const q = f.address.value.trim() || f.name.value.trim();
  if (!q) return toast('Bitte Adresse eingeben.');
  $('#btn-geocode').disabled = true;
  try {
    const hit = await geocode(q);
    if (!hit) return toast('Adresse nicht gefunden.');
    if (!f.address.value.trim()) f.address.value = hit.label.slice(0, 200);
    setDraft(hit.lat, hit.lng);
    map.setView([hit.lat, hit.lng], 16);
  } catch { toast('Suche fehlgeschlagen – bitte später erneut versuchen.'); }
  finally { $('#btn-geocode').disabled = false; }
}

function locate(cb) {
  if (!navigator.geolocation) return toast('Standort wird nicht unterstützt.');
  navigator.geolocation.getCurrentPosition(
    (pos) => cb(pos.coords.latitude, pos.coords.longitude),
    () => toast('Standort konnte nicht ermittelt werden.'),
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

// ---------- Export / Import ----------
function exportJson() {
  const blob = new Blob([JSON.stringify(places, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'nuki-orte.json' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function importJson(file) {
  try {
    const data = JSON.parse(await file.text());
    const n = await store.importMany(Array.isArray(data) ? data : []);
    places = await store.list();
    render();
    toast(`${n} Orte importiert`);
  } catch (err) { toast('Import fehlgeschlagen: ' + err.message); }
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ---------- Events ----------
$('#btn-add').addEventListener('click', () => openForm());
$('#btn-cancel').addEventListener('click', closeForm);
$('#dlg').addEventListener('cancel', () => { if (!picking) clearDraft(); });
$('#form').addEventListener('submit', save);
$('#btn-geocode').addEventListener('click', doGeocode);
$('#form').address.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doGeocode(); } });
$('#stars').addEventListener('click', (e) => {
  const n = +e.target.dataset.star;
  if (n) setRating(+$('#form').rating.value === n ? 0 : n);
});
$('#btn-pick').addEventListener('click', () => {
  picking = true;
  $('#dlg').close();
  map.getContainer().style.cursor = 'crosshair';
  toast('Tippe auf die Karte, um den Ort zu setzen');
});
$('#btn-here').addEventListener('click', () => locate(async (lat, lng) => {
  setDraft(lat, lng);
  map.setView([lat, lng], 17);
  if (!$('#form').address.value) $('#form').address.value = await reverseGeocode(lat, lng);
}));
$('#btn-delete').addEventListener('click', async () => {
  if (!editingId || !confirm('Diesen Ort wirklich löschen?')) return;
  try {
    await store.remove(editingId);
    places = places.filter((x) => x.id !== editingId);
    closeForm(); render(); toast('Gelöscht');
  } catch (err) { toast(err.message); }
});
$('#btn-locate').addEventListener('click', () => locate((lat, lng) => map.setView([lat, lng], 13)));
$('#btn-export').addEventListener('click', exportJson);
$('#file-import').addEventListener('change', (e) => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ''; });
$('#search').addEventListener('input', (e) => { query = e.target.value; render(); });
$('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  activeCat = b.dataset.cat;
  renderFilters(); render();
});
$('#list').addEventListener('click', (e) => { const li = e.target.closest('[data-id]'); if (li) focusPlace(li.dataset.id); });
$('#list').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const li = e.target.closest('[data-id]'); if (li) focusPlace(li.dataset.id); } });
map.getContainer().addEventListener('click', (e) => {
  const id = e.target.closest('[data-edit]')?.dataset.edit;
  if (id) openForm(places.find((x) => x.id === id));
});

// ---------- Start ----------
buildForm();
renderFilters();
$('#mode').textContent = store.shared ? '🌍 Gemeinsame Datenbank' : '💾 Nur lokal gespeichert';
try { places = await store.list(); } catch (err) { toast('Laden fehlgeschlagen: ' + err.message); }
render();
if (places.length) map.fitBounds(L.latLngBounds(places.map((p) => [p.lat, p.lng])), { maxZoom: 12, padding: [30, 30] });
