// Reine HTML-Bausteine. Alle Nutzerdaten laufen durch esc().
import { CATEGORIES, AMENITIES, REPORT_REASONS, cat, amenById } from './constants.js';
import { icon } from './icons.js';
import { esc, safeUrl, safeImg, isFeatured, timeAgo, fmtDate, fmtMoney, fmtNum, fmtRating, fmtDist, distanceKm, avatar, starsHtml } from './util.js';

const media = (p, cls = '') => {
  const c = cat(p.category); const img = safeImg(p.photo_url);
  return `<div class="media ${cls}" style="--c:${c.color}">${img
    ? `<img src="${esc(img)}" alt="" loading="lazy">`
    : `<span class="media-emoji">${c.emoji}</span>`}</div>`;
};
const ratingInline = (p) => (p.review_count
  ? `<span class="rating">${icon('star', 'i-fill')} ${fmtRating(p.avg_rating)} <span class="muted">(${p.review_count})</span></span>`
  : '<span class="muted">Neu</span>');
const favBtn = (p, favs) => `<button class="icon-btn fav${favs.has(p.id) ? ' on' : ''}" data-action="fav" data-id="${esc(p.id)}" aria-label="Favorit" aria-pressed="${favs.has(p.id)}">${icon('heart')}</button>`;
const dist = (p, pos) => (pos ? ` · ${fmtDist(distanceKm(pos, p))}` : '');

export function placeCard(p, { favs, pos }) {
  const c = cat(p.category);
  return `<article class="card${isFeatured(p) ? ' is-featured' : ''}" data-action="open" data-id="${esc(p.id)}" tabindex="0" role="link" aria-label="${esc(p.name)}">
    ${media(p, 'card-media')}
    <div class="card-body">
      <div class="card-top">
        <h3>${esc(p.name)}</h3>
        ${favBtn(p, favs)}
      </div>
      <div class="card-meta">${ratingInline(p)} <span class="dot"></span> <span>${c.emoji} ${esc(c.label)}</span></div>
      ${p.address ? `<div class="card-addr">${esc(p.address)}${dist(p, pos)}</div>` : ''}
      ${(p.amenities || []).length ? `<div class="amen-mini">${p.amenities.slice(0, 4).map((a) => `<span title="${esc(amenById[a]?.label || a)}">${amenById[a]?.emoji || ''}</span>`).join('')}${p.amenities.length > 4 ? `<span class="muted">+${p.amenities.length - 4}</span>` : ''}</div>` : ''}
    </div>
    ${isFeatured(p) ? `<span class="badge-featured">${icon('sparkles')} Empfohlen</span>` : ''}
  </article>`;
}

function featuredCard(p, { favs }) {
  const c = cat(p.category);
  return `<article class="fcard" data-action="open" data-id="${esc(p.id)}" tabindex="0" role="link" aria-label="${esc(p.name)}">
    ${media(p, 'fcard-media')}
    <div class="fcard-shade"></div>
    <span class="badge-featured">${icon('sparkles')} Empfohlen</span>
    ${favBtn(p, favs)}
    <div class="fcard-body">
      <h3>${esc(p.name)}</h3>
      <div class="fcard-meta">${c.emoji} ${esc(c.label)}${p.review_count ? ` · ★ ${fmtRating(p.avg_rating)}` : ''}</div>
    </div>
  </article>`;
}

