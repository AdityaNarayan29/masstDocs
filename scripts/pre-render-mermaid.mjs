#!/usr/bin/env node

/**
 * Pre-render Mermaid diagrams at build time.
 *
 * This script:
 * 1. Scans all MDX files for mermaid code blocks and <Mermaid> components
 * 2. Extracts the diagram code
 * 3. Renders SVGs for both light and dark themes using mermaid-cli
 * 4. Saves them to a cache file that the Mermaid component uses
 *
 * Run this before `next build` for instant diagram loading.
 */

import fs from 'fs/promises';
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
const MERMAID_JSX_MULTILINE_REGEX = /<Mermaid\s+chart=(?:{`|"|')([\s\S]*?)(?:`}|"|')\s*>/g;

/**
 * Generate a hash for a diagram to use as cache key
 * Must match the client-side hashDiagram function in mermaid.tsx
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
 * Extract all mermaid diagrams from an MDX file
 */
async function extractDiagrams(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const diagrams = [];

  // Extract from ```mermaid code blocks
  let match;
  while ((match = MERMAID_CODE_BLOCK_REGEX.exec(content)) !== null) {
    diagrams.push({
      code: match[1].trim(),
      source: filePath,
    });
  }

  // Reset regex
  MERMAID_CODE_BLOCK_REGEX.lastIndex = 0;

  // Extract from <Mermaid chart="..." /> components
  while ((match = MERMAID_JSX_REGEX.exec(content)) !== null) {
    let code = match[1];
    // Handle escaped newlines
    code = code.replace(/\\n/g, '\n').trim();
    diagrams.push({
      code,
      source: filePath,
    });
  }

  MERMAID_JSX_REGEX.lastIndex = 0;

  return diagrams;
}

// Counter for unique temp file names
let tempFileCounter = 0;

/**
 * Render a single mermaid diagram using mmdc CLI
 */
async function renderDiagram(code, theme, outputPath) {
  const tempInput = path.join(CACHE_DIR, `temp-${Date.now()}-${tempFileCounter++}-${theme}.mmd`);

  try {
    // Write diagram code to temp file
    await fs.writeFile(tempInput, code);

    // Render using mmdc (mermaid CLI)
    const mmdcPath = path.join(ROOT_DIR, 'node_modules', '.bin', 'mmdc');

    const args = [
      '-i', tempInput,
      '-o', outputPath,
      '-t', theme,
      '-b', 'transparent',
      '--quiet',
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn(mmdcPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stderr = '';
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          console.error(`mmdc error: ${stderr}`);
          resolve(false);
        }
      });

      proc.on('error', (err) => {
        console.error(`Failed to run mmdc: ${err.message}`);
        resolve(false);
      });
    });
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(tempInput);
    } catch {}
  }
}

/**
 * Clean SVG for embedding (remove XML declaration, add classes)
 */
async function processSvg(svgPath, className) {
  try {
    let svg = await fs.readFile(svgPath, 'utf-8');

    // Remove XML declaration
    svg = svg.replace(/<\?xml[^?]*\?>/g, '');

    // Add class to SVG element
    svg = svg.replace(/<svg/, `<svg class="${className}"`);

    // Remove fixed width/height, let CSS handle it
    svg = svg.replace(/width="[^"]*"/, '');
    svg = svg.replace(/height="[^"]*"/, '');

    return svg.trim();
  } catch {
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 Pre-rendering Mermaid diagrams...\n');

  // Ensure cache directory exists
  await fs.mkdir(CACHE_DIR, { recursive: true });

  // Check if mmdc is available
  const mmdcPath = path.join(ROOT_DIR, 'node_modules', '.bin', 'mmdc');
  try {
    await fs.access(mmdcPath);
  } catch {
    console.error('❌ @mermaid-js/mermaid-cli not found!');
    console.error('   Run: npm install -D @mermaid-js/mermaid-cli');
    process.exit(1);
  }

  // Find all MDX files
  const mdxFiles = await findMdxFiles(CONTENT_DIR);
  console.log(`📁 Found ${mdxFiles.length} MDX files\n`);

  // Extract all diagrams
  const allDiagrams = [];
  for (const file of mdxFiles) {
    const diagrams = await extractDiagrams(file);
    allDiagrams.push(...diagrams);
  }

  // Deduplicate diagrams by hash
  const uniqueDiagrams = new Map();
  for (const diagram of allDiagrams) {
    const hash = hashDiagram(diagram.code);
    if (!uniqueDiagrams.has(hash)) {
      uniqueDiagrams.set(hash, diagram);
    }
  }

  console.log(`📊 Found ${allDiagrams.length} diagrams (${uniqueDiagrams.size} unique)\n`);

  // Load existing manifest if exists
  let manifest = {};
  try {
    const existingManifest = await fs.readFile(CACHE_MANIFEST, 'utf-8');
    manifest = JSON.parse(existingManifest);
  } catch {}

  // Render each unique diagram
  let rendered = 0;
  let cached = 0;
  let failed = 0;

  for (const [hash, diagram] of uniqueDiagrams) {
    // Check if already cached
    if (manifest[hash]) {
      const lightExists = await fs.access(path.join(CACHE_DIR, `${hash}-light.svg`)).then(() => true).catch(() => false);
      const darkExists = await fs.access(path.join(CACHE_DIR, `${hash}-dark.svg`)).then(() => true).catch(() => false);

      if (lightExists && darkExists) {
        cached++;
        continue;
      }
    }

    const relativePath = path.relative(ROOT_DIR, diagram.source);
    process.stdout.write(`  Rendering ${hash} (${relativePath})... `);

    const lightPath = path.join(CACHE_DIR, `${hash}-light.svg`);
    const darkPath = path.join(CACHE_DIR, `${hash}-dark.svg`);

    // Render both themes
    const [lightOk, darkOk] = await Promise.all([
      renderDiagram(diagram.code, 'default', lightPath),
      renderDiagram(diagram.code, 'dark', darkPath),
    ]);

    if (lightOk && darkOk) {
      // Process SVGs
      const lightSvg = await processSvg(lightPath, 'mermaid-svg');
      const darkSvg = await processSvg(darkPath, 'mermaid-svg');

      if (lightSvg && darkSvg) {
        await fs.writeFile(lightPath, lightSvg);
        await fs.writeFile(darkPath, darkSvg);

        manifest[hash] = {
          light: `/mermaid-cache/${hash}-light.svg`,
          dark: `/mermaid-cache/${hash}-dark.svg`,
        };

        console.log('✅');
        rendered++;
      } else {
        console.log('❌ (processing failed)');
        failed++;
      }
    } else {
      console.log('❌ (render failed)');
      failed++;
    }
  }

  // Save manifest
  await fs.writeFile(CACHE_MANIFEST, JSON.stringify(manifest, null, 2));

  console.log('\n📊 Summary:');
  console.log(`   ✅ Rendered: ${rendered}`);
  console.log(`   📦 Cached: ${cached}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n✨ Manifest saved to ${CACHE_MANIFEST}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
