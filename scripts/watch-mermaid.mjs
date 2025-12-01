#!/usr/bin/env node

/**
 * Watch MDX files for mermaid diagram changes and re-render only affected diagrams.
 * Run this alongside `next dev` for instant mermaid updates without full pre-render.
 *
 * Usage: node scripts/watch-mermaid.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const CACHE_DIR = path.join(ROOT_DIR, 'public', 'mermaid-cache');
const CACHE_MANIFEST = path.join(CACHE_DIR, 'manifest.json');

// Regex patterns to find mermaid diagrams
const MERMAID_CODE_BLOCK_REGEX = /```mermaid\n([\s\S]*?)```/g;
const MERMAID_JSX_REGEX = /<Mermaid\s+chart=(?:{`|"|')([\s\S]*?)(?:`}|"|')\s*\/>/g;

// Debounce map to prevent multiple renders for rapid saves
const debounceMap = new Map();
const DEBOUNCE_MS = 500;

/**
 * Generate hash for diagram (must match pre-render script)
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
 * Extract diagrams from file content
 */
function extractDiagrams(content) {
  const diagrams = [];
  let match;

  // Extract from ```mermaid code blocks
  while ((match = MERMAID_CODE_BLOCK_REGEX.exec(content)) !== null) {
    diagrams.push(match[1].trim());
  }
  MERMAID_CODE_BLOCK_REGEX.lastIndex = 0;

  // Extract from <Mermaid chart="..." /> components
  while ((match = MERMAID_JSX_REGEX.exec(content)) !== null) {
    diagrams.push(match[1].replace(/\\n/g, '\n').trim());
  }
  MERMAID_JSX_REGEX.lastIndex = 0;

  return diagrams;
}

/**
 * Load existing manifest
 */
function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_MANIFEST, 'utf-8'));
  } catch {
    return {};
  }
}

/**
 * Save manifest
 */
function saveManifest(manifest) {
  fs.writeFileSync(CACHE_MANIFEST, JSON.stringify(manifest, null, 2));
}

/**
 * Render a single diagram
 */
async function renderDiagram(code, hash) {
  const mmdcPath = path.join(ROOT_DIR, 'node_modules', '.bin', 'mmdc');
  const tempInput = path.join(CACHE_DIR, `temp-watch-${hash}.mmd`);

  fs.writeFileSync(tempInput, code);

  const themes = ['default', 'dark'];
  const results = {};

  for (const theme of themes) {
    const outputPath = path.join(CACHE_DIR, `${hash}-${theme === 'default' ? 'light' : 'dark'}.svg`);

    const success = await new Promise((resolve) => {
      const proc = spawn(mmdcPath, [
        '-i', tempInput,
        '-o', outputPath,
        '-t', theme,
        '-b', 'transparent',
        '--quiet',
      ], { stdio: ['pipe', 'pipe', 'pipe'] });

      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });

    if (success) {
      // Process SVG
      let svg = fs.readFileSync(outputPath, 'utf-8');
      svg = svg.replace(/<\?xml[^?]*\?>/g, '');
      svg = svg.replace(/<svg/, '<svg class="mermaid-svg"');
      svg = svg.replace(/width="[^"]*"/, '');
      svg = svg.replace(/height="[^"]*"/, '');
      fs.writeFileSync(outputPath, svg.trim());

      results[theme === 'default' ? 'light' : 'dark'] = `/mermaid-cache/${hash}-${theme === 'default' ? 'light' : 'dark'}.svg`;
    }
  }

  // Cleanup temp file
  try { fs.unlinkSync(tempInput); } catch {}

  return Object.keys(results).length === 2 ? results : null;
}

/**
 * Process a changed file
 */
async function processFile(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const diagrams = extractDiagrams(content);

    if (diagrams.length === 0) return;

    const manifest = loadManifest();
    let rendered = 0;
    let skipped = 0;

    for (const code of diagrams) {
      const hash = hashDiagram(code);

      // Check if already cached
      const lightPath = path.join(CACHE_DIR, `${hash}-light.svg`);
      const darkPath = path.join(CACHE_DIR, `${hash}-dark.svg`);

      if (fs.existsSync(lightPath) && fs.existsSync(darkPath) && manifest[hash]) {
        skipped++;
        continue;
      }

      process.stdout.write(`  Rendering ${hash.slice(0, 8)}... `);
      const result = await renderDiagram(code, hash);

      if (result) {
        manifest[hash] = result;
        console.log('\x1b[32m done\x1b[0m');
        rendered++;
      } else {
        console.log('\x1b[31m failed\x1b[0m');
      }
    }

    if (rendered > 0) {
      saveManifest(manifest);
      console.log(`\x1b[36m  ${relativePath}: ${rendered} rendered, ${skipped} cached\x1b[0m\n`);
    }
  } catch (err) {
    console.error(`Error processing ${relativePath}:`, err.message);
  }
}

/**
 * Debounced file handler
 */
function handleFileChange(filePath) {
  const existing = debounceMap.get(filePath);
  if (existing) clearTimeout(existing);

  debounceMap.set(filePath, setTimeout(() => {
    debounceMap.delete(filePath);
    processFile(filePath);
  }, DEBOUNCE_MS));
}

/**
 * Watch directory recursively
 */
function watchDir(dir) {
  const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (!filename.endsWith('.mdx') && !filename.endsWith('.md')) return;

    const filePath = path.join(dir, filename);

    // Only process if file exists (not deleted)
    if (fs.existsSync(filePath)) {
      console.log(`\x1b[33m[change]\x1b[0m ${filename}`);
      handleFileChange(filePath);
    }
  });

  return watcher;
}

// Main
console.log('\x1b[35m');
console.log('  Mermaid Watcher');
console.log('  ===============\x1b[0m');
console.log(`  Watching: ${CONTENT_DIR}`);
console.log('  Press Ctrl+C to stop\n');

// Ensure cache dir exists
fs.mkdirSync(CACHE_DIR, { recursive: true });

const watcher = watchDir(CONTENT_DIR);

process.on('SIGINT', () => {
  console.log('\n\x1b[35m  Stopped watching.\x1b[0m\n');
  watcher.close();
  process.exit(0);
});
