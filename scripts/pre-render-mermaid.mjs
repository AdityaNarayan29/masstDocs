#!/usr/bin/env node

/**
 * Pre-render Mermaid diagrams at build time.
 *
 * For every ```mermaid block and <Mermaid chart=...> in content/, this renders
 * ONE theme-aware SVG into public/mermaid-cache/<hash>.svg:
 *
 * - rendered with the site theme (lib/diagram-theme.mjs) and the Nunito font,
 *   so text is measured in the font it is displayed in;
 * - every colour becomes a CSS variable, so the same SVG follows light and
 *   dark mode instantly (designed tokens for the theme, automatic dark
 *   variants for everything else);
 * - a unique id per diagram (dg-<hash>), so diagrams on one page never
 *   share styles or arrowhead markers;
 * - natural width and height recorded in manifest.json, which
 *   lib/remark-mermaid-inline.mjs uses to size diagrams consistently.
 *
 * Usage:
 *   pnpm pre-render-mermaid            render new or changed diagrams
 *   pnpm pre-render-mermaid --force    re-render everything
 *   pnpm pre-render-mermaid --prune    also delete cache files no diagram uses
 *
 * Needs Chrome. Set PUPPETEER_EXECUTABLE_PATH, or it uses puppeteer's own
 * Chrome or, on macOS, /Applications/Google Chrome.app.
 */

