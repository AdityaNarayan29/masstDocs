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
 * Extract diagram description from its content
 */
function extractDiagramDescription(code) {
  // Extract meaningful text from the diagram
  const labels = [];

  // Match node labels like [Label], (Label), {Label}
  const labelMatches = code.matchAll(/[\[\(\{]([^\]\)\}]+)[\]\)\}]/g);
  for (const match of labelMatches) {
    const label = match[1].trim();
    // Skip technical syntax
    if (label && !label.includes('<br>') && label.length > 2 && label.length < 50) {
      labels.push(label);
    }
  }

  // Match subgraph titles
  const subgraphMatches = code.matchAll(/subgraph\s+"([^"]+)"/g);
  for (const match of subgraphMatches) {
    labels.unshift(match[1].trim()); // Add to beginning as they're more descriptive
  }

  // Get unique labels
  const uniqueLabels = [...new Set(labels)].slice(0, 5);
  return uniqueLabels.join(', ');
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

  // Get page URL from file path
  // content/docs/case-studies/uber.mdx -> /sd/case-studies/uber (SD docs)
  // content/docs/xyz/abc.mdx -> /sd/xyz/abc
  const relativePath = path.relative(CONTENT_DIR, filePath);
  const pathWithoutDocs = relativePath
    .replace(/^docs\//, '')
    .replace(/\.mdx?$/, '')
    .replace(/\/index$/, '');

  // All docs are under /sd/ prefix based on lib/source.ts baseUrl
  const pageUrl = '/sd/' + pathWithoutDocs;

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
 * Generate SEO-friendly alt text optimized for Google Image search
 * Target keywords: "system design", "architecture diagram", company names
 */
function generateAltText(diagram) {
  const parts = [];

  // Add page title first (most important for SEO - e.g., "Uber", "Netflix")
  if (diagram.pageTitle) {
    parts.push(diagram.pageTitle);
  }

  // Add section context
  if (diagram.sectionHeading) {
    parts.push(diagram.sectionHeading);
  }

  // Add diagram type with SEO keywords
  const typeNames = {
    flowchart: 'system architecture diagram',
    sequence: 'sequence diagram',
    class: 'class diagram',
    state: 'state machine diagram',
    er: 'database schema diagram',
    gantt: 'project timeline',
    pie: 'distribution chart',
    journey: 'user flow diagram',
    architecture: 'system design diagram',
  };

  parts.push(typeNames[diagram.diagramType] || 'architecture diagram');

  // Add key components if available
  if (diagram.diagramDescription) {
    parts.push(`- ${diagram.diagramDescription}`);
  }

  // Add brand suffix for SEO
  parts.push('| MASST Docs System Design');

  return parts.join(' ');
}

/**
 * Generate SEO title for image (appears in Google Image results)
 */
function generateTitle(diagram) {
  const parts = [];

  // Page title (company/system name) first
  if (diagram.pageTitle) {
    parts.push(diagram.pageTitle);
  }

  // Section heading
  if (diagram.sectionHeading) {
    parts.push(diagram.sectionHeading);
  }

  // SEO keywords
  parts.push('System Design');
  parts.push('MASST Docs');

  return parts.join(' - ');
}

// Counter for unique temp file names
let tempFileCounter = 0;

/**
 * Render a diagram to SVG and PNG
 */
async function renderDiagram(code, hash, theme) {
  const tempInput = path.join(CACHE_DIR, `temp-${Date.now()}-${tempFileCounter++}-${theme}.mmd`);
  const svgOutput = path.join(CACHE_DIR, `${hash}-${theme}.svg`);
  const pngOutput = path.join(CACHE_DIR, `${hash}-${theme}.png`);

  await fs.writeFile(tempInput, code);

  const mmdcPath = path.join(ROOT_DIR, 'node_modules', '.bin', 'mmdc');

  // Render SVG
  const svgArgs = ['-i', tempInput, '-o', svgOutput, '-t', theme, '-b', 'transparent', '--quiet'];

  // Render PNG with higher quality for SEO
  const pngArgs = ['-i', tempInput, '-o', pngOutput, '-t', theme, '-b', 'white', '-s', '2', '--quiet'];

  try {
    // Render SVG
    await runCommand(mmdcPath, svgArgs);

    // Render PNG
    await runCommand(mmdcPath, pngArgs);

    // Process SVG
    await processSvg(svgOutput);

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
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(imagePath, publicId, metadata) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'masst-docs/diagrams';
  const fullPublicId = `${folder}/${publicId}`;

  // Create signature
  const paramsToSign = {
    context: `alt=${encodeURIComponent(metadata.alt)}|caption=${encodeURIComponent(metadata.title)}`,
    folder,
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
  formData.append('folder', folder);
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

    // If fully cached (SVGs exist + Cloudinary uploaded), skip
    if (hasSvg && hasSeo && hasCloudinary) {
      try {
        await fs.access(path.join(CACHE_DIR, `${hash}-light.svg`));
        await fs.access(path.join(CACHE_DIR, `${hash}-dark.svg`));
        cached++;
        continue;
      } catch {}
    }

    // If SVGs exist but no Cloudinary URL, just upload (don't re-render)
    if (hasSvg && hasSeo && !hasCloudinary && !skipUpload && CLOUDINARY_CLOUD_NAME) {
      const pngPath = path.join(CACHE_DIR, `${hash}-light.png`);
      try {
        await fs.access(pngPath);
        process.stdout.write(`  Uploading ${hash} to Cloudinary... `);

        const cloudinaryResult = await uploadToCloudinary(pngPath, hash, {
          alt: hasSeo.alt,
          title: hasSeo.title,
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

    // Render both themes
    const [lightResult, darkResult] = await Promise.all([
      renderDiagram(diagram.code, hash, 'default'),
      renderDiagram(diagram.code, hash, 'dark'),
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
        const cloudinaryResult = await uploadToCloudinary(
          lightResult.pngOutput,
          hash,
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
