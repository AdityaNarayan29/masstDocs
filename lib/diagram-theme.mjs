/**
 * Diagram theme: the single source for how Mermaid diagrams look.
 *
 * Diagrams are rendered once at build time with Mermaid's `base` theme using
 * the `render` colours below. scripts/pre-render-mermaid.mjs then swaps every
 * render colour for `var(--dg-<token>)`, so one SVG follows the site's light
 * and dark mode through CSS. Any other colour (from `style`/`classDef` lines
 * or Mermaid's own derived colours) gets an automatic dark counterpart.
 *
 * `render` values must be unique per token (they are how colours are matched).
 */

/** @type {Record<string, { render: string, light: string, dark: string }>} */
export const TOKENS = {
  // Structure (Masst Reels v2: nodes sit a step below or above the card, hairline borders)
  node: { render: '#fffffe', light: '#ffffff', dark: '#0e0e11' },
  'node-border': { render: '#d4d4d7', light: '#d9d9df', dark: '#2c2c33' },
  text: { render: '#18181a', light: '#111114', dark: '#f5f5f7' },
  line: { render: '#71717b', light: '#8a8a92', dark: '#8e8e93' },
  surface: { render: '#f4f4f6', light: '#fafafb', dark: '#15151a' },
  cluster: { render: '#fafafb', light: 'rgba(17, 17, 20, 0.025)', dark: 'rgba(255, 255, 255, 0.025)' },
  'cluster-border': { render: '#e4e4e8', light: '#d9d9df', dark: '#2c2c33' },
  // Notes read as "waiting / heads-up": the warn colour.
  note: { render: '#fffbec', light: 'color-mix(in srgb, #9a6400 9%, #ffffff)', dark: 'color-mix(in srgb, #ffcc66 11%, #0e0e11)' },
  'note-border': { render: '#fde68b', light: 'color-mix(in srgb, #9a6400 32%, #ffffff)', dark: 'color-mix(in srgb, #ffcc66 32%, #0e0e11)' },
  'note-text': { render: '#78350e', light: '#6b4600', dark: '#ffcc66' },
  // Text that sits on a coloured chart fill (pie slices, git branches): dark in both modes.
  'on-color': { render: '#1c1917', light: '#111114', dark: '#111114' },

  // Pastel fills from `style X fill:#...` lines in content, mapped to what they
  // mean: green = healthy (ok), red = broken (fail), amber/orange = waiting
  // (warn), blue/indigo/violet/pink = the highlighted thing (info).
  green: { render: '#dcfce7', light: 'color-mix(in srgb, #0a7d4e 11%, #ffffff)', dark: 'color-mix(in srgb, #5fe3a1 14%, #0e0e11)' },
  'green-strong': { render: '#86efac', light: 'color-mix(in srgb, #0a7d4e 22%, #ffffff)', dark: 'color-mix(in srgb, #5fe3a1 24%, #0e0e11)' },
  red: { render: '#fee2e2', light: 'color-mix(in srgb, #c8372a 10%, #ffffff)', dark: 'color-mix(in srgb, #ff6b5e 14%, #0e0e11)' },
  'red-2': { render: '#fecaca', light: 'color-mix(in srgb, #c8372a 16%, #ffffff)', dark: 'color-mix(in srgb, #ff6b5e 20%, #0e0e11)' },
  amber: { render: '#fef3c7', light: 'color-mix(in srgb, #9a6400 11%, #ffffff)', dark: 'color-mix(in srgb, #ffcc66 13%, #0e0e11)' },
  orange: { render: '#fed7aa', light: 'color-mix(in srgb, #9a6400 15%, #ffffff)', dark: 'color-mix(in srgb, #ffcc66 17%, #0e0e11)' },
  blue: { render: '#dbeafe', light: 'color-mix(in srgb, #1764c9 9%, #ffffff)', dark: 'color-mix(in srgb, #6cb6ff 14%, #0e0e11)' },
  indigo: { render: '#e0e7ff', light: 'color-mix(in srgb, #1764c9 9%, #ffffff)', dark: 'color-mix(in srgb, #6cb6ff 14%, #0e0e11)' },
  violet: { render: '#ede9fe', light: 'color-mix(in srgb, #1764c9 9%, #ffffff)', dark: 'color-mix(in srgb, #6cb6ff 14%, #0e0e11)' },
  pink: { render: '#fce7f3', light: 'color-mix(in srgb, #1764c9 9%, #ffffff)', dark: 'color-mix(in srgb, #6cb6ff 14%, #0e0e11)' },

  // Chart palette (pie, gitGraph, timeline): categories need distinct colours.
  // Same hue in dark mode, slightly deeper.
  c1: { render: '#93c5fd', light: '#93c5fd', dark: 'color-mix(in oklab, #93c5fd 82%, black)' },
  c2: { render: '#86efad', light: '#86efac', dark: 'color-mix(in oklab, #86efac 82%, black)' },
  c3: { render: '#fcd34d', light: '#fcd34d', dark: 'color-mix(in oklab, #fcd34d 82%, black)' },
  c4: { render: '#f9a8d4', light: '#f9a8d4', dark: 'color-mix(in oklab, #f9a8d4 82%, black)' },
  c5: { render: '#c4b5fd', light: '#c4b5fd', dark: 'color-mix(in oklab, #c4b5fd 82%, black)' },
  c6: { render: '#fdba74', light: '#fdba74', dark: 'color-mix(in oklab, #fdba74 82%, black)' },
  c7: { render: '#5eead4', light: '#5eead4', dark: 'color-mix(in oklab, #5eead4 82%, black)' },
  c8: { render: '#fca5a5', light: '#fca5a5', dark: 'color-mix(in oklab, #fca5a5 82%, black)' },
};