import fs from 'fs/promises';
import { existsSync, realpathSync } from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { MERMAID_CONFIG, RENDER_FONT } from '../lib/diagram-theme.mjs';
import { processSvg } from '../lib/diagram-svg.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const CACHE_DIR = path.join(ROOT_DIR, 'public', 'mermaid-cache');
const CACHE_MANIFEST = path.join(CACHE_DIR, 'manifest.json');
const FONT_FILE = path.join(__dirname, 'fonts', 'nunito-latin-var.woff2');
const MERMAID_BUNDLE = path.join(ROOT_DIR, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

/** Bump to re-render every diagram after changing the theme or post-processing. */
export const RENDER_VERSION = 3;
const CONCURRENCY = 4;

const MERMAID_CODE_BLOCK_REGEX = /```mermaid\n([\s\S]*?)```/g;
const MERMAID_JSX_REGEX = /<Mermaid\s+chart=(?:{`|"|')([\s\S]*?)(?:`}|"|')\s*\/>/g;

/** Must match lib/remark-mermaid-inline.mjs. */
export function hashDiagram(code) {
  let hash = 0;
  const str = code.trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
}

async function findMdxFiles(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await findMdxFiles(full)));
    else if (/\.mdx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

async function extractDiagrams(file) {
  const content = await fs.readFile(file, 'utf-8');
  const found = [];
  for (const m of content.matchAll(MERMAID_CODE_BLOCK_REGEX)) found.push(m[1].trim());
  for (const m of content.matchAll(MERMAID_JSX_REGEX)) found.push(m[1].replace(/\\n/g, '\n').trim());
  return found.map((code) => ({ code, source: path.relative(ROOT_DIR, file) }));
}

// ── Rendering ─────────────────────────────────────────────────────────────

function chromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return existsSync(mac) ? mac : undefined; // undefined: puppeteer's own Chrome
}

async function launch() {
  // puppeteer comes with @mermaid-js/mermaid-cli (pnpm keeps it out of the top level).
  const cliPkg = realpathSync(path.join(ROOT_DIR, 'node_modules', '@mermaid-js', 'mermaid-cli', 'package.json'));
  const puppeteer = createRequire(cliPkg)('puppeteer');
  return puppeteer.launch({ headless: true, executablePath: chromePath() });
}

async function preparePage(browser) {
  const page = await browser.newPage();
  const font = (await fs.readFile(FONT_FILE)).toString('base64');
  await page.setContent(
    `<!doctype html><html><head><style>
      @font-face{font-family:'${RENDER_FONT}';src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900;}
      body{margin:0;font-family:'${RENDER_FONT}'}
    </style></head><body><div id="c"></div></body></html>`,
  );
  await page.addScriptTag({ path: MERMAID_BUNDLE });
  await page.evaluate(async (font, config) => {
    await document.fonts.load(`14px ${font}`);
    await document.fonts.load(`600 14px ${font}`);
    globalThis.mermaid.initialize({ startOnLoad: false, ...config });
  }, RENDER_FONT, MERMAID_CONFIG);
  return page;
}

async function renderOn(page, code, id) {
  return page.evaluate(async (code, id) => {
    const el = document.getElementById('c');
    const { svg } = await globalThis.mermaid.render(id, code, el);
    el.innerHTML = '';
    return svg;
  }, code, id);
}

async function main() {
  if (process.env.VERCEL || process.env.CI || process.env.VERCEL_ENV) {
    console.log('Skipping mermaid pre-render on Vercel/CI (the cache is committed).');
    return;
  }
  const force = process.argv.includes('--force');
  const prune = process.argv.includes('--prune');

  await fs.mkdir(CACHE_DIR, { recursive: true });
  let manifest = {};
  try {
    manifest = JSON.parse(await fs.readFile(CACHE_MANIFEST, 'utf-8'));
  } catch {}

  const diagrams = new Map();
  for (const file of await findMdxFiles(CONTENT_DIR)) {
    for (const d of await extractDiagrams(file)) {
      const hash = hashDiagram(d.code);
      if (!diagrams.has(hash)) diagrams.set(hash, d);
    }
  }

  const todo = [...diagrams].filter(([hash]) => {
    const entry = manifest[hash];
    return force || !entry || entry.v !== RENDER_VERSION || !existsSync(path.join(ROOT_DIR, 'public', entry.svg));
  });
  console.log(`Diagrams: ${diagrams.size} found, ${todo.length} to render.`);

  const failed = [];
  if (todo.length) {
    const browser = await launch();
    try {
      const pages = await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, () => preparePage(browser)));
      let next = 0, done = 0;
      await Promise.all(
        pages.map(async (page) => {
          while (next < todo.length) {
            const [hash, { code, source }] = todo[next++];
            const id = `dg-${hash}`;
            try {
              const { svg, width, height } = processSvg(await renderOn(page, code, id), id);
              await fs.writeFile(path.join(CACHE_DIR, `${hash}.svg`), svg);
              // Keep SEO fields (PNGs, Cloudinary) from the previous entry.
              const { light, dark, ...keep } = manifest[hash] ?? {};
              manifest[hash] = { ...keep, svg: `/mermaid-cache/${hash}.svg`, width, height, v: RENDER_VERSION };
            } catch (e) {
              failed.push({ hash, source, message: String(e?.message ?? e).split('\n')[0] });
            }
            if (++done % 50 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}`);
          }
        }),
      );
    } finally {
      await browser.close();
    }
  }

  // Drop manifest entries for diagrams that no longer exist in content.
  for (const hash of Object.keys(manifest)) if (!diagrams.has(hash)) delete manifest[hash];
  await fs.writeFile(CACHE_MANIFEST, JSON.stringify(manifest, null, 2));

  if (prune) {
    const keep = new Set(Object.values(manifest).flatMap((e) => Object.values(e).filter((v) => typeof v === 'string' && v.startsWith('/mermaid-cache/'))).map((p) => path.basename(p)));
    keep.add('manifest.json');
    keep.add('seo-manifest.json');
    let removed = 0;
    for (const f of await fs.readdir(CACHE_DIR)) {
      if (!keep.has(f) && /\.(svg|png)$/.test(f)) {
        await fs.unlink(path.join(CACHE_DIR, f));
        removed++;
      }
    }
    console.log(`Pruned ${removed} unused cache files.`);
  }

  if (failed.length) {
    console.log(`\n${failed.length} diagram(s) failed and will render in the browser instead:`);
    for (const f of failed) console.log(`  ${f.hash}  ${f.source}: ${f.message}`);
  }
  console.log('Done.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