export function discoverView(s, list, featured) {
  const greeting = s.user ? `Hallo ${esc(s.user.username)} 👋` : 'Hundefreundliche Orte, weltweit';
  const filtered = s.cat !== 'all' || s.q;
  return `
  <section class="hero">
    <p class="eyebrow">${icon('globe')} Community-Karte</p>
    <h1>${greeting}</h1>
    <p class="lead">Entdecke Orte, an denen dein Hund willkommen ist – empfohlen von Hundemenschen aus aller Welt.</p>
    <div class="hero-stats">
      <span><strong>${fmtNum(s.places.length)}</strong> Orte</span>
      <span><strong>${fmtNum(s.places.reduce((n, p) => n + (p.review_count || 0), 0))}</strong> Bewertungen</span>
    </div>
  </section>

  <div class="chips" role="toolbar" aria-label="Kategorien">
    ${[{ id: 'all', label: 'Alle', emoji: '🐾' }, ...CATEGORIES].map((c) =>
      `<button class="chip" data-action="cat" data-cat="${c.id}" aria-pressed="${s.cat === c.id}">${c.emoji} ${esc(c.label)}</button>`).join('')}
  </div>

  ${featured.length && !filtered ? `
  <section class="section">
    <div class="section-head"><h2>${icon('sparkles')} Empfohlen</h2><span class="muted small">Gesponsert</span></div>
    <div class="carousel">${featured.map((p) => featuredCard(p, s)).join('')}</div>
  </section>` : ''}

  <section class="section">
    <div class="section-head">
      <h2>${filtered ? `${fmtNum(list.length)} Treffer` : 'Alle Orte'}</h2>
      <label class="sort">${icon('sliders')}
        <select data-action="sort" aria-label="Sortieren">
          ${[['recommended', 'Empfohlen'], ['rating', 'Beste Bewertung'], ['newest', 'Neueste'], ['nearby', 'In der Nähe']]
            .map(([v, l]) => `<option value="${v}"${s.sort === v ? ' selected' : ''}>${l}</option>`).join('')}
        </select>
      </label>
    </div>
    ${list.length ? `<div class="cards">${list.map((p) => placeCard(p, s)).join('')}</div>` : emptyState(s)}
  </section>
  ${businessTeaser()}`;
}

function emptyState(s) {
  return `<div class="empty">
    <div class="empty-emoji">🐕</div>
    <h3>${s.places.length ? 'Nichts gefunden' : 'Noch keine Orte'}</h3>
    <p>${s.places.length ? 'Probiere eine andere Kategorie oder Suche.' : 'Sei die erste Person, die einen hundefreundlichen Ort teilt!'}</p>
    <button class="btn btn-primary" data-action="add">${icon('plus')} Ort teilen</button>
  </div>`;
}

function businessTeaser() {
  return `<aside class="promo">
    <div class="promo-icon">${icon('store')}</div>
    <div><h3>Du hast ein hundefreundliches Geschäft?</h3>
    <p>Trage es ein und lass es als <strong>Empfohlen</strong> ganz oben und mit goldenem Marker anzeigen.</p></div>
    <button class="btn btn-gold" data-action="add">Jetzt eintragen</button>
  </aside>`;
}

export function placeView(p, s) {
  if (!p) return `<div class="empty"><div class="empty-emoji">🔍</div><h3>Ort nicht gefunden</h3><a class="btn" href="#/">Zurück</a></div>`;
  const c = cat(p.category);
  const mine = s.user && p.created_by === s.user.id;
  const web = safeUrl(p.website);
  const f = isFeatured(p);
  return `<article class="detail">
    <div class="detail-hero">
      ${media(p, 'detail-media')}
      <div class="detail-hero-bar">
        <button class="icon-btn glass" data-action="back" aria-label="Zurück">${icon('back')}</button>
        <span class="spacer"></span>
        <button class="icon-btn glass" data-action="share" data-id="${esc(p.id)}" aria-label="Teilen">${icon('share')}</button>
        ${favBtn(p, s.favs).replace('icon-btn', 'icon-btn glass')}
      </div>
    </div>
    <div class="detail-body">
      ${f ? `<span class="badge-featured static">${icon('sparkles')} Empfohlener Ort</span>` : ''}
      <h1>${esc(p.name)}</h1>
      <div class="detail-meta">
        <span class="pill" style="--c:${c.color}">${c.emoji} ${esc(c.label)}</span>
        ${p.review_count ? `${starsHtml(p.avg_rating)} <strong>${fmtRating(p.avg_rating)}</strong> <span class="muted">· ${p.review_count} ${p.review_count === 1 ? 'Bewertung' : 'Bewertungen'}</span>` : '<span class="muted">Noch keine Bewertungen</span>'}
      </div>
      ${p.address ? `<p class="detail-addr">${icon('pin')} ${esc(p.address)}${dist(p, s.pos)}</p>` : ''}

      <div class="detail-actions">
        <a class="btn btn-primary" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener noreferrer">${icon('route')} Route</a>
        ${web ? `<a class="btn" href="${esc(web)}" target="_blank" rel="noopener noreferrer">${icon('link')} Website</a>` : ''}
        <button class="btn only-mobile" data-action="show-map" data-id="${esc(p.id)}">${icon('map')} Karte</button>
        ${mine ? `<button class="btn" data-action="edit" data-id="${esc(p.id)}">${icon('edit')} Bearbeiten</button>` : ''}
      </div>

      ${p.description ? `<p class="detail-desc">${esc(p.description)}</p>` : ''}

      ${(p.amenities || []).length ? `<h2 class="h-sm">Das erwartet deinen Hund</h2>
      <ul class="amen-grid">${p.amenities.map((a) => `<li><span>${amenById[a]?.emoji || '✓'}</span>${esc(amenById[a]?.label || a)}</li>`).join('')}</ul>` : ''}

      <div class="feature-box${f ? ' active' : ''}">
        <div class="feature-box-icon">${icon('sparkles')}</div>
        <div>
          ${f ? `<strong>Hervorgehoben bis ${fmtDate(p.featured_until)}</strong><p>Dieser Ort erscheint ganz oben und mit goldenem Marker.</p>`
              : '<strong>Ist das dein Geschäft?</strong><p>Hebe es hervor: Top-Platzierung, goldener Marker und „Empfohlen“-Badge.</p>'}
        </div>
        <button class="btn btn-gold" data-action="feature" data-id="${esc(p.id)}">${f ? 'Verlängern' : 'Hervorheben'}</button>
      </div>

      <section class="reviews">
        <div class="section-head"><h2 class="h-sm">${icon('message')} Bewertungen</h2></div>
        ${s.user ? reviewForm(p) : `<div class="login-hint"><p>Melde dich an, um diesen Ort zu bewerten.</p><button class="btn btn-primary" data-action="login">Anmelden</button></div>`}
        <div id="review-list" class="review-list"><div class="skeleton"></div><div class="skeleton"></div></div>
      </section>

      <footer class="detail-foot">
        <span>${avatar(p.author_name, 22)} Geteilt von <strong>${esc(p.author_name || 'Mitglied')}</strong> · ${timeAgo(p.created_at)}</span>
        <button class="link" data-action="report" data-id="${esc(p.id)}">${icon('flag')} Melden</button>
      </footer>
    </div>
  </article>`;
}