const t = (name) => TOKENS[name].render;
const palette = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'].map(t);

/** Font alias used while rendering; replaced with var(--dg-font) afterwards. */
export const RENDER_FONT = 'dgfont';
export const FONT_SIZE = 14;

/** Mermaid config used for every pre-rendered diagram (and the client fallback). */
export const MERMAID_CONFIG = {
  theme: 'base',
  securityLevel: 'strict',
  fontFamily: RENDER_FONT,
  themeVariables: {
    fontFamily: RENDER_FONT,
    fontSize: `${FONT_SIZE}px`,
    background: t('surface'),
    primaryColor: t('node'),
    primaryTextColor: t('text'),
    primaryBorderColor: t('node-border'),
    secondaryColor: t('node'),
    secondaryTextColor: t('text'),
    secondaryBorderColor: t('node-border'),
    tertiaryColor: t('cluster'),
    tertiaryTextColor: t('text'),
    tertiaryBorderColor: t('cluster-border'),
    mainBkg: t('node'),
    secondBkg: t('cluster'),
    nodeBorder: t('node-border'),
    nodeTextColor: t('text'),
    textColor: t('text'),
    titleColor: t('text'),
    lineColor: t('line'),
    defaultLinkColor: t('line'),
    arrowheadColor: t('line'),
    clusterBkg: t('cluster'),
    clusterBorder: t('cluster-border'),
    edgeLabelBackground: t('surface'),
    noteBkgColor: t('note'),
    noteTextColor: t('note-text'),
    noteBorderColor: t('note-border'),
    // Sequence
    actorBkg: t('node'),
    actorBorder: t('node-border'),
    actorTextColor: t('text'),
    actorLineColor: t('line'),
    signalColor: t('line'),
    signalTextColor: t('text'),
    labelBoxBkgColor: t('node'),
    labelBoxBorderColor: t('node-border'),
    labelTextColor: t('text'),
    loopTextColor: t('text'),
    activationBkgColor: t('cluster'),
    activationBorderColor: t('node-border'),
    sequenceNumberColor: t('node'),
    // Class and state
    classText: t('text'),
    labelColor: t('text'),
    // Otherwise falls back to stateBkg, making state names the same colour as their box.
    stateLabelColor: t('text'),
    stateBkg: t('node'),
    stateBorder: t('node-border'),
    transitionColor: t('line'),
    transitionLabelColor: t('text'),
    compositeBackground: t('cluster'),
    compositeTitleBackground: t('node'),
    compositeBorder: t('cluster-border'),
    altBackground: t('cluster'),
    innerEndBackground: t('node-border'),
    specialStateColor: t('line'),
    // Pie
    ...Object.fromEntries(palette.map((c, i) => [`pie${i + 1}`, c])),
    pieTitleTextColor: t('text'),
    pieSectionTextColor: t('on-color'),
    pieLegendTextColor: t('text'),
    pieStrokeColor: t('surface'),
    pieOuterStrokeColor: t('node-border'),
    pieOpacity: '1',
    // Git graph
    ...Object.fromEntries(palette.map((c, i) => [`git${i}`, c])),
    ...Object.fromEntries(palette.map((c, i) => [`gitBranchLabel${i}`, t('on-color')])),
    commitLabelColor: t('text'),
    commitLabelBackground: t('node'),
    tagLabelColor: t('note-text'),
    tagLabelBackground: t('note'),
    tagLabelBorder: t('note-border'),
    // Timeline
    ...Object.fromEntries(palette.map((c, i) => [`cScale${i}`, c])),
    ...Object.fromEntries(palette.map((c, i) => [`cScaleLabel${i}`, t('on-color')])),
  },
  flowchart: { useMaxWidth: false, htmlLabels: true, padding: 14, nodeSpacing: 44, rankSpacing: 52, curve: 'basis' },
  sequence: { useMaxWidth: false, actorMargin: 56, messageMargin: 36, boxMargin: 8, noteMargin: 10, mirrorActors: false },
  class: { useMaxWidth: false },
  state: { useMaxWidth: false },
  pie: { useMaxWidth: false },
  gitGraph: { useMaxWidth: false },
  timeline: { useMaxWidth: false },
};

