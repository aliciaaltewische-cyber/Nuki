export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const safeUrl = (u) => (/^https?:\/\/[^\s]+$/i.test(u || '') ? u : '');
export const safeImg = (u) => (/^(https?:\/\/|data:image\/(jpeg|png|webp);base64,)/i.test(u || '') ? u : '');

export const uid = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  }));

export const isFeatured = (p) => !!p.featured_until && new Date(p.featured_until) > new Date();

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });
  for (const [unit, sec] of [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]) {
    if (s >= sec) return rtf.format(-Math.floor(s / sec), unit);
  }
  return 'gerade eben';
}
export const fmtDate = (iso) => new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtMoney = (cents, cur = 'eur') =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: cur.toUpperCase() }).format(cents / 100);
export const fmtNum = (n) => new Intl.NumberFormat('de-DE').format(n);
export const fmtRating = (r) => (Math.round(r * 10) / 10).toLocaleString('de-DE', { minimumFractionDigits: 1 });

export function distanceKm(a, b) {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const fmtDist = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`);

export function avatar(name, size = 36) {
  const n = String(name || '?');
  let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const initials = n.split(/[\s._-]+/).filter((w) => /^[\p{L}\p{N}]/u.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  return `<span class="avatar" style="--h:${h};--s:${size}px" aria-hidden="true">${esc(initials)}</span>`;
}

export function starsHtml(rating, cls = '') {
  const full = Math.round(rating);
  return `<span class="stars-static ${cls}" aria-label="${fmtRating(rating)} von 5 Sternen">${'★'.repeat(full)}<span>${'★'.repeat(5 - full)}</span></span>`;
}

export async function resizeImage(file, max = 1280, quality = 0.82) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', quality));
}
export const blobToDataUrl = (blob) => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob);
});

export function debounce(fn, ms = 200) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
