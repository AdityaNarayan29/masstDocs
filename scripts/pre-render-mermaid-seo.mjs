#!/usr/bin/env node

/**
 * Pre-render Mermaid diagrams with SEO optimization.
 *
 * This script:
 * 1. Scans all MDX files for mermaid diagrams
 * 2. Extracts context (page title, section heading) for SEO metadata
 * 3. Renders both SVG and PNG for each diagram
 * 4. Uploads PNGs to Cloudinary with SEO metadata
 * 5. Generates an image sitemap for Google indexing
 *
 * Environment variables required:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */

import fs from 'fs/promises';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import crypto from 'crypto';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// Load .env.local manually (Node.js doesn't auto-load it)
try {
  const envPath = path.join(ROOT_DIR, '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
  console.log('✅ Loaded .env.local\n');
} catch {
  console.log('⚠️  No .env.local found, using environment variables\n');
}
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const CACHE_DIR = path.join(ROOT_DIR, 'public', 'mermaid-cache');
const CACHE_MANIFEST = path.join(CACHE_DIR, 'manifest.json');
const SEO_MANIFEST = path.join(CACHE_DIR, 'seo-manifest.json');
const SITEMAP_PATH = path.join(ROOT_DIR, 'public', 'image-sitemap.xml');

// Site configuration
const SITE_URL = process.env.SITE_URL || 'https://docs.masst.dev';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Regex patterns to find mermaid diagrams
const MERMAID_CODE_BLOCK_REGEX = /```mermaid\n([\s\S]*?)```/g;
const MERMAID_JSX_REGEX = /<Mermaid\s+chart=(?:{`|"|')([\s\S]*?)(?:`}|"|')\s*\/>/g;
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;
const HEADING_REGEX = /^#{1,3}\s+(.+)$/gm;

/**
 * Generate a hash for a diagram to use as cache key
 */
function hashDiagram(code) {
  let hash = 0;
  const str = code.trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
}

/**
 * Extract frontmatter from MDX content
 */
function extractFrontmatter(content) {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) return {};

  const frontmatter = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

/**
 * Find the nearest heading before a given position in content
 */
function findNearestHeading(content, position) {
  const beforeContent = content.slice(0, position);
  const headings = [...beforeContent.matchAll(HEADING_REGEX)];
  if (headings.length === 0) return null;
  return headings[headings.length - 1][1].trim();
}

/**
 * Strip Mermaid / HTML noise from a label so it reads like natural text.
 */
function cleanLabel(raw) {
  return raw
    .replace(/<br\s*\/?>/gi, ' ')        // <br/> -> space
    .replace(/&#?\w+;/g, ' ')             // HTML entities -> space
    .replace(/[#"\\]/g, '')               // syntax junk
    .replace(/\s+/g, ' ')                 // collapse whitespace
    .trim();
}

/**
 * Extract the most descriptive labels from a Mermaid diagram.
 * Returns an array of clean phrases (not joined yet — the caller decides).
 */
function extractDiagramLabels(code) {
  const labels = [];

  // 1. subgraph titles ("Before:", "After:") — most descriptive, surface first
  const subgraphMatches = code.matchAll(/subgraph\s+(?:"([^"]+)"|(\S+))(?:\s*\["([^"]+)"\])?/g);
  for (const match of subgraphMatches) {
    const label = match[3] || match[1] || match[2];
    if (label) labels.unshift(cleanLabel(label));
  }

  // 2. node labels like [text], (text), {text}, including quoted variants
  const labelMatches = code.matchAll(/[\[\(\{]"?([^\]\)\}"]+)"?[\]\)\}]/g);
  for (const match of labelMatches) {
    const label = cleanLabel(match[1]);
    if (label && label.length > 2 && label.length < 60 && !/^[a-z]+\d*$/i.test(label)) {
      labels.push(label);
    }
  }

  // Dedup, preserve order
  return [...new Set(labels)];
}

/**
 * Extract diagram description from its content (back-compat shim).
 */
function extractDiagramDescription(code) {
  return extractDiagramLabels(code).slice(0, 5).join(', ');
}

/**
 * Find all MDX files in the content directory
 */
async function findMdxFiles(dir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

/**
 * Extract all mermaid diagrams from an MDX file with context
 */
async function extractDiagramsWithContext(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const diagrams = [];
  const frontmatter = extractFrontmatter(content);

  // Get page URL from file path. Surfaces (see lib/source.ts):
  //   content/docs/case-studies/<slug>  -> /hld/<slug>            (case-studies subtree)
  //   content/docs/lld/...               -> /lld/...
  //   content/docs/dsa/...               -> /dsa/...
  //   content/docs/ai/...                -> /ai/...
  //   content/docs/<everything else>     -> /sd/<rest>            (the curriculum)
  const relativePath = path.relative(CONTENT_DIR, filePath);
  const pathWithoutDocs = relativePath
    .replace(/^docs\//, '')
    .replace(/\.mdx?$/, '')
    .replace(/\/index$/, '');

  let pageUrl;
  if (pathWithoutDocs === 'case-studies' || pathWithoutDocs.startsWith('case-studies/')) {
    // Strip the case-studies/ prefix — /hld is flat (e.g. /hld/netflix)
    pageUrl = '/hld/' + pathWithoutDocs.replace(/^case-studies\/?/, '');
    if (pageUrl === '/hld/') pageUrl = '/hld';
  } else if (pathWithoutDocs === 'lld' || pathWithoutDocs.startsWith('lld/')) {
    pageUrl = '/lld/' + pathWithoutDocs.replace(/^lld\/?/, '');
    if (pageUrl === '/lld/') pageUrl = '/lld';
  } else if (pathWithoutDocs === 'dsa' || pathWithoutDocs.startsWith('dsa/')) {
    pageUrl = '/dsa/' + pathWithoutDocs.replace(/^dsa\/?/, '');
    if (pageUrl === '/dsa/') pageUrl = '/dsa';
  } else if (pathWithoutDocs === 'ai' || pathWithoutDocs.startsWith('ai/')) {
    pageUrl = '/ai/' + pathWithoutDocs.replace(/^ai\/?/, '');
    if (pageUrl === '/ai/') pageUrl = '/ai';
  } else if (pathWithoutDocs === '') {
    // Root docs/index.mdx -> /sd
    pageUrl = '/sd';
  } else {
    pageUrl = '/sd/' + pathWithoutDocs;
  }

  // Extract from ```mermaid code blocks
  let match;
  while ((match = MERMAID_CODE_BLOCK_REGEX.exec(content)) !== null) {
    const code = match[1].trim();
    const sectionHeading = findNearestHeading(content, match.index);
    const diagramDescription = extractDiagramDescription(code);

    diagrams.push({
      code,
      source: filePath,
      pageTitle: frontmatter.title || path.basename(filePath, '.mdx'),
      pageDescription: frontmatter.description || '',
      pageUrl,
      sectionHeading,
      diagramDescription,
      diagramType: detectDiagramType(code),
    });
  }

  MERMAID_CODE_BLOCK_REGEX.lastIndex = 0;

  // Extract from <Mermaid chart="..."> components
  while ((match = MERMAID_JSX_REGEX.exec(content)) !== null) {
    let code = match[1];
    code = code.replace(/\\n/g, '\n').trim();
    const sectionHeading = findNearestHeading(content, match.index);
    const diagramDescription = extractDiagramDescription(code);

    diagrams.push({
      code,
      source: filePath,
      pageTitle: frontmatter.title || path.basename(filePath, '.mdx'),
      pageDescription: frontmatter.description || '',
      pageUrl,
      sectionHeading,
      diagramDescription,
      diagramType: detectDiagramType(code),
    });
  }

  MERMAID_JSX_REGEX.lastIndex = 0;

  return diagrams;
}

/**
 * Detect the type of mermaid diagram
 */
function detectDiagramType(code) {
  const firstLine = code.split('\n')[0].trim().toLowerCase();
  if (firstLine.startsWith('graph') || firstLine.startsWith('flowchart')) return 'flowchart';
  if (firstLine.startsWith('sequencediagram')) return 'sequence';
  if (firstLine.startsWith('classdiagram')) return 'class';
  if (firstLine.startsWith('statediagram')) return 'state';
  if (firstLine.startsWith('erdiagram')) return 'er';
  if (firstLine.startsWith('gantt')) return 'gantt';
  if (firstLine.startsWith('pie')) return 'pie';
  if (firstLine.startsWith('journey')) return 'journey';
  return 'architecture';
}

/**
 * Surface inferred from page URL. Drives which topical label to emit.
 */
function surfaceFromUrl(pageUrl) {
  if (!pageUrl) return 'sd';
  if (pageUrl.startsWith('/hld')) return 'hld';
  if (pageUrl.startsWith('/lld')) return 'lld';
  if (pageUrl.startsWith('/dsa')) return 'dsa';
  if (pageUrl.startsWith('/ai'))  return 'ai';
  return 'sd';
}

const SURFACE_LABEL = {
  sd:  'System Design',
  hld: 'HLD Case Study',
  lld: 'Low-Level Design',
  dsa: 'DSA Pattern',
  ai:  'AI Engineering',
};

const TYPE_LABELS = {
  flowchart: 'flowchart',
  sequence:  'sequence diagram',
  class:     'class diagram',
  state:     'state machine',
  er:        'ER diagram',
  gantt:     'timeline',
  pie:       'distribution chart',
  journey:   'user-flow diagram',
  architecture: 'architecture diagram',
};

/**
 * Build a natural-language alt text under ~125 chars suitable for both
 * screen readers and Google Image alt-text ranking. Format:
 *   "<PageTitle> — <SectionHeading>: <typeLabel> showing <a>, <b>, <c>."
 * Falls back gracefully when section heading is missing.
 */
function generateAltText(diagram) {
  const typeLabel = TYPE_LABELS[diagram.diagramType] || 'diagram';
  const pageTitle = diagram.pageTitle || '';
  const sectionHeading = diagram.sectionHeading && diagram.sectionHeading !== pageTitle
    ? diagram.sectionHeading
    : '';

  // Top 3 labels — enough context, doesn't blow the char budget.
  const labels = extractDiagramLabels(diagram.code || '').slice(0, 3);

  const lead = sectionHeading
    ? `${pageTitle} — ${sectionHeading}`
    : pageTitle;

  // Compose the body
  let body = `${lead}: ${typeLabel}`;
  if (labels.length) body += ` showing ${labels.join(', ')}`;
  body += '.';

  // Hard cap at 130 chars (Google's recommended 80-125 window with a bit of slack).
  if (body.length > 130) {
    body = body.slice(0, 127).replace(/[,;:\s][^,;:\s]*$/, '') + '…';
  }
  return body;
}

/**
 * Slugify a string for use in a URL path: lowercase, alphanumeric and
 * dashes only, collapse runs of non-alphanumeric, trim leading/trailing
 * dashes.
 */
function slugify(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')      // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);                          // hard cap
}

/**
 * SEO-friendly Cloudinary public_id. Format:
 *   masst-docs/<surface>/<page-slug>/<section-slug>-<short-hash>
 * The short hash keeps uniqueness across collisions (two diagrams on the
 * same page with identical sections), and Google reads the descriptive
 * path segments as ranking signal.
 */
function buildSeoSlug(diagram, hash) {
  const surface = surfaceFromUrl(diagram.pageUrl);
  const pageSlug = slugify(diagram.pageTitle) || 'diagram';
  const sectionSlug = slugify(diagram.sectionHeading);
  const shortHash = hash.slice(0, 6);
  const tail = sectionSlug ? `${sectionSlug}-${shortHash}` : `${pageSlug}-${shortHash}`;
  return `masst-docs/${surface}/${pageSlug}/${tail}`;
}

/**
 * Generate the schema.org `name` / HTML `title` attribute for the image.
 * Short, surface-correct, brand suffix at the end.
 * Format:  "<PageTitle> · <SectionHeading> · <Surface Label> | MASST Docs"
 */
function generateTitle(diagram) {
  const surface = surfaceFromUrl(diagram.pageUrl);
  const surfaceLabel = SURFACE_LABEL[surface];
  const parts = [];

  if (diagram.pageTitle) parts.push(diagram.pageTitle);
  if (diagram.sectionHeading && diagram.sectionHeading !== diagram.pageTitle) {
    parts.push(diagram.sectionHeading);
  }
  parts.push(surfaceLabel);

  return parts.join(' · ') + ' | MASST Docs';
}

// Counter for unique temp file names
let tempFileCounter = 0;

/**
 * Escape characters that would break inside an SVG text element.
 */
function escapeSvgText(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Truncate a string to N chars with an ellipsis when over budget.
 */
function truncate(s, n) {
  const v = (s || '').trim();
  if (v.length <= n) return v;
  return v.slice(0, n - 1).trimEnd() + '…';
}

/**
 * Composite a thin branded header strip onto the top of the PNG and a
 * subtle "docs.masst.dev" wordmark at the bottom-right corner. Runs in
 * place — input path is overwritten with the branded version.
 *
 * Design goals:
 *   - Header strip is editorial, not invasive: ~50px tall, white-on-
 *     light or dark-on-dark to match the diagram theme.
 *   - Watermark is small (~14px) and 35% opacity — visible enough to
 *     attribute, subtle enough not to break the diagram.
 *   - SVG overlay generated inline (no font files needed; system fonts
 *     resolved by Sharp's libvips).
 */
async function brandImage(pngPath, diagram, theme) {
  try {
    const img = sharp(pngPath);
    const meta = await img.metadata();
    const w = meta.width;
    const h = meta.height;
    if (!w || !h) return false;

    // Skip branding on tiny diagrams (< 400px wide) — the strip would
    // dominate the visual.
    if (w < 400) return true;

    const surface = surfaceFromUrl(diagram.pageUrl);
    const surfaceLabel = SURFACE_LABEL[surface];
    const pageTitle = truncate(diagram.pageTitle || 'Diagram', 60);
    const sectionHeading = truncate(diagram.sectionHeading || surfaceLabel, 48);

    // Theme palette
    const isDark = theme === 'dark';
    const stripBg = isDark ? '#0f1419' : '#fafafa';
    const stripBorder = isDark ? '#1f2937' : '#e5e7eb';
    const stripTitle = isDark ? '#f3f4f6' : '#111827';
    const stripMuted = isDark ? '#9ca3af' : '#6b7280';
    const surfaceColor = {
      sd: '#10b981',   // emerald
      hld: '#3b82f6',  // blue
      lld: '#8b5cf6',  // violet
      dsa: '#f97316',  // orange
      ai: '#ec4899',   // pink
    }[surface] || '#6b7280';
    const wmColor = isDark ? '#ffffff' : '#000000';

    // Header height scales with diagram width to keep proportions ok
    const headerH = 50;
    const padX = 16;
    const dotR = 5;
    const titleFontSize = 16;
    const metaFontSize = 13;
    const wmFontSize = 12;

    // Build the overlay SVG
    const overlayW = w;
    const overlayH = h + headerH;

    const headerSvg = `
      <rect x="0" y="0" width="${overlayW}" height="${headerH}" fill="${stripBg}" />
      <rect x="0" y="${headerH - 1}" width="${overlayW}" height="1" fill="${stripBorder}" />
      <circle cx="${padX + dotR}" cy="${headerH / 2}" r="${dotR}" fill="${surfaceColor}" />
      <text x="${padX + dotR * 2 + 10}" y="${headerH / 2 + titleFontSize / 3}"
            font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            font-size="${titleFontSize}" font-weight="600" fill="${stripTitle}">
        ${escapeSvgText(pageTitle)}
      </text>
      <text x="${overlayW - padX}" y="${headerH / 2 + metaFontSize / 3}"
            text-anchor="end"
            font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            font-size="${metaFontSize}" fill="${stripMuted}">
        ${escapeSvgText(sectionHeading)} · ${escapeSvgText(surfaceLabel)}
      </text>
    `;

    // Bottom-right wordmark — rendered in its own SVG that we composite
    // separately so it always pins to the bottom regardless of header.
    const wmText = 'docs.masst.dev';
    const wmW = 200;
    const wmH = 22;
    const wmSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${wmW}" height="${wmH}">
        <text x="${wmW - 8}" y="${wmH - 8}"
              text-anchor="end"
              font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
              font-size="${wmFontSize}" font-weight="500"
              fill="${wmColor}" fill-opacity="0.35"
              letter-spacing="0.5">
          ${wmText}
        </text>
      </svg>
    `;

    // First: add the header strip on top by creating a larger canvas
    // (original height + headerH) and pasting the original below the
    // header.
    const headerSvgFull = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${overlayW}" height="${overlayH}">
        ${headerSvg}
        <rect x="0" y="${headerH}" width="${overlayW}" height="${h}" fill="white" />
      </svg>
    `;

    // Use a two-step composite:
    // 1. Build a new canvas of width × (height + headerH) with the
    //    header pre-painted at the top.
    // 2. Composite the original PNG starting at y = headerH.
    // 3. Composite the wordmark at bottom-right.
    const canvas = await sharp(Buffer.from(headerSvgFull))
      .png()
      .toBuffer();

    const branded = await sharp(canvas)
      .composite([
        { input: pngPath, top: headerH, left: 0 },
        {
          input: Buffer.from(wmSvg),
          gravity: 'southeast',
        },
      ])
      .png()
      .toBuffer();

    await fs.writeFile(pngPath, branded);
    return true;
  } catch (err) {
    console.error(`  ⚠️  brandImage failed for ${pngPath}: ${err.message}`);
    return false;
  }
}

/**
 * Render a diagram to SVG and PNG, then composite a branded header + watermark
 * onto the PNG (PNGs are what gets shared / image-indexed; SVGs stay raw for
 * in-page rendering).
 */
async function renderDiagram(code, hash, theme, diagram) {
  // mmdc's "default" theme is what we expose as "light" on disk so the
  // file naming matches /lib/remark-mermaid-inline.mjs and the manifest.
  const themeSuffix = theme === 'default' ? 'light' : theme;
  const tempInput = path.join(CACHE_DIR, `temp-${Date.now()}-${tempFileCounter++}-${theme}.mmd`);
  const svgOutput = path.join(CACHE_DIR, `${hash}-${themeSuffix}.svg`);
  const pngOutput = path.join(CACHE_DIR, `${hash}-${themeSuffix}.png`);

  await fs.writeFile(tempInput, code);

  const mmdcPath = path.join(ROOT_DIR, 'node_modules', '.bin', 'mmdc');

  // Render SVG
  const svgArgs = ['-i', tempInput, '-o', svgOutput, '-t', theme, '-b', 'transparent', '--quiet'];

  // Render PNG with higher quality for SEO. Background is theme-aware so the
  // branding overlay sits on a consistent surface (white for light, dark navy
  // for dark) instead of mmdc's default.
  const pngBg = theme === 'dark' ? '#0f1419' : 'white';
  const pngArgs = ['-i', tempInput, '-o', pngOutput, '-t', theme, '-b', pngBg, '-s', '2', '--quiet'];

  try {
    // Render SVG
    await runCommand(mmdcPath, svgArgs);

    // Render PNG
    await runCommand(mmdcPath, pngArgs);

    // Process SVG
    await processSvg(svgOutput);

    // Composite header + watermark onto the PNG
    if (diagram) {
      await brandImage(pngOutput, diagram, themeSuffix);
    }

    return { svgOutput, pngOutput, success: true };
  } catch (error) {
    console.error(`Render error: ${error.message}`);
    return { success: false };
  } finally {
    try {
      await fs.unlink(tempInput);
    } catch {}
  }
}

/**
 * Run a command and return a promise
 */
function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `Exit code ${code}`));
    });
    proc.on('error', reject);
  });
}

/**
 * Process SVG for embedding
 */
async function processSvg(svgPath) {
  try {
    let svg = await fs.readFile(svgPath, 'utf-8');
    svg = svg.replace(/<\?xml[^?]*\?>/g, '');
    svg = svg.replace(/<svg/, '<svg class="mermaid-svg"');
    svg = svg.replace(/width="[^"]*"/, '');
    svg = svg.replace(/height="[^"]*"/, '');
    await fs.writeFile(svgPath, svg.trim());
  } catch {}
}

/**
 * Upload image to Cloudinary.
 *
 * `publicId` is the full path under the Cloudinary account (no leading
 * slash, no extension), e.g. `masst-docs/ai/agents/agents-vs-chains-abc123`.
 * Google reads this path segment-by-segment, so use it for SEO signal.
 */
async function uploadToCloudinary(imagePath, publicId, metadata) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Create signature. We pass `public_id` only — the folder is encoded
  // into the public_id itself (Cloudinary auto-creates folders).
  const paramsToSign = {
    context: `alt=${encodeURIComponent(metadata.alt)}|caption=${encodeURIComponent(metadata.title)}`,
    public_id: publicId,
    timestamp,
  };

  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map(key => `${key}=${paramsToSign[key]}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(sortedParams + CLOUDINARY_API_SECRET)
    .digest('hex');

  // Read file
  const fileBuffer = await fs.readFile(imagePath);
  const base64File = `data:image/png;base64,${fileBuffer.toString('base64')}`;

  // Upload
  const formData = new URLSearchParams();
  formData.append('file', base64File);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('public_id', publicId);
  formData.append('context', paramsToSign.context);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Cloudinary upload failed: ${error}`);
      return null;
    }

    const result = await response.json();
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error(`Cloudinary upload error: ${error.message}`);
    return null;
  }
}

