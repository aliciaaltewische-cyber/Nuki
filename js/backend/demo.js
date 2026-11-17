// Demo-Backend: simuliert die Community komplett im localStorage dieses Browsers.
import { DEMO_PLANS, POINTS } from '../constants.js';
import { uid, blobToDataUrl } from '../util.js';

const KEY = 'nuki.demo.v2';
const SESSION = 'nuki.demo.session';
const FIELDS = ['name', 'category', 'address', 'lat', 'lng', 'amenities', 'description', 'website'];
const now = () => new Date().toISOString();

const empty = () => ({ users: [], places: [], reviews: [], favorites: [], orders: [], reports: [] });
function load() { try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return empty(); } }
function save(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch { throw new Error('Lokaler Speicher ist voll – bitte kleinere Fotos verwenden.'); }
}
const sess = { get: () => { try { return localStorage.getItem(SESSION); } catch { return null; } },
  set: (v) => { try { v ? localStorage.setItem(SESSION, v) : localStorage.removeItem(SESSION); } catch {} } };

const listeners = new Set();
const pick = (o) => Object.fromEntries(FIELDS.filter((k) => k in o).map((k) => [k, o[k]]));

function me(db = load()) { const id = sess.get(); return db.users.find((u) => u.id === id) || null; }
function requireUser(db) { const u = me(db); if (!u) throw new Error('Bitte melde dich zuerst an.'); return u; }

function enrich(db, p) {
  const rs = db.reviews.filter((r) => r.place_id === p.id);
  return {
    ...p,
    author_name: db.users.find((u) => u.id === p.created_by)?.username || 'Unbekannt',
    review_count: rs.length,
    avg_rating: rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0,
  };
}
function profileStats(db, u) {
  const places = db.places.filter((p) => p.created_by === u.id).length;
  const reviews = db.reviews.filter((r) => r.user_id === u.id).length;
  return { ...u, places_count: places, reviews_count: reviews, points: places * POINTS.place + reviews * POINTS.review };
}

export const demo = {
  mode: 'demo',
  async init() {},
  getUser() { return me(); },
  onAuth(cb) { listeners.add(cb); },
  async signIn({ username }) {
    const name = String(username || '').trim().slice(0, 30);
    if (name.length < 2) throw new Error('Bitte gib einen Namen mit mindestens 2 Zeichen ein.');
    const db = load();
    let u = db.users.find((x) => x.username.toLowerCase() === name.toLowerCase());
    if (!u) { u = { id: uid(), username: name, created_at: now() }; db.users.push(u); save(db); }
    sess.set(u.id);
    listeners.forEach((cb) => cb(u));
    return { status: 'signed_in' };
  },
  async signOut() { sess.set(null); listeners.forEach((cb) => cb(null)); },
  async updateProfile({ username }) {
    const db = load(); const u = requireUser(db);
    const name = String(username || '').trim().slice(0, 30);
    if (name.length < 2) throw new Error('Name zu kurz.');
    u.username = name; save(db); listeners.forEach((cb) => cb(u));
  },
  async profile(userId) {
    const db = load(); const u = db.users.find((x) => x.id === userId);
    return u ? profileStats(db, u) : null;
  },

  async listPlaces() {
    const db = load();
    return db.places.filter((p) => !p.hidden).map((p) => enrich(db, p));
  },
  async addPlace(data, photo) {
    const db = load(); const u = requireUser(db);
    const place = { ...pick(data), id: uid(), created_at: now(), created_by: u.id, featured_until: null,
      photo_url: photo ? await blobToDataUrl(photo) : null };
    db.places.unshift(place); save(db);
    return enrich(db, place);
  },
  async updatePlace(id, data, photo) {
    const db = load(); const u = requireUser(db);
    const p = db.places.find((x) => x.id === id);
    if (!p || p.created_by !== u.id) throw new Error('Nur eigene Orte können bearbeitet werden.');
    Object.assign(p, pick(data));
    if (photo) p.photo_url = await blobToDataUrl(photo);
    save(db); return enrich(db, p);
  },
  async deletePlace(id) {
    const db = load(); const u = requireUser(db);
    const p = db.places.find((x) => x.id === id);
    if (!p || p.created_by !== u.id) throw new Error('Nur eigene Orte können gelöscht werden.');
    db.places = db.places.filter((x) => x.id !== id);
    db.reviews = db.reviews.filter((r) => r.place_id !== id);
    db.favorites = db.favorites.filter((f) => f.place_id !== id);
    save(db);
  },

  async listReviews(placeId) {
    const db = load();
    return db.reviews.filter((r) => r.place_id === placeId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((r) => ({ ...r, username: db.users.find((u) => u.id === r.user_id)?.username || 'Unbekannt' }));
  },
  async saveReview(placeId, { rating, text }) {
    const db = load(); const u = requireUser(db);
    if (!(rating >= 1 && rating <= 5)) throw new Error('Bitte wähle 1 bis 5 Sterne.');
    let r = db.reviews.find((x) => x.place_id === placeId && x.user_id === u.id);
    if (r) Object.assign(r, { rating, text, created_at: now() });
    else db.reviews.push({ id: uid(), place_id: placeId, user_id: u.id, rating, text, created_at: now() });
    save(db);
  },
  async deleteReview(id) {
    const db = load(); const u = requireUser(db);
    db.reviews = db.reviews.filter((r) => !(r.id === id && r.user_id === u.id)); save(db);
  },

  async listFavorites() {
    const db = load(); const u = me(db);
    return new Set(u ? db.favorites.filter((f) => f.user_id === u.id).map((f) => f.place_id) : []);
  },
  async toggleFavorite(placeId) {
    const db = load(); const u = requireUser(db);
    const i = db.favorites.findIndex((f) => f.user_id === u.id && f.place_id === placeId);
    if (i >= 0) db.favorites.splice(i, 1); else db.favorites.push({ user_id: u.id, place_id: placeId });
    save(db); return i < 0;
  },

  async community() {
    const db = load();
    const top = db.users.map((u) => profileStats(db, u)).filter((u) => u.points > 0)
      .sort((a, b) => b.points - a.points).slice(0, 10);
    const recentReviews = [...db.reviews].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8)
      .map((r) => ({ ...r, username: db.users.find((u) => u.id === r.user_id)?.username,
        place_name: db.places.find((p) => p.id === r.place_id)?.name }));
    return { members: db.users.length, reviews: db.reviews.length, top, recentReviews };
  },

  async listPlans() { return DEMO_PLANS; },
  async startCheckout(placeId, planId) {
    const db = load(); const u = requireUser(db);
    const plan = DEMO_PLANS.find((x) => x.id === planId);
    const p = db.places.find((x) => x.id === placeId);
    if (!plan || !p) throw new Error('Ungültige Auswahl.');
    const start = Math.max(Date.now(), p.featured_until ? Date.parse(p.featured_until) : 0);
    p.featured_until = new Date(start + plan.days * 86400000).toISOString();
    db.orders.push({ id: uid(), place_id: placeId, user_id: u.id, plan_id: planId, status: 'paid', created_at: now() });
    save(db);
    return { demo: true, featured_until: p.featured_until };
  },

  async report(placeId, reason, note) {
    const db = load(); const u = requireUser(db);
    db.reports.push({ id: uid(), place_id: placeId, user_id: u.id, reason, note, created_at: now() });
    save(db);
  },
};
