#!/usr/bin/env node
/**
 * Renders one share card (1200x630 PNG) per diagram into public/og/d/<slug>.png.
 * The card is what LinkedIn, WhatsApp, X and Slack show when someone pastes a
 * /d/<slug> link, and what "Download image" saves.
 *
 * Dark Masst Reels look: near-black ground, the diagram in a rounded panel,
 * the page and heading as the title, docs.masst.dev/d/<slug> at the bottom.
 * Wide diagrams sit under the title; tall ones sit beside it.
 *
 * Usage: node scripts/render-diagram-cards.mjs [--force] [--only /hld/netflix]
 * Needs Chrome (same as pre-render-mermaid).
 */
import fs from 'fs/promises';
import { existsSync, realpathSync } from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { tokenCss } from '../lib/diagram-theme.mjs';
import { diagramLinks } from '../lib/diagram-links.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'og', 'd');
const FONT = path.join(ROOT, 'scripts', 'fonts', 'nunito-latin-var.woff2');
const LOGO = path.join(ROOT, 'public', 'logo.png');
const CONCURRENCY = 4;
const W = 1200;
const H = 630;

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const TYPE = {
  flowchart: 'Flowchart', sequence: 'Sequence diagram', state: 'State diagram', architecture: 'Architecture',
  pie: 'Chart', class: 'Class diagram', er: 'Data model',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function chromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return existsSync(mac) ? mac : undefined;
}

async function shell() {
  const font = (await fs.readFile(FONT)).toString('base64');
  const logo = (await fs.readFile(LOGO)).toString('base64');
  return `<!doctype html><html class="dark"><head><meta charset="utf-8"><style>
@font-face{font-family:'Nunito';src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900;}
${tokenCss()}
:root{--dg-font:'Nunito',sans-serif}
*{box-sizing:border-box;margin:0}
html,body{width:${W}px;height:${H}px;background:#060607;overflow:hidden}
body{font-family:'Nunito',sans-serif;color:#f5f5f7;
  background:radial-gradient(900px 420px at 50% -120px,rgba(108,182,255,.16),transparent 70%),#060607}
.c-card{position:absolute;inset:0;padding:44px 52px 36px;display:flex;flex-direction:column;gap:22px}
.c-card.c-side{flex-direction:row;gap:36px}
.c-text{display:flex;flex-direction:column;gap:12px;min-width:0}
.c-side .c-text{width:380px;flex:none;justify-content:center}
.c-brand{display:flex;align-items:center;gap:12px;font-weight:900;font-size:22px;letter-spacing:-.01em}
.c-brand img{width:34px;height:34px;border-radius:50%}
.c-label{font-size:15px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#6cb6ff}
h1.c-h{font-size:44px;line-height:1.08;font-weight:900;letter-spacing:-.02em;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.c-side h1.c-h{font-size:46px;-webkit-line-clamp:4}
.c-row{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}
.c-panel{flex:1;min-height:0;min-width:0;border-radius:28px;border:1px solid #2c2c33;background:var(--dg-surface);
  padding:22px;display:flex;align-items:center;justify-content:center}
.c-panel svg{max-width:100%;max-height:100%;width:auto;height:auto}
.c-foot{font-size:17px;font-weight:800;color:#8e8e93;overflow-wrap:anywhere}
.c-foot b{color:#f5f5f7}
</style></head><body><div id="root"></div></body></html>`.replace('</style>', `</style><script>window.LOGO='data:image/png;base64,${logo}'</script>`);
}

function cardHtml(d, svg) {
  const side = d.width / d.height < 1.35;
  const label = `${esc(d.pageTitle)} · ${TYPE[d.type] ?? 'Diagram'}`;
  const brand = `<div class="c-brand"><img src="__LOGO__">Masst Docs</div>`;
  const foot = `<div class="c-foot">docs.masst.dev/d/<b>${esc(d.slug)}</b></div>`;
  return side
    ? `<div class="c-card c-side"><div class="c-text">${brand}<div class="c-label">${label}</div><h1 class="c-h">${esc(d.heading)}</h1>${foot}</div><div class="c-panel">${svg}</div></div>`
    : `<div class="c-card"><div class="c-row"><div class="c-text">${brand}<div class="c-label">${label}</div><h1 class="c-h">${esc(d.heading)}</h1></div>${foot}</div><div class="c-panel">${svg}</div></div>`;
}

async function main() {
  const { bySlug } = diagramLinks();
  let todo = [...bySlug.values()];
  if (only) todo = todo.filter((d) => d.pageUrl === only || d.pageUrl.startsWith(`${only}/`));
  await fs.mkdir(OUT, { recursive: true });
  if (!force) todo = todo.filter((d) => !existsSync(path.join(OUT, `${d.slug}.png`)));
  if (!todo.length) return console.log('Share cards: nothing to render.');

  const cli = realpathSync(path.join(ROOT, 'node_modules', '@mermaid-js', 'mermaid-cli', 'package.json'));
  const puppeteer = createRequire(cli)('puppeteer');
  // sharp comes with Next.js.
  const sharp = createRequire(realpathSync(path.join(ROOT, 'node_modules', 'next', 'package.json')))('sharp');
  const browser = await puppeteer.launch({ headless: true, executablePath: chromePath() });
  const html = await shell();
  const started = Date.now();
  let done = 0;

  const worker = async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    while (todo.length) {
      const d = todo.shift();
      const svg = await fs.readFile(path.join(ROOT, 'public', d.svg), 'utf-8');
      await page.evaluate((inner) => {
        document.getElementById('root').innerHTML = inner.replaceAll('__LOGO__', window.LOGO);
        return Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      }, cardHtml(d, svg));
      // 256-colour palette PNG: looks the same, about a quarter of the size.
      const shot = await page.screenshot({ type: 'png' });
      await sharp(shot).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toFile(path.join(OUT, `${d.slug}.png`));
      done++;
    }
    await page.close();
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();
  console.log(`Share cards: rendered ${done} in ${((Date.now() - started) / 1000).toFixed(1)}s → public/og/d/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