/**
 * Generate image sitemap XML
 */
function generateImageSitemap(seoManifest) {
  const entries = Object.values(seoManifest);

  // Group by page URL
  const pageGroups = {};
  for (const entry of entries) {
    if (!pageGroups[entry.pageUrl]) {
      pageGroups[entry.pageUrl] = [];
    }
    pageGroups[entry.pageUrl].push(entry);
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  for (const [pageUrl, images] of Object.entries(pageGroups)) {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${pageUrl}</loc>\n`;

    for (const image of images) {
      const imageUrl = image.cloudinaryUrl || `${SITE_URL}/mermaid-cache/${image.hash}-light.png`;
      xml += '    <image:image>\n';
      xml += `      <image:loc>${imageUrl}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(image.title)}</image:title>\n`;
      xml += `      <image:caption>${escapeXml(image.alt)}</image:caption>\n`;
      xml += '    </image:image>\n';
    }

    xml += '  </url>\n';
  }

  xml += '</urlset>\n';
  return xml;
}

/**
 * Escape special characters for XML
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Main function
 */
async function main() {
  const skipUpload = process.argv.includes('--skip-upload');
  const generateSitemapOnly = process.argv.includes('--sitemap-only');
  // --rebrand: re-apply brandImage() to every existing PNG without
  // re-rendering through mmdc. Use after updating the branding design
  // or bumping the metadata generators.
  const rebrandOnly = process.argv.includes('--rebrand');

  // Skip on Vercel/CI unless explicitly running sitemap generation
  if ((process.env.VERCEL || process.env.CI) && !generateSitemapOnly) {
    console.log('⏭️  Skipping mermaid pre-render on Vercel/CI\n');
    return;
  }

  console.log('🎨 Pre-rendering Mermaid diagrams with SEO optimization...\n');

  // Ensure cache directory exists
  await fs.mkdir(CACHE_DIR, { recursive: true });

  // Load existing manifests
  let manifest = {};
  let seoManifest = {};
  try {
    manifest = JSON.parse(await fs.readFile(CACHE_MANIFEST, 'utf-8'));
  } catch {}
  try {
    seoManifest = JSON.parse(await fs.readFile(SEO_MANIFEST, 'utf-8'));
  } catch {}

  if (generateSitemapOnly) {
    console.log('📝 Generating image sitemap only...\n');
    const sitemap = generateImageSitemap(seoManifest);
    await fs.writeFile(SITEMAP_PATH, sitemap);
    console.log(`✨ Image sitemap saved to ${SITEMAP_PATH}`);
    return;
  }

  if (rebrandOnly) {
    console.log('🎨 Re-branding existing PNGs (no re-render)...\n');
    // Walk all MDX files to recover per-diagram context (so the header
    // strip shows the right page title + section heading).
    const mdxFiles = await findMdxFiles(CONTENT_DIR);
    const diagramByHash = new Map();
    for (const file of mdxFiles) {
      for (const d of await extractDiagramsWithContext(file)) {
        const h = hashDiagram(d.code);
        if (!diagramByHash.has(h)) diagramByHash.set(h, { ...d, hash: h });
      }
    }

    let done = 0, missing = 0, failed = 0;
    for (const [hash, diagram] of diagramByHash) {
      for (const theme of ['light', 'dark']) {
        const pngPath = path.join(CACHE_DIR, `${hash}-${theme}.png`);
        try {
          await fs.access(pngPath);
        } catch {
          missing++;
          continue;
        }
        // Skip if already branded (heuristic: PNG height > original raster
        // height would indicate header was added — but we don't know the
        // original height, so we just brand idempotently. The function
        // tolerates re-runs because it always reads current dimensions).
        // For first-run idempotency we'd need a "branded" flag; for now
        // we rebrand only when the flag is explicitly set.
        const ok = await brandImage(pngPath, diagram, theme);
        if (ok) done++;
        else failed++;
      }
      if ((done + failed) % 100 === 0) {
        process.stdout.write(`  branded ${done} / ${diagramByHash.size * 2}\r`);
      }
    }
    console.log(`\n✅ Re-branded ${done} PNGs (${missing} missing, ${failed} failed).`);
    return;
  }

  // Check if mmdc is available
  const mmdcPath = path.join(ROOT_DIR, 'node_modules', '.bin', 'mmdc');
  try {
    await fs.access(mmdcPath);
  } catch {
    console.error('❌ @mermaid-js/mermaid-cli not found!');
    process.exit(1);
  }

  // Find all MDX files
  const mdxFiles = await findMdxFiles(CONTENT_DIR);
  console.log(`📁 Found ${mdxFiles.length} MDX files\n`);

  // Extract all diagrams with context
  const allDiagrams = [];
  for (const file of mdxFiles) {
    const diagrams = await extractDiagramsWithContext(file);
    allDiagrams.push(...diagrams);
  }

  // Deduplicate by hash but keep context
  const uniqueDiagrams = new Map();
  for (const diagram of allDiagrams) {
    const hash = hashDiagram(diagram.code);
    if (!uniqueDiagrams.has(hash)) {
      uniqueDiagrams.set(hash, { ...diagram, hash });
    }
  }

  console.log(`📊 Found ${allDiagrams.length} diagrams (${uniqueDiagrams.size} unique)\n`);

  let rendered = 0;
  let cached = 0;
  let uploaded = 0;
  let failed = 0;

  for (const [hash, diagram] of uniqueDiagrams) {
    // Check if already cached
    const hasSvg = manifest[hash];
    const hasSeo = seoManifest[hash];
    const hasCloudinary = hasSeo?.cloudinaryUrl;

    // Always regenerate alt/title/keywords from current generators so
    // metadata stays in sync with the code (cheap; just string ops).
    const freshAlt = generateAltText(diagram);
    const freshTitle = generateTitle(diagram);

    // If fully cached (SVGs exist + Cloudinary uploaded), refresh metadata
    // in place and skip re-rendering.
    if (hasSvg && hasSeo && hasCloudinary) {
      try {
        await fs.access(path.join(CACHE_DIR, `${hash}-light.svg`));
        await fs.access(path.join(CACHE_DIR, `${hash}-dark.svg`));
        seoManifest[hash] = {
          ...hasSeo,
          alt: freshAlt,
          title: freshTitle,
          pageTitle: diagram.pageTitle,
          pageUrl: diagram.pageUrl,
          sectionHeading: diagram.sectionHeading,
          diagramType: diagram.diagramType,
        };
        cached++;
        continue;
      } catch {}
    }

    // SVGs exist but no Cloudinary URL — refresh metadata, optionally upload.
    if (hasSvg && hasSeo && !hasCloudinary) {
      // Update metadata first so the manifest is always correct, even if
      // upload is skipped or fails.
      seoManifest[hash] = {
        ...hasSeo,
        alt: freshAlt,
        title: freshTitle,
        pageTitle: diagram.pageTitle,
        pageUrl: diagram.pageUrl,
        sectionHeading: diagram.sectionHeading,
        diagramType: diagram.diagramType,
      };
    }

    // If SVGs exist but no Cloudinary URL, just upload (don't re-render).
    // Use the freshly-regenerated alt/title from the refresh block above,
    // not the stale `hasSeo` snapshot.
    if (hasSvg && hasSeo && !hasCloudinary && !skipUpload && CLOUDINARY_CLOUD_NAME) {
      const pngPath = path.join(CACHE_DIR, `${hash}-light.png`);
      try {
        await fs.access(pngPath);
        process.stdout.write(`  Uploading ${hash} to Cloudinary... `);

        const seoSlug = buildSeoSlug(diagram, hash);
        const cloudinaryResult = await uploadToCloudinary(pngPath, seoSlug, {
          alt: freshAlt,
          title: freshTitle,
        });

        if (cloudinaryResult) {
          seoManifest[hash] = {
            ...hasSeo,
            cloudinaryUrl: cloudinaryResult.url,
            cloudinaryPublicId: cloudinaryResult.publicId,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
          };
          uploaded++;
          console.log('✅');
        } else {
          console.log('❌');
          failed++;
        }
        continue;
      } catch {}
    }

    const relativePath = path.relative(ROOT_DIR, diagram.source);
    process.stdout.write(`  Rendering ${hash} (${relativePath})... `);

    // Render both themes (diagram is passed so brandImage can read pageUrl,
    // pageTitle, sectionHeading for the header strip).
    const [lightResult, darkResult] = await Promise.all([
      renderDiagram(diagram.code, hash, 'default', diagram),
      renderDiagram(diagram.code, hash, 'dark', diagram),
    ]);

    if (lightResult.success && darkResult.success) {
      // Update manifest
      manifest[hash] = {
        light: `/mermaid-cache/${hash}-light.svg`,
        dark: `/mermaid-cache/${hash}-dark.svg`,
        lightPng: `/mermaid-cache/${hash}-light.png`,
        darkPng: `/mermaid-cache/${hash}-dark.png`,
      };

      // Generate SEO metadata
      const alt = generateAltText(diagram);
      const title = generateTitle(diagram);

      const seoEntry = {
        hash,
        pageTitle: diagram.pageTitle,
        pageUrl: diagram.pageUrl,
        sectionHeading: diagram.sectionHeading,
        diagramType: diagram.diagramType,
        alt,
        title,
        localPng: `/mermaid-cache/${hash}-light.png`,
      };

      // Upload to Cloudinary if configured and not skipped
      if (!skipUpload && CLOUDINARY_CLOUD_NAME) {
        const seoSlug = buildSeoSlug(diagram, hash);
        const cloudinaryResult = await uploadToCloudinary(
          lightResult.pngOutput,
          seoSlug,
          { alt, title }
        );

        if (cloudinaryResult) {
          seoEntry.cloudinaryUrl = cloudinaryResult.url;
          seoEntry.cloudinaryPublicId = cloudinaryResult.publicId;
          seoEntry.width = cloudinaryResult.width;
          seoEntry.height = cloudinaryResult.height;
          uploaded++;
        }
      }

      seoManifest[hash] = seoEntry;

      console.log('✅');
      rendered++;
    } else {
      console.log('❌');
      failed++;
    }
  }

  // Save manifests
  await fs.writeFile(CACHE_MANIFEST, JSON.stringify(manifest, null, 2));
  await fs.writeFile(SEO_MANIFEST, JSON.stringify(seoManifest, null, 2));

  // Generate image sitemap
  const sitemap = generateImageSitemap(seoManifest);
  await fs.writeFile(SITEMAP_PATH, sitemap);

  console.log('\n📊 Summary:');
  console.log(`   ✅ Rendered: ${rendered}`);
  console.log(`   📦 Cached: ${cached}`);
  console.log(`   ☁️  Uploaded to Cloudinary: ${uploaded}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n✨ Manifests saved`);
  console.log(`✨ Image sitemap saved to ${SITEMAP_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
