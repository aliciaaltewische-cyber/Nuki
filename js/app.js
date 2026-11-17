import { api } from './backend/index.js';
import * as M from './map.js';
import * as V from './views.js';
import { icon, pawLogo } from './icons.js';
import { $, $$, esc, isFeatured, distanceKm, resizeImage, debounce, avatar } from './util.js';

// ---------- Zustand ----------
const S = {
  user: null, places: [], favs: new Set(),
  cat: 'all', q: '', sort: 'recommended', pos: null,
  community: null, stats: null, focus: null,
};
let route = { view: 'discover', id: null };
let afterLogin = null;
let pendingPhoto = null;
let lastListHash = '#/'; // wohin der Zurück-Button in der Detailansicht führt

// ---------- Hilfen ----------
let toastTimer;
function toast(msg, kind = '') {
  const t = $('#toast');
  t.textContent = msg; t.className = `show ${kind}`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = ''; }, 3200);
}
async function guard(fn) {
  try { return await fn(); } catch (e) { console.error(e); toast(e.message || 'Etwas ist schiefgelaufen.', 'error'); }
}
function requireLogin(then) {
  if (S.user) return then();
  afterLogin = then; openAuth();
}
const byId = (id) => S.places.find((p) => p.id === id);

function locate() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('Standort wird von diesem Gerät nicht unterstützt.'));
    navigator.geolocation.getCurrentPosition(
      (p) => { S.pos = { lat: p.coords.latitude, lng: p.coords.longitude }; res(S.pos); },
      () => rej(new Error('Standort konnte nicht ermittelt werden.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  });
}
async function geocode(q) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { 'Accept-Language': 'de' } });
  const [hit] = await r.json();
  return hit ? { lat: +hit.lat, lng: +hit.lon, label: hit.display_name } : null;
}
async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${lat}&lon=${lng}`, { headers: { 'Accept-Language': 'de' } });
    return ((await r.json()).display_name || '').slice(0, 200);
  } catch { return ''; }
}

// ---------- Filtern & Sortieren ----------
function filtered() {
  const q = S.q.trim().toLowerCase();
  const list = S.places.filter((p) => (S.cat === 'all' || p.category === S.cat)
    && (!q || [p.name, p.address, p.description].some((v) => v?.toLowerCase().includes(q))));
  const score = (p) => (p.avg_rating || 0) * Math.log2(2 + (p.review_count || 0));
  const sorters = {
    recommended: (a, b) => isFeatured(b) - isFeatured(a) || score(b) - score(a) || b.created_at.localeCompare(a.created_at),
    rating: (a, b) => (b.avg_rating || 0) - (a.avg_rating || 0) || (b.review_count || 0) - (a.review_count || 0),
    newest: (a, b) => b.created_at.localeCompare(a.created_at),
    nearby: (a, b) => (S.pos ? distanceKm(S.pos, a) - distanceKm(S.pos, b) : 0),
  };
  return list.sort(sorters[S.sort] || sorters.recommended);
}

// ---------- Routing ----------
function parseRoute() {
  const [v, id] = location.hash.replace(/^#\/?/, '').split('/');
  return { view: ['map', 'community', 'profile', 'place'].includes(v) ? v : 'discover', id: id ? decodeURIComponent(id) : null };
}
window.addEventListener('hashchange', () => {
  const prev = route.view;
  route = parseRoute();
  if (route.view !== 'place') lastListHash = location.hash || '#/';
  if (prev !== route.view || route.view === 'place') $('#panel').scrollTop = 0;
  render();
});

// ---------- Rendern ----------
function renderHeader() {
  $('#me-btn').innerHTML = S.user ? avatar(S.user.username, 34) : `<span class="btn btn-sm">${icon('user')} Anmelden</span>`;
  $('#me-btn').setAttribute('aria-label', S.user ? `Profil von ${S.user.username}` : 'Anmelden');
  $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === route.view
    || (a.dataset.nav === 'discover' && route.view === 'place')));
}

function render() {
  const app = $('#app');
  app.dataset.view = route.view;
  renderHeader();
  const panel = $('#panel');
  const list = filtered();

  if (route.view === 'place') {
    const p = byId(route.id);
    panel.innerHTML = V.placeView(p, S);
    if (p) { loadReviews(p.id); if (!S.focus) M.flyTo(p.lat, p.lng, 14); }
  } else if (route.view === 'community') {
    panel.innerHTML = V.communityView(S, S.community);
    loadCommunity();
  } else if (route.view === 'profile') {
    panel.innerHTML = V.profileView(S, S.stats);
    if (S.user) loadStats();
  } else {
    const featured = S.places.filter(isFeatured).sort(() => Math.random() - 0.5).slice(0, 8);
    panel.innerHTML = V.discoverView(S, list, featured);
  }

  M.setMarkers(route.view === 'place' && !list.some((p) => p.id === route.id) && byId(route.id) ? [...list, byId(route.id)] : list,
    route.view === 'place' ? route.id : S.focus);
  requestAnimationFrame(() => {
    M.refresh();
    if (S.focus && route.view === 'map') { const p = byId(S.focus); if (p) M.flyTo(p.lat, p.lng, 15); S.focus = null; }
  });
}
const renderSoon = debounce(render, 120);

async function loadReviews(placeId) {
  const reviews = await guard(() => api.listReviews(placeId)) || [];
  if (route.view !== 'place' || route.id !== placeId) return;
  const el = $('#review-list'); if (!el) return;
  el.innerHTML = V.reviewList(reviews, S.user);
  const mine = S.user && reviews.find((r) => r.user_id === S.user.id);
  const form = $('[data-form=review]');
  if (mine && form) {
    setStars(form.querySelector('[data-star-picker]'), mine.rating);
    form.text.value = mine.text || '';
    $('#my-review-note').textContent = 'Deine Bewertung – du kannst sie ändern';
  }
}
async function loadCommunity() {
  const data = await guard(() => api.community());
  if (!data) return;
  const changed = JSON.stringify(data) !== JSON.stringify(S.community);
  S.community = data;
  if (changed && route.view === 'community') $('#panel').innerHTML = V.communityView(S, S.community);
}
async function loadStats() {
  const stats = await guard(() => api.profile(S.user.id));
  const changed = JSON.stringify(stats) !== JSON.stringify(S.stats);
  S.stats = stats;
  if (changed && route.view === 'profile') $('#panel').innerHTML = V.profileView(S, S.stats);
}
async function reloadPlaces() {
  S.places = await guard(() => api.listPlaces()) || S.places;
}

// ---------- Modal ----------
const modal = $('#modal');
function openModal(html) {
  modal.innerHTML = html;
  if (!modal.open) modal.showModal();
  modal.querySelector('input:not([type=hidden]):not([type=file]):not([type=radio]), textarea')?.focus();
}
function closeModal() { modal.close(); }
modal.addEventListener('close', () => {
  if (M.isPicking()) return;
  M.clearDraft(); pendingPhoto = null;
});
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

function openAuth() { openModal(V.authForm(api.mode)); }

function setStars(picker, n) {
  if (!picker) return;
  picker.querySelector('input').value = n;
  picker.querySelectorAll('[data-star]').forEach((b) => {
    b.classList.toggle('on', +b.dataset.star <= n);
    b.setAttribute('aria-checked', String(+b.dataset.star === n));
  });
}

// ---------- Ort-Formular ----------
function openPlaceForm(p = null, pos = null) {
  pendingPhoto = null;
  openModal(V.placeForm(p));
  const f = $('[data-form=place]');
  f.dataset.id = p?.id || '';
  if (p) setPos(p.lat, p.lng, false);
  if (pos) { setPos(pos.lat, pos.lng); fillAddress(pos.lat, pos.lng); }
}
function setPos(lat, lng, fly = true) {
  const f = $('[data-form=place]'); if (!f) return;
  f.lat.value = lat; f.lng.value = lng;
  const hint = $('#pos-hint');
  hint.innerHTML = `${icon('check')} Position gesetzt · Marker auf der Karte verschiebbar`;
  hint.classList.add('ok');
  M.setDraft(lat, lng, f.category.value, (a, b) => setPos(a, b, false));
  if (fly) M.flyTo(lat, lng, 16);
}
async function fillAddress(lat, lng) {
  const f = $('[data-form=place]');
  if (f && !f.address.value.trim()) { const a = await reverseGeocode(lat, lng); if (a && !f.address.value.trim()) f.address.value = a; }
}
async function doGeocode() {
  const f = $('[data-form=place]');
  const q = f.address.value.trim() || f.name.value.trim();
  if (!q) return toast('Bitte eine Adresse eingeben.');
  const hit = await guard(() => geocode(q));
  if (!hit) return toast('Adresse nicht gefunden.');
  setPos(hit.lat, hit.lng);
}
function startPicking() {
  modal.close();
  $('#app').dataset.picking = 'true';
  M.refresh();
  M.startPick((lat, lng) => { endPicking(); setPos(lat, lng, false); fillAddress(lat, lng); });
}
function endPicking() {
  M.stopPick();
  delete $('#app').dataset.picking;
  modal.showModal();
}

async function submitPlace(f) {
  if (!f.lat.value) {
    if (f.address.value.trim()) await doGeocode();
    if (!f.lat.value) return toast('Bitte lege zuerst den Standort fest.', 'error');
  }
  const data = {
    name: f.name.value.trim(), category: f.category.value, address: f.address.value.trim(),
    lat: +f.lat.value, lng: +f.lng.value,
    amenities: $$('[name=amenities]:checked', f).map((c) => c.value),
    description: f.description.value.trim(), website: f.website.value.trim(),
  };
  if (data.website && !/^https?:\/\//i.test(data.website)) data.website = 'https://' + data.website;
  const id = f.dataset.id;
  const btn = f.querySelector('[type=submit]'); btn.disabled = true;
  const saved = await guard(async () => {
    if (id) return api.updatePlace(id, data, pendingPhoto);
    const p = await api.addPlace(data, pendingPhoto);
    const rating = +(f.rating?.value || 0);
    if (rating) await api.saveReview(p.id, { rating, text: '' });
    return p;
  });
  btn.disabled = false;
  if (!saved) return;
  closeModal();
  await reloadPlaces();
  S.stats = null; S.community = null;
  toast(id ? 'Änderungen gespeichert ✔' : 'Danke! Dein Ort ist jetzt für alle sichtbar 🐾', 'success');
  if (location.hash === `#/place/${saved.id}`) render(); else location.hash = `#/place/${saved.id}`;
}

