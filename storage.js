// Speicher-Schicht: lokal (localStorage) oder gemeinsam (Supabase REST API).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const LOCAL_KEY = 'nuki.places.v1';
const FIELDS = ['name', 'category', 'address', 'lat', 'lng', 'amenities', 'rating', 'description', 'website'];

const pick = (p) => Object.fromEntries(FIELDS.map((k) => [k, p[k]]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; }
}
function writeLocal(places) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(places)); } catch { /* Speicher voll/blockiert */ }
}

const local = {
  shared: false,
  canEdit: () => true,
  async list() { return readLocal(); },
  async add(p) {
    const place = { ...pick(p), id: uid(), created_at: new Date().toISOString() };
    writeLocal([place, ...readLocal()]);
    return place;
  },
  async update(id, p) {
    const places = readLocal().map((x) => (x.id === id ? { ...x, ...pick(p) } : x));
    writeLocal(places);
    return places.find((x) => x.id === id);
  },
  async remove(id) { writeLocal(readLocal().filter((x) => x.id !== id)); },
  async importMany(list) {
    const existing = readLocal();
    const ids = new Set(existing.map((x) => x.id));
    const fresh = list.filter((x) => x && x.name && Number.isFinite(+x.lat) && Number.isFinite(+x.lng))
      .map((x) => ({ ...pick(x), lat: +x.lat, lng: +x.lng, id: x.id && !ids.has(x.id) ? x.id : uid(), created_at: x.created_at || new Date().toISOString() }));
    writeLocal([...fresh, ...existing]);
    return fresh.length;
  },
};

function supabase() {
  const base = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/places';
  const cols = `select=id,created_at,${FIELDS.join(',')}`;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
  async function req(url, opts = {}) {
    const res = await fetch(url, { ...opts, headers: { ...headers, ...opts.headers } });
    if (!res.ok) throw new Error(`Server-Fehler ${res.status}: ${await res.text()}`);
    return res.status === 204 ? null : res.json();
  }
  // In der gemeinsamen Datenbank darf man nur eigene Einträge bearbeiten.
  // Die Eigentümerschaft wird über ein geheimes Token in diesem Browser nachgewiesen.
  const TOKEN_KEY = 'nuki.owner.v1';
  let token;
  try { token = localStorage.getItem(TOKEN_KEY); } catch {}
  if (!token) { token = uid() + uid(); try { localStorage.setItem(TOKEN_KEY, token); } catch {} }
  const mine = new Set();

  return {
    shared: true,
    canEdit: (p) => mine.has(p.id),
    async list() {
      const rows = await req(`${base}?${cols}&order=created_at.desc&limit=10000`);
      const own = await req(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/my_place_ids`, {
        method: 'POST', body: JSON.stringify({ token }),
      }).catch(() => []);
      mine.clear(); (own || []).forEach((r) => mine.add(r.id ?? r));
      return rows;
    },
    async add(p) {
      const [row] = await req(`${base}?${cols}`, {
        method: 'POST', headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ ...pick(p), owner_token: token }),
      });
      mine.add(row.id);
      return row;
    },
    async update(id, p) {
      const rows = await req(`${base}?id=eq.${encodeURIComponent(id)}&${cols}`, {
        method: 'PATCH', headers: { Prefer: 'return=representation', 'x-owner-token': token },
        body: JSON.stringify(pick(p)),
      });
      if (!rows?.length) throw new Error('Nur eigene Einträge können bearbeitet werden.');
      return rows[0];
    },
    async remove(id) {
      await req(`${base}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'x-owner-token': token } });
    },
    async importMany(list) {
      const valid = list.filter((x) => x && x.name && Number.isFinite(+x.lat) && Number.isFinite(+x.lng))
        .map((x) => ({ ...pick(x), lat: +x.lat, lng: +x.lng, owner_token: token }));
      if (valid.length) await req(base, { method: 'POST', body: JSON.stringify(valid) });
      return valid.length;
    },
  };
}

export const store = SUPABASE_URL && SUPABASE_ANON_KEY ? supabase() : local;
