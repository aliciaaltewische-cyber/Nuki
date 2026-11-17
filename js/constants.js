export const CATEGORIES = [
  { id: 'cafe', label: 'Café', emoji: '☕', color: '#b45309' },
  { id: 'restaurant', label: 'Restaurant & Bar', emoji: '🍽️', color: '#dc2626' },
  { id: 'hotel', label: 'Unterkunft', emoji: '🏨', color: '#7c3aed' },
  { id: 'park', label: 'Park & Hundewiese', emoji: '🌳', color: '#16a34a' },
  { id: 'beach', label: 'Hundestrand', emoji: '🏖️', color: '#0891b2' },
  { id: 'hike', label: 'Wanderweg', emoji: '🥾', color: '#65a30d' },
  { id: 'shop', label: 'Geschäft', emoji: '🛍️', color: '#db2777' },
  { id: 'vet', label: 'Tierarzt', emoji: '🩺', color: '#2563eb' },
  { id: 'service', label: 'Hundeservice', emoji: '✂️', color: '#9333ea' },
  { id: 'other', label: 'Sonstiges', emoji: '📍', color: '#64748b' },
];

export const AMENITIES = [
  { id: 'water', label: 'Wassernapf', emoji: '💧' },
  { id: 'treats', label: 'Leckerlis', emoji: '🦴' },
  { id: 'indoor', label: 'Drinnen erlaubt', emoji: '🏠' },
  { id: 'offleash', label: 'Leinenfrei', emoji: '🐕' },
  { id: 'fenced', label: 'Eingezäunt', emoji: '🚧' },
  { id: 'shade', label: 'Schatten', emoji: '🌳' },
  { id: 'bags', label: 'Kotbeutel', emoji: '🛍️' },
  { id: 'bigdogs', label: 'Große Hunde ok', emoji: '🐕‍🦺' },
  { id: 'swim', label: 'Baden möglich', emoji: '🌊' },
  { id: 'menu', label: 'Hunde-Menü', emoji: '🍖' },
];

// Nur für den Demo-Modus. In der echten App kommen die Pakete aus der
// Datenbanktabelle "featured_plans" (nur dort sind die Preise verbindlich).
export const DEMO_PLANS = [
  { id: 'week', label: '1 Woche', days: 7, price_cents: 999, currency: 'eur' },
  { id: 'month', label: '1 Monat', days: 30, price_cents: 2999, currency: 'eur', popular: true },
  { id: 'quarter', label: '3 Monate', days: 90, price_cents: 6999, currency: 'eur' },
];

export const REPORT_REASONS = [
  'Nicht (mehr) hundefreundlich',
  'Falsche Angaben',
  'Existiert nicht mehr',
  'Spam oder unangemessen',
];

export const POINTS = { place: 10, review: 3 };

export const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
export const amenById = Object.fromEntries(AMENITIES.map((a) => [a.id, a]));
export const cat = (id) => catById[id] || catById.other;