// ---------- Aktionen ----------
const actions = {
  open: (el) => { location.hash = `#/place/${encodeURIComponent(el.dataset.id)}`; },
  back: () => { location.hash = lastListHash; },
  cat: (el) => { S.cat = el.dataset.cat; render(); },
  add: () => requireLogin(() => openPlaceForm()),
  edit: (el) => openPlaceForm(byId(el.dataset.id)),
  login: () => openAuth(),
  logout: () => guard(async () => { await api.signOut(); toast('Bis bald! 👋'); location.hash = '#/'; }),
  'edit-profile': () => openModal(V.profileForm(S.user)),
  'close-modal': () => closeModal(),
  fav: (el) => requireLogin(() => guard(async () => {
    const on = await api.toggleFavorite(el.dataset.id);
    on ? S.favs.add(el.dataset.id) : S.favs.delete(el.dataset.id);
    $$(`.fav[data-id="${CSS.escape(el.dataset.id)}"]`).forEach((b) => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    toast(on ? 'Zu Favoriten hinzugefügt ❤️' : 'Aus Favoriten entfernt');
    if (route.view === 'profile') render();
  })),
  share: async (el) => {
    const p = byId(el.dataset.id);
    const url = `${location.origin}${location.pathname}#/place/${encodeURIComponent(p.id)}`;
    if (navigator.share) { try { await navigator.share({ title: p.name, text: `${p.name} – hundefreundlich auf Nuki`, url }); } catch {} return; }
    try { await navigator.clipboard.writeText(url); toast('Link kopiert 🔗'); } catch { prompt('Link kopieren:', url); }
  },
  'show-map': (el) => { S.focus = el.dataset.id; location.hash = '#/map'; },
  feature: (el) => requireLogin(() => guard(async () => {
    const plans = await api.listPlans();
    if (!plans?.length) return toast('Derzeit sind keine Pakete verfügbar.');
    openModal(V.featureForm(byId(el.dataset.id), plans, api.mode));
  })),
  report: (el) => requireLogin(() => openModal(V.reportForm(byId(el.dataset.id)))),
  delete: (el) => {
    if (!confirm('Diesen Ort wirklich löschen? Bewertungen gehen dabei verloren.')) return;
    guard(async () => {
      await api.deletePlace(el.dataset.id);
      closeModal(); await reloadPlaces(); toast('Ort gelöscht'); location.hash = '#/profile';
    });
  },
  'del-review': (el) => {
    if (!confirm('Deine Bewertung löschen?')) return;
    guard(async () => { await api.deleteReview(el.dataset.id); await reloadPlaces(); render(); toast('Bewertung gelöscht'); });
  },
  geocode: () => doGeocode(),
  pick: () => startPicking(),
  'cancel-pick': () => endPicking(),
  here: () => guard(async () => { const p = await locate(); setPos(p.lat, p.lng); fillAddress(p.lat, p.lng); }),
  locate: () => guard(async () => {
    const p = await locate(); M.flyTo(p.lat, p.lng, 13);
    if (route.view === 'discover') { S.sort = 'nearby'; render(); }
  }),
};

document.addEventListener('click', (e) => {
  const star = e.target.closest('[data-star]');
  if (star) { setStars(star.closest('[data-star-picker]'), +star.dataset.star); return; }
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'SELECT') return;
  const fn = actions[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('[role=link][data-action]')) { e.preventDefault(); actions.open(e.target); }
  if (e.key === 'Enter' && e.target.name === 'address' && e.target.closest('[data-form=place]')) { e.preventDefault(); doGeocode(); }
  if (e.key === 'Escape' && M.isPicking()) endPicking();
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.action === 'sort') {
    S.sort = t.value;
    if (S.sort === 'nearby' && !S.pos) await guard(locate);
    render();
  }
  if (t.name === 'category' && t.closest('[data-form=place]')) {
    const f = t.form; if (f.lat.value) M.setDraft(+f.lat.value, +f.lng.value, t.value, (a, b) => setPos(a, b, false));
  }
  if (t.name === 'photo' && t.files[0]) {
    const blob = await guard(() => resizeImage(t.files[0], api.mode === 'demo' ? 900 : 1600, api.mode === 'demo' ? 0.72 : 0.85));
    if (!blob) return;
    pendingPhoto = blob;
    const drop = t.closest('.photo-drop'); const img = drop.querySelector('img');
    if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
    img.src = URL.createObjectURL(blob); img.hidden = false; drop.classList.add('has-img');
  }
});
document.addEventListener('submit', async (e) => {
  const f = e.target; const kind = f.dataset.form;
  if (!kind) return;
  e.preventDefault();
  if (kind === 'place') return submitPlace(f);
  if (kind === 'auth') {
    const email = f.email?.value; const username = f.username?.value;
    const res = await guard(() => api.signIn({ email, username }));
    if (!res) return;
    if (res.status === 'email_sent') { openModal(V.emailSent(email)); return; }
    closeModal(); toast(`Willkommen, ${S.user?.username || ''}! 🐾`, 'success');
    const cb = afterLogin; afterLogin = null; cb?.();
  }
  if (kind === 'profile') {
    const ok = await guard(async () => { await api.updateProfile({ username: f.username.value }); return true; });
    if (ok) { closeModal(); await reloadPlaces(); S.community = null; toast('Profil gespeichert ✔'); render(); }
  }
  if (kind === 'review') {
    const rating = +f.rating.value;
    if (!rating) return toast('Bitte wähle 1 bis 5 Sterne.', 'error');
    const ok = await guard(async () => { await api.saveReview(f.dataset.id, { rating, text: f.text.value.trim() }); return true; });
    if (!ok) return;
    await reloadPlaces(); S.stats = null; S.community = null;
    toast('Danke für deine Bewertung! ⭐', 'success'); render();
  }
  if (kind === 'feature') {
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    const res = await guard(() => api.startCheckout(f.dataset.id, f.plan.value));
    btn.disabled = false;
    if (!res) return;
    if (res.url) { location.href = res.url; return; }
    closeModal(); await reloadPlaces(); render();
    toast('Zahlung simuliert – dein Ort ist jetzt hervorgehoben ✨', 'success');
  }
  if (kind === 'report') {
    const ok = await guard(async () => { await api.report(f.dataset.id, f.reason.value, f.note.value.trim()); return true; });
    if (ok) { closeModal(); toast('Danke! Wir schauen uns das an.'); }
  }
});

