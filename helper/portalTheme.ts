// ---------------------------------------------------------------------------
// Customer portal design tokens
//
// IMPORTANT: these map to real CSS classes defined in assets/css/portal.css,
// NOT to Tailwind utility strings. tailwind.config has `content: []`, so
// utilities that only exist inside this .ts file are never generated — which
// previously caused cards to touch the screen edge and inputs to lose their
// text colour.
//
//   Brand red   #A93133  -> primary action, links, focus ring
//   Ink         #111111  -> top bar, headings
// ---------------------------------------------------------------------------

/** Page shell: consistent side gutters on every screen size. */
export const pageContainer = 'portal-container'

/** Vertical gap between top-level sections. */
export const sectionGap = 'portal-sections'

/** Card surface (border + radius + shadow + responsive padding). */
export const card = 'portal-card'

/** Compact card (same surface, reduced vertical padding). */
export const cardTight = 'portal-card portal-card-tight'

/** Section eyebrow label, e.g. "PAKET ANDA". */
export const sectionLabel = 'portal-label'

/** Fluid heading / value text. */
export const title = 'portal-title'
export const value = 'portal-value'
export const heading = 'portal-heading'

/** Body copy and meta text (never smaller than 12px). */
export const body = 'portal-body'
export const meta = 'portal-meta'

/** Form controls. */
export const field = 'portal-field'
export const fieldLabel = 'portal-field-label'

/** Buttons. */
export const buttonPrimary = 'portal-btn-primary'
export const buttonSecondary = 'portal-btn-secondary'

/** Brand colours, when an inline value is genuinely needed. */
export const brand = {
  red: '#A93133',
  redHover: '#8F2729',
  ink: '#111111',
} as const
