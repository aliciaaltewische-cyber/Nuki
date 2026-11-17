// Echtes Community-Backend: Supabase (Auth, Postgres, Storage, Edge Functions).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config.js';
import { uid } from '../util.js';

const FIELDS = ['name', 'category', 'address', 'lat', 'lng', 'amenities', 'description', 'website'];
const pick = (o) => Object.fromEntries(FIELDS.filter((k) => k in o).map((k) => [k, o[k]]));

let sb; let user = null; let profileCache = null;
const listeners = new Set();

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = Object.assign(document.createElement('script'), { src, onload: res, onerror: () => rej(new Error('Supabase konnte nicht geladen werden.')) });
    document.head.append(s);
  });
}
const check = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
function requireUser() { if (!user) throw new Error('Bitte melde dich zuerst an.'); return user; }

async function loadProfile() {
  if (!user) { profileCache = null; return; }
  const { data } = await sb.from('profiles').select('id,username,created_at').eq('id', user.id).maybeSingle();
  profileCache = data || { id: user.id, username: user.user_metadata?.username || 'Mitglied', created_at: user.created_at };
}

async function uploadPhoto(blob) {
  const path = `${requireUser().id}/${uid()}.jpg`;
  check(await sb.storage.from('place-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false }));
  return sb.storage.from('place-photos').getPublicUrl(path).data.publicUrl;
}

export const supabase = {
  mode: 'supabase',
  async init() {
    await loadScript(new URL('../../vendor/supabase/supabase.js', import.meta.url).href);
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } });
    const { data } = await sb.auth.getSession();
    user = data.session?.user ?? null;
    await loadProfile();
    sb.auth.onAuthStateChange(async (_e, session) => {
      const changed = (session?.user?.id ?? null) !== (user?.id ?? null);
      user = session?.user ?? null;
      if (changed) { await loadProfile(); listeners.forEach((cb) => cb(profileCache)); }
    });
    // Code-Parameter aus dem Magic-Link aus der Adresszeile entfernen
    const url = new URL(location.href);
    if (url.searchParams.has('code')) { url.searchParams.delete('code'); history.replaceState(null, '', url); }
  },
  getUser() { return profileCache; },
  onAuth(cb) { listeners.add(cb); },
  async signIn({ email, username }) {
    const redirect = location.origin + location.pathname;
    check(await sb.auth.signInWithOtp({ email: String(email).trim(), options: { emailRedirectTo: redirect, data: username ? { username: String(username).trim().slice(0, 30) } : undefined } }));
    return { status: 'email_sent' };
  },
  async signOut() { await sb.auth.signOut(); },
  async updateProfile({ username }) {
    const u = requireUser();
    check(await sb.from('profiles').update({ username: String(username).trim().slice(0, 30) }).eq('id', u.id));
    await loadProfile(); listeners.forEach((cb) => cb(profileCache));
  },
  async profile(userId) {
    return check(await sb.from('leaderboard').select('*').eq('id', userId).maybeSingle());
  },

  async listPlaces() {
    return check(await sb.from('places_view').select('*').order('created_at', { ascending: false }).limit(5000));
  },
  async addPlace(data, photo) {
    requireUser();
    const row = { ...pick(data), photo_url: photo ? await uploadPhoto(photo) : null };
    const created = check(await sb.from('places').insert(row).select('id').single());
    return check(await sb.from('places_view').select('*').eq('id', created.id).single());
  },
  async updatePlace(id, data, photo) {
    requireUser();
    const row = pick(data);
    if (photo) row.photo_url = await uploadPhoto(photo);
    const rows = check(await sb.from('places').update(row).eq('id', id).select('id'));
    if (!rows.length) throw new Error('Nur eigene Orte können bearbeitet werden.');
    return check(await sb.from('places_view').select('*').eq('id', id).single());
  },
  async deletePlace(id) {
    requireUser();
    const rows = check(await sb.from('places').delete().eq('id', id).select('id'));
    if (!rows.length) throw new Error('Nur eigene Orte können gelöscht werden.');
  },

  async listReviews(placeId) {
    const rows = check(await sb.from('reviews').select('id,place_id,user_id,rating,text,created_at,profiles(username)')
      .eq('place_id', placeId).order('created_at', { ascending: false }).limit(200));
    return rows.map((r) => ({ ...r, username: r.profiles?.username || 'Mitglied' }));
  },
  async saveReview(placeId, { rating, text }) {
    const u = requireUser();
    const row = { rating, text, created_at: new Date().toISOString() };
    const updated = check(await sb.from('reviews').update(row).eq('place_id', placeId).eq('user_id', u.id).select('id'));
    if (!updated.length) check(await sb.from('reviews').insert({ ...row, place_id: placeId }));
  },
  async deleteReview(id) { requireUser(); check(await sb.from('reviews').delete().eq('id', id)); },

  async listFavorites() {
    if (!user) return new Set();
    return new Set(check(await sb.from('favorites').select('place_id').eq('user_id', user.id)).map((r) => r.place_id));
  },
  async toggleFavorite(placeId) {
    const u = requireUser();
    const existing = check(await sb.from('favorites').delete().eq('user_id', u.id).eq('place_id', placeId).select('place_id'));
    if (existing.length) return false;
    check(await sb.from('favorites').insert({ place_id: placeId }));
    return true;
  },

  async community() {
    const [top, recent, stats] = await Promise.all([
      sb.from('leaderboard').select('*').gt('points', 0).order('points', { ascending: false }).limit(10),
      sb.from('reviews').select('id,rating,text,created_at,place_id,profiles(username),places(name)').order('created_at', { ascending: false }).limit(8),
      sb.rpc('community_stats'),
    ]);
    const s = check(stats)?.[0] || {};
    return {
      members: s.members ?? 0, reviews: s.reviews ?? 0,
      top: check(top),
      recentReviews: check(recent).map((r) => ({ ...r, username: r.profiles?.username, place_name: r.places?.name })),
    };
  },

  async listPlans() {
    return check(await sb.from('featured_plans').select('*').eq('active', true).order('days'));
  },
  async startCheckout(placeId, planId) {
    requireUser();
    const { data, error } = await sb.functions.invoke('create-checkout', { body: { place_id: placeId, plan_id: planId } });
    if (error) throw new Error('Bezahlung konnte nicht gestartet werden.');
    if (!data?.url) throw new Error(data?.error || 'Bezahlung konnte nicht gestartet werden.');
    return { url: data.url };
  },

  async report(placeId, reason, note) {
    requireUser();
    check(await sb.from('reports').insert({ place_id: placeId, reason, note }));
  },
};