export function starPicker(name, value = 0) {
  return `<div class="star-picker" data-star-picker="${name}" role="radiogroup" aria-label="Sterne">
    ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" class="${n <= value ? 'on' : ''}" role="radio" aria-checked="${n === value}" aria-label="${n} ${n === 1 ? 'Stern' : 'Sterne'}">★</button>`).join('')}
    <input type="hidden" name="${name}" value="${value}">
  </div>`;
}

function reviewForm(p) {
  return `<form class="review-form" data-form="review" data-id="${esc(p.id)}">
    <div class="review-form-top">${starPicker('rating')}<span class="muted small" id="my-review-note"></span></div>
    <textarea name="text" rows="2" maxlength="800" placeholder="Wie war es mit deinem Hund dort?"></textarea>
    <div class="row-end"><button class="btn btn-primary btn-sm" type="submit">Bewertung posten</button></div>
  </form>`;
}

export function reviewList(reviews, user) {
  if (!reviews.length) return '<p class="muted center">Noch keine Bewertungen – schreib die erste!</p>';
  return reviews.map((r) => `<div class="review">
    ${avatar(r.username, 36)}
    <div class="review-body">
      <div class="review-head"><strong>${esc(r.username)}</strong>${starsHtml(r.rating, 'sm')}<span class="muted small">${timeAgo(r.created_at)}</span>
      ${user && r.user_id === user.id ? `<button class="link small" data-action="del-review" data-id="${esc(r.id)}" aria-label="Bewertung löschen">${icon('trash')}</button>` : ''}</div>
      ${r.text ? `<p>${esc(r.text)}</p>` : ''}
    </div>
  </div>`).join('');
}

export function communityView(s, data) {
  const top = data?.top || [];
  return `<section class="hero">
    <p class="eyebrow">${icon('users')} Community</p>
    <h1>Gemeinsam für Hunde</h1>
    <p class="lead">Jeder geteilte Ort und jede Bewertung hilft anderen Hundemenschen. Sammle Punkte und werde Top-Entdecker*in!</p>
  </section>
  <div class="stat-grid">
    <div class="stat"><strong>${fmtNum(s.places.length)}</strong><span>Orte</span></div>
    <div class="stat"><strong>${data ? fmtNum(data.reviews) : '–'}</strong><span>Bewertungen</span></div>
    <div class="stat"><strong>${data ? fmtNum(data.members) : '–'}</strong><span>Mitglieder</span></div>
  </div>
  <section class="section">
    <div class="section-head"><h2>${icon('trophy')} Top-Entdecker*innen</h2><span class="muted small">10 Pkt. pro Ort · 3 pro Bewertung</span></div>
    ${!data ? '<div class="skeleton"></div><div class="skeleton"></div>' : top.length ? `<ol class="leaderboard">${top.map((u, i) => `
      <li class="${s.user && u.id === s.user.id ? 'me' : ''}">
        <span class="rank rank-${i + 1}">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
        ${avatar(u.username, 40)}
        <div class="lb-name"><strong>${esc(u.username)}</strong><span class="muted small">${u.places_count} Orte · ${u.reviews_count} Bewertungen</span></div>
        <span class="points">${fmtNum(u.points)}<small>Pkt.</small></span>
      </li>`).join('')}</ol>` : '<p class="muted">Noch niemand auf der Rangliste – leg los!</p>'}
  </section>
  <section class="section">
    <div class="section-head"><h2>${icon('message')} Neueste Bewertungen</h2></div>
    ${!data ? '<div class="skeleton"></div>' : data.recentReviews.length ? `<div class="feed">${data.recentReviews.map((r) => `
      <a class="feed-item" href="#/place/${encodeURIComponent(r.place_id)}">
        ${avatar(r.username, 36)}
        <div><div><strong>${esc(r.username || 'Mitglied')}</strong> hat <strong>${esc(r.place_name || 'einen Ort')}</strong> bewertet ${starsHtml(r.rating, 'sm')}</div>
        ${r.text ? `<p class="muted">„${esc(r.text.length > 140 ? r.text.slice(0, 140) + '…' : r.text)}“</p>` : ''}
        <span class="muted small">${timeAgo(r.created_at)}</span></div>
      </a>`).join('')}</div>` : '<p class="muted">Noch keine Bewertungen.</p>'}
  </section>
  ${!s.user ? `<div class="cta-card"><h3>Mach mit!</h3><p>Teile deine Lieblingsorte, bewerte Cafés und hilf der Community.</p><button class="btn btn-primary" data-action="login">Kostenlos Mitglied werden</button></div>` : ''}`;
}

export function profileView(s, stats) {
  if (!s.user) return `<div class="auth-hero">
    <div class="auth-emoji">🐶</div>
    <h1>Werde Teil der Nuki-Community</h1>
    <p class="lead">Kostenlos und in wenigen Sekunden.</p>
    <ul class="benefits">
      <li>${icon('plus')} Hundefreundliche Orte teilen</li>
      <li>${icon('star')} Orte bewerten und Erfahrungen teilen</li>
      <li>${icon('heart')} Lieblingsorte als Favoriten speichern</li>
      <li>${icon('trophy')} Punkte sammeln und in die Rangliste kommen</li>
    </ul>
    <button class="btn btn-primary btn-lg" data-action="login">Anmelden oder registrieren</button>
  </div>`;
  const mine = s.places.filter((p) => p.created_by === s.user.id);
  const favs = s.places.filter((p) => s.favs.has(p.id));
  return `<section class="profile-head">
    ${avatar(s.user.username, 72)}
    <div><h1>${esc(s.user.username)}</h1>
    <p class="muted">Mitglied seit ${fmtDate(s.user.created_at || new Date())}</p></div>
    <button class="icon-btn" data-action="edit-profile" aria-label="Namen ändern">${icon('edit')}</button>
  </section>
  <div class="stat-grid">
    <div class="stat"><strong>${stats ? fmtNum(stats.points) : '–'}</strong><span>Punkte</span></div>
    <div class="stat"><strong>${fmtNum(mine.length)}</strong><span>Orte</span></div>
    <div class="stat"><strong>${stats ? fmtNum(stats.reviews_count) : '–'}</strong><span>Bewertungen</span></div>
  </div>
  <section class="section">
    <div class="section-head"><h2>${icon('heart')} Favoriten</h2></div>
    ${favs.length ? `<div class="cards">${favs.map((p) => placeCard(p, s)).join('')}</div>` : '<p class="muted">Tippe auf das Herz bei einem Ort, um ihn hier zu speichern.</p>'}
  </section>
  <section class="section">
    <div class="section-head"><h2>${icon('pin')} Meine Orte</h2></div>
    ${mine.length ? `<div class="cards">${mine.map((p) => placeCard(p, s)).join('')}</div>` : `<p class="muted">Du hast noch keine Orte geteilt.</p><button class="btn btn-primary" data-action="add">${icon('plus')} Ersten Ort teilen</button>`}
  </section>
  <button class="btn btn-ghost full" data-action="logout">${icon('logout')} Abmelden</button>`;
}

// ---------- Modals ----------
export function placeForm(p) {
  const img = safeImg(p?.photo_url);
  return `<form class="modal-form" data-form="place">
    <header class="modal-head"><h2>${p ? 'Ort bearbeiten' : 'Hundefreundlichen Ort teilen'}</h2>
      <button type="button" class="icon-btn" data-action="close-modal" aria-label="Schließen">${icon('x')}</button></header>
    <div class="modal-body">
      <label class="photo-drop${img ? ' has-img' : ''}">
        <input type="file" name="photo" accept="image/*" hidden>
        <img alt="" ${img ? `src="${esc(img)}"` : 'hidden'}>
        <span class="photo-hint">${icon('camera')}<span>Foto hinzufügen</span></span>
      </label>

      <label class="field"><span>Name des Ortes *</span><input name="name" required maxlength="120" placeholder="z. B. Café am Stadtpark" value="${esc(p?.name)}"></label>

      <div class="field"><span>Kategorie *</span>
        <div class="cat-grid">${CATEGORIES.map((c) => `<label class="cat-opt" style="--c:${c.color}"><input type="radio" name="category" value="${c.id}" ${(p?.category || 'cafe') === c.id ? 'checked' : ''}><span>${c.emoji}</span><small>${esc(c.label)}</small></label>`).join('')}</div>
      </div>

      <div class="field"><span>Standort *</span>
        <div class="input-group">${icon('search')}<input name="address" maxlength="200" placeholder="Adresse oder Ort suchen" value="${esc(p?.address)}" autocomplete="off"><button type="button" class="btn btn-sm" data-action="geocode">Suchen</button></div>
        <div class="row-gap">
          <button type="button" class="btn btn-sm btn-ghost" data-action="pick">${icon('pin')} Auf Karte wählen</button>
          <button type="button" class="btn btn-sm btn-ghost" data-action="here">${icon('locate')} Mein Standort</button>
        </div>
        <p class="hint" id="pos-hint">${p ? `${icon('check')} Position gesetzt` : 'Noch keine Position gewählt'}</p>
        <input type="hidden" name="lat" value="${p?.lat ?? ''}"><input type="hidden" name="lng" value="${p?.lng ?? ''}">
      </div>

      <div class="field"><span>Was erwartet Hunde dort?</span>
        <div class="toggle-chips">${AMENITIES.map((a) => `<label><input type="checkbox" name="amenities" value="${a.id}" ${(p?.amenities || []).includes(a.id) ? 'checked' : ''}><span>${a.emoji} ${esc(a.label)}</span></label>`).join('')}</div>
      </div>

      <label class="field"><span>Beschreibung</span><textarea name="description" rows="3" maxlength="1000" placeholder="Was macht den Ort hundefreundlich?">${esc(p?.description)}</textarea></label>
      <label class="field"><span>Website</span><input name="website" type="url" maxlength="300" placeholder="https://…" value="${esc(p?.website)}"></label>
      ${p ? '' : `<div class="field"><span>Deine Bewertung (optional)</span>${starPicker('rating')}</div>`}
    </div>
    <footer class="modal-foot">
      ${p ? `<button type="button" class="btn btn-danger" data-action="delete" data-id="${esc(p.id)}">${icon('trash')}</button>` : ''}
      <span class="spacer"></span>
      <button type="button" class="btn btn-ghost" data-action="close-modal">Abbrechen</button>
      <button type="submit" class="btn btn-primary">${p ? 'Speichern' : 'Ort teilen'}</button>
    </footer>
  </form>`;
}

export function authForm(mode) {
  return `<form class="modal-form" data-form="auth">
    <header class="modal-head"><h2>Willkommen bei Nuki 🐾</h2>
      <button type="button" class="icon-btn" data-action="close-modal" aria-label="Schließen">${icon('x')}</button></header>
    <div class="modal-body">
      ${mode === 'demo' ? `
        <p class="muted">Demo-Modus: Gib einfach einen Namen ein – es wird kein Konto auf einem Server angelegt.</p>
        <label class="field"><span>Dein Name in der Community</span><input name="username" required minlength="2" maxlength="30" placeholder="z. B. Lisa & Nuki" autocomplete="nickname"></label>`
      : `
        <p class="muted">Wir schicken dir einen Anmelde-Link per E-Mail – ganz ohne Passwort.</p>
        <label class="field"><span>E-Mail</span><input name="email" type="email" required autocomplete="email" placeholder="du@beispiel.de"></label>
        <label class="field"><span>Name in der Community <small class="muted">(nur bei Neuanmeldung)</small></span><input name="username" maxlength="30" placeholder="z. B. Lisa & Nuki" autocomplete="nickname"></label>`}
    </div>
    <footer class="modal-foot"><span class="spacer"></span><button type="submit" class="btn btn-primary">${mode === 'demo' ? 'Los geht’s' : `${icon('mail')} Link senden`}</button></footer>
  </form>`;
}

export const emailSent = (email) => `<div class="modal-form"><div class="modal-body center">
  <div class="auth-emoji">📬</div><h2>Check dein Postfach</h2>
  <p class="muted">Wir haben einen Anmelde-Link an <strong>${esc(email)}</strong> geschickt.</p>
  <button class="btn btn-primary" data-action="close-modal">Okay</button></div></div>`;

export function profileForm(user) {
  return `<form class="modal-form" data-form="profile">
    <header class="modal-head"><h2>Profil bearbeiten</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Schließen">${icon('x')}</button></header>
    <div class="modal-body"><label class="field"><span>Name in der Community</span><input name="username" required minlength="2" maxlength="30" value="${esc(user.username)}"></label></div>
    <footer class="modal-foot"><span class="spacer"></span><button type="submit" class="btn btn-primary">Speichern</button></footer>
  </form>`;
}

export function featureForm(p, plans, mode) {
  return `<form class="modal-form" data-form="feature" data-id="${esc(p.id)}">
    <header class="modal-head"><h2>${icon('sparkles')} Ort hervorheben</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Schließen">${icon('x')}</button></header>
    <div class="modal-body">
      <div class="feature-preview">${media(p, 'fp-media')}<div><strong>${esc(p.name)}</strong><span class="badge-featured static">${icon('sparkles')} Empfohlen</span></div></div>
      <ul class="benefits compact">
        <li>${icon('check')} Ganz oben in „Empfohlen“ und in der Liste</li>
        <li>${icon('check')} Größerer, goldener Marker auf der Karte</li>
        <li>${icon('check')} „Empfohlen“-Badge für mehr Aufmerksamkeit</li>
      </ul>
      <div class="plans">${plans.map((pl, i) => `<label class="plan${pl.popular ? ' popular' : ''}">
        <input type="radio" name="plan" value="${esc(pl.id)}" ${(pl.popular || (!plans.some((x) => x.popular) && i === 0)) ? 'checked' : ''}>
        ${pl.popular ? '<span class="plan-tag">Beliebt</span>' : ''}
        <strong>${esc(pl.label)}</strong>
        <span class="plan-price">${fmtMoney(pl.price_cents, pl.currency)}</span>
        <span class="muted small">${fmtMoney(Math.round(pl.price_cents / pl.days), pl.currency)} / Tag</span>
      </label>`).join('')}</div>
      ${mode === 'demo' ? '<p class="hint">Demo-Modus: Die Zahlung wird nur simuliert.</p>' : '<p class="hint">Sichere Zahlung über Stripe (Karte, Apple Pay, Google Pay u. a.).</p>'}
    </div>
    <footer class="modal-foot"><span class="spacer"></span><button type="submit" class="btn btn-gold">Weiter zur Zahlung</button></footer>
  </form>`;
}

export function reportForm(p) {
  return `<form class="modal-form" data-form="report" data-id="${esc(p.id)}">
    <header class="modal-head"><h2>${icon('flag')} Ort melden</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Schließen">${icon('x')}</button></header>
    <div class="modal-body">
      <p class="muted">Was stimmt mit „${esc(p.name)}“ nicht? Das Moderationsteam prüft deine Meldung.</p>
      <div class="radio-list">${REPORT_REASONS.map((r, i) => `<label><input type="radio" name="reason" value="${esc(r)}" ${i === 0 ? 'checked' : ''}> ${esc(r)}</label>`).join('')}</div>
      <label class="field"><span>Details (optional)</span><textarea name="note" rows="2" maxlength="500"></textarea></label>
    </div>
    <footer class="modal-foot"><span class="spacer"></span><button type="submit" class="btn btn-primary">Melden</button></footer>
  </form>`;
}