$('#search').addEventListener('input', (e) => {
  S.q = e.target.value;
  if (!['discover', 'map'].includes(route.view)) location.hash = '#/';
  renderSoon();
});

// ---------- Start ----------
async function start() {
  $('#logo').insertAdjacentHTML('afterbegin', pawLogo(30));
  M.initMap($('#map'), {
    onSelect: (id) => { location.hash = `#/place/${encodeURIComponent(id)}`; },
    onContext: (lat, lng) => requireLogin(() => openPlaceForm(null, { lat, lng })),
  });
  try { await api.init(); } catch (e) { toast(e.message, 'error'); }
  S.user = api.getUser();
  api.onAuth(async (u) => {
    S.user = u; S.stats = null;
    S.favs = await guard(() => api.listFavorites()) || new Set();
    render();
  });
  if (api.mode === 'demo') $('#demo-banner').hidden = false;
  [S.places, S.favs] = await Promise.all([
    guard(() => api.listPlaces()).then((x) => x || []),
    guard(() => api.listFavorites()).then((x) => x || new Set()),
  ]);
  route = parseRoute();
  render();
  if (route.view !== 'place') M.fitTo(S.places);

  const params = new URLSearchParams(location.search);
  const featured = params.get('featured');
  if (featured) {
    toast(featured === 'success' ? 'Danke für deine Zahlung! Dein Ort wird in Kürze hervorgehoben ✨' : 'Zahlung abgebrochen.', featured === 'success' ? 'success' : '');
    params.delete('featured');
    history.replaceState(null, '', location.pathname + (params.size ? `?${params}` : '') + location.hash);
  }
  document.body.classList.add('ready');
}
start();