/** CSS custom properties for the tokens, for light (:root) and dark (.dark). */
export function tokenCss() {
  const decl = (mode) =>
    Object.entries(TOKENS)
      .map(([name, v]) => `--dg-${name}:${v[mode]};`)
      .join('');
  return `:root{${decl('light')}}.dark{${decl('dark')}}`;
}

// ── Colour parsing, for matching render colours and deriving dark variants ──

const NAMED = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff',
  gray: '#808080', grey: '#808080', lightgray: '#d3d3d3', lightgrey: '#d3d3d3',
  darkgray: '#a9a9a9', darkgrey: '#a9a9a9', yellow: '#ffff00', orange: '#ffa500',
  purple: '#800080', pink: '#ffc0cb', silver: '#c0c0c0', navy: '#000080', teal: '#008080',
};

/** Parse a CSS colour into [r, g, b, a] (0-255, 0-1), or null. */
export function parseColor(input) {
  const s = input.trim().toLowerCase();
  if (NAMED[s]) return parseColor(NAMED[s]);
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    if (p.length < 3) return null;
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  m = s.match(/^hsla?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    if (p.length < 3) return null;
    const [r, g, b] = hslToRgb(p[0], p[1] / 100, p[2] / 100);
    return [r, g, b, p[3] ?? 1];
  }
  return null;
}

function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export const colorKey = ([r, g, b, a]) =>
  `${Math.round(r)},${Math.round(g)},${Math.round(b)},${Math.round(a * 100) / 100}`;

const fmt = (h, s, l, a) =>
  `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 1000) / 10}%${a < 1 ? ` / ${a}` : ''})`;

/** Light value as written, plus a dark counterpart that keeps the hue. */
export function autoPair(rgba) {
  const [r, g, b, a] = rgba;
  const [h, s, l] = rgbToHsl(r, g, b);
  const light = fmt(h, s, l, a);
  let dl, ds = s;
  if (l >= 0.85) { dl = 0.13 + (1 - l) * 0.35; ds = s * 0.45; } // pale fills become dark tinted surfaces
  else if (l <= 0.3) { dl = 0.92 - l * 0.4; ds = s * 0.6; }    // dark text and lines become light
  else if (l < 0.55) { dl = 0.62; }                              // mid greys and lines: lift a little
  else { dl = l * 0.82; }                                        // saturated mid-tones: same hue, deeper
  return { light, dark: fmt(h, ds, dl, a) };
}

/** Token name for a parsed colour if it is one of the render colours. */
const RENDER_INDEX = new Map(
  Object.entries(TOKENS).map(([name, v]) => [colorKey(parseColor(v.render)), name]),
);
export const tokenFor = (rgba) => RENDER_INDEX.get(colorKey(rgba));
