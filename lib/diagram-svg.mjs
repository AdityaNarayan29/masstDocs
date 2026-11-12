/**
 * Turns a raw Mermaid SVG into a theme-aware one. Pure string work, shared by
 * scripts/pre-render-mermaid.mjs (build time) and components/mdx/mermaid.tsx
 * (browser fallback for diagrams that were not pre-rendered).
 *
 * - every colour becomes a CSS variable: the theme's tokens (var(--dg-*)) or an
 *   automatic light/dark pair scoped to this SVG;
 * - the render font becomes var(--dg-font);
 * - width/height come from CSS; the natural size is returned for layout.
 */

import { RENDER_FONT, autoPair, parseColor, colorKey, tokenFor } from './diagram-theme.mjs';

const COLOR_RE = /#[0-9a-fA-F]{3,8}(?![\w-])|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
const NAMED_RE = /(:\s*)(black|white|red|green|blue|gr[ae]y|lightgr[ae]y|darkgr[ae]y|yellow|orange|purple|pink|silver|navy|teal)(?=\s*(?:[;!}"']|$))/gi;
const PRESENTATION_PROPS = ['fill', 'stroke', 'stop-color', 'flood-color', 'color', 'font-family'];
const SKIP = /^(none|transparent|currentcolor|inherit|initial|unset|revert|context-stroke|context-fill)$/i;

function createColorMapper() {
  const autos = new Map();
  const map = (raw) => {
    const value = raw.trim();
    if (SKIP.test(value) || value.startsWith('url(') || value.startsWith('var(')) return null;
    const rgba = parseColor(value);
    if (!rgba) return null;
    const token = tokenFor(rgba);
    if (token) return `var(--dg-${token})`;
    const key = colorKey(rgba);
    if (!autos.has(key)) autos.set(key, { name: `--k${autos.size}`, ...autoPair(rgba) });
    return `var(${autos.get(key).name})`;
  };
  return { map, autos };
}


/** Replace colours and the render font inside CSS text (a <style> block or style="" value). */
function rewriteCss(css, map, fontRe) {
  return css
    .replace(COLOR_RE, (c) => map(c) ?? c)
    .replace(NAMED_RE, (all, pre, name) => {
      const v = map(name);
      return v ? pre + v : all;
    })
    .replace(fontRe, 'var(--dg-font)');
}

/**
 * @param {string} raw  SVG from mermaid.render
 * @param {string} id   the id it was rendered with (unique per diagram)
 * @param {string} [font] font family it was rendered with
 */
export function processSvg(raw, id, font = RENDER_FONT) {
  const escaped = font.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fontRe = new RegExp(`(&quot;|"|')?${escaped}\\1`, 'g');
  let svg = raw.replace(/<\?xml[^>]*>/, '').trim();
  const { map, autos } = createColorMapper();

  // Natural size from the viewBox.
  const vb = svg.match(/<svg\b[^>]*viewBox="([-\d.]+)[ ,]+([-\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)"/);
  if (!vb) throw new Error('rendered SVG has no viewBox');
  const width = Math.ceil(parseFloat(vb[3]));
  const height = Math.ceil(parseFloat(vb[4]));

  // Root: size comes from CSS, not attributes.
  svg = svg.replace(/<svg\b[^>]*>/, (root) => {
    let r = root
      .replace(/\s(width|height)="[^"]*"/g, '')
      .replace(/\sstyle="[^"]*"/, '');
    r = /\sclass="/.test(r) ? r.replace(/\sclass="/, ' class="dg-svg ') : r.replace(/^<svg/, '<svg class="dg-svg"');
    return r;
  });

  // <style> blocks.
  svg = svg.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (_, open, css, close) => open + rewriteCss(css, map, fontRe) + close);

  // Presentation attributes can't hold var(): move them into zero-specificity
  // class rules so the cascade behaves exactly as before.
  const presentation = new Map();
  svg = svg.replace(/<([a-zA-Z][\w:-]*)(\s[^<>]*?)?(\/?)>/g, (tag, name, attrs = '', selfClose) => {
    if (!attrs) return tag;
    let a = attrs.replace(/\sstyle="([^"]*)"/, (m, css) => ` style="${rewriteCss(css, map, fontRe)}"`);
    const classes = [];
    for (const prop of PRESENTATION_PROPS) {
      a = a.replace(new RegExp(`\\s${prop}="([^"]*)"`), (m, value) => {
        const v = prop === 'font-family' ? (value.includes(font) ? 'var(--dg-font)' : null) : map(value);
        if (!v) return m;
        const key = `${prop}:${v}`;
        if (!presentation.has(key)) presentation.set(key, `dgp${presentation.size}`);
        classes.push(presentation.get(key));
        return '';
      });
    }
    if (classes.length) {
      a = /\sclass="/.test(a) ? a.replace(/\sclass="/, ` class="${classes.join(' ')} `) : `${a} class="${classes.join(' ')}"`;
    }
    return `<${name}${a}${selfClose}>`;
  });

  const scope = `#${id}`;
  const vars = [...autos.values()];
  const extra = [
    // Automatic colours: light by default, dark under the site's .dark class.
    vars.length ? `${scope}{${vars.map((v) => `${v.name}:${v.light}`).join(';')}}` : '',
    vars.length ? `.dark ${scope}{${vars.map((v) => `${v.name}:${v.dark}`).join(';')}}` : '',
    ...[...presentation].map(([decl, cls]) => `:where(${scope} .${cls}){${decl}}`),
    // Finish: rounded shapes, lighter strokes, dashed groups.
    `${scope}{font-family:var(--dg-font)}`,
    `${scope} .node rect,${scope} rect.actor,${scope} .note rect,${scope} rect.note,${scope} .label-container{rx:12px;ry:12px}`,
    `${scope} .cluster rect{rx:16px;ry:16px;stroke-dasharray:5 4}`,
    `${scope} .node rect,${scope} .node polygon,${scope} .node circle,${scope} .node path,${scope} rect.actor{stroke-width:1px}`,
    `${scope} .flowchart-link,${scope} .messageLine0,${scope} .messageLine1,${scope} .relation,${scope} .transition{stroke-width:1.5px}`,
  ].filter(Boolean).join('');

  svg = svg.replace(/(<style[^>]*>)/, `$1${extra}`);
  return { svg, width, height };
}
