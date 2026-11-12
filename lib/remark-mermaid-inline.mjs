/**
 * Remark plugin that inlines pre-rendered Mermaid SVGs at build time
 * with SEO metadata (schema.org ImageObject).
 *
 * Reads one theme-aware SVG per diagram from public/mermaid-cache/ (written by
 * scripts/pre-render-mermaid.mjs) and embeds it, with its natural size, so it
 * renders instantly with no client JavaScript. Diagrams missing from the cache
 * fall back to the client <Mermaid> component.
 */

import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'public', 'mermaid-cache');
const MANIFEST_PATH = path.join(CACHE_DIR, 'manifest.json');
const SEO_MANIFEST_PATH = path.join(CACHE_DIR, 'seo-manifest.json');

// Site URL for absolute image paths
const SITE_URL = process.env.SITE_URL || 'https://docs.masst.dev';

// Load manifests once
let manifest = null;
let seoManifest = null;

function getManifest() {
  if (manifest) return manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    manifest = {};
  }
  return manifest;
}

function getSeoManifest() {
  if (seoManifest) return seoManifest;
  try {
    seoManifest = JSON.parse(fs.readFileSync(SEO_MANIFEST_PATH, 'utf-8'));
  } catch {
    seoManifest = {};
  }
  return seoManifest;
}

/**
 * Hash function - must match the pre-render script
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
 * Read SVG file and return contents
 */
function readSvg(svgPath) {
  try {
    const fullPath = path.join(process.cwd(), 'public', svgPath);
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Surface-aware keyword bundles. Each docs surface owns a distinct
 * topical area, so the schema.org keywords field reflects that instead
 * of tagging every diagram as generic "system design".
 */
const SURFACE_KEYWORDS = {
  sd:  ['system design', 'distributed systems', 'software architecture', 'scalability'],
  hld: ['high-level design', 'system design interview', 'architecture case study', 'distributed systems'],
  lld: ['low-level design', 'design patterns', 'object-oriented design', 'machine coding', 'SOLID'],
  dsa: ['data structures', 'algorithms', 'coding interview', 'algorithm visualization', 'pattern recognition'],
  ai:  ['AI engineering', 'LLM systems', 'retrieval-augmented generation', 'RAG', 'LLM agents', 'prompt engineering'],
};

function surfaceForUrl(pageUrl) {
  if (!pageUrl) return 'sd';
  if (pageUrl.startsWith('/hld')) return 'hld';
  if (pageUrl.startsWith('/lld')) return 'lld';
  if (pageUrl.startsWith('/dsa')) return 'dsa';
  if (pageUrl.startsWith('/ai'))  return 'ai';
  return 'sd';
}

function surfaceLabel(surface) {
  return {
    sd:  'System Design',
    hld: 'HLD Case Study',
    lld: 'Low-Level Design',
    dsa: 'DSA Pattern',
    ai:  'AI Engineering',
  }[surface] || 'System Design';
}

/**
 * Generate schema.org ImageObject JSON-LD
 * This tells Google: "show this image, but link to this page when clicked"
 */
function generateStructuredData(seoData, hash) {
  const imageUrl = seoData.cloudinaryUrl || `${SITE_URL}/mermaid-cache/${hash}-light.png`;
  // The page URL where the image lives - this is where Google sends users
  const pageUrl = seoData.pageUrl ? `${SITE_URL}${seoData.pageUrl}` : SITE_URL;
  const surface = surfaceForUrl(seoData.pageUrl);

  // Build a keyword string that's surface-correct, not the everywhere-is-SD bug.
  const kw = [
    ...SURFACE_KEYWORDS[surface],
    seoData.pageTitle,                // "Agents"
    seoData.sectionHeading,           // "Agents vs chains vs workflows"
    'MASST Docs',
  ].filter(Boolean).join(', ');

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: imageUrl,
    url: pageUrl, // Landing page URL - where users go when clicking the image
    name: seoData.title || 'Diagram',
    description: seoData.alt || 'Architecture diagram from MASST Docs',
    keywords: kw,
    about: surfaceLabel(surface),
    creator: {
      '@type': 'Organization',
      name: 'MASST Docs',
      url: SITE_URL,
    },
    copyrightHolder: {
      '@type': 'Organization',
      name: 'MASST Docs',
    },
    // mainEntityOfPage tells Google this image is primarily about this page
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    license: `${SITE_URL}/license`,
    acquireLicensePage: SITE_URL,
    ...(seoData.width && { width: seoData.width }),
    ...(seoData.height && { height: seoData.height }),
  };
}

/**
 * Create an MDX JSX element for a pre-rendered diagram.
 *
 * One theme-aware SVG (colours are CSS variables, see lib/diagram-theme.mjs)
 * inside a figure that carries the diagram's natural size. CSS in
 * app/global.css (.dg) sizes it: never larger than natural, shrunk to fit the
 * column and a max height, but never below a minimum scale (it scrolls
 * instead), so text stays a readable, consistent size. The enlarge button is
 * handled by components/mdx/DiagramZoom.tsx.
 */
function createMermaidJsxElement(svg, entry, hash, seoData) {
  const alt = escapeHtml(seoData?.alt || 'Architecture diagram');
  const title = escapeHtml(seoData?.title || 'Diagram');

  // Image URL for SEO (prefer Cloudinary, fall back to the local PNG)
  const imageUrl = seoData?.cloudinaryUrl || `/mermaid-cache/${hash}-light.png`;
  const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;

  const structuredData = seoData ? generateStructuredData(seoData, hash) : null;
  const structuredDataScript = structuredData
    ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
    : '';

  const html = `
    <figure class="dg not-prose" style="--dg-w:${entry.width}px;--dg-h:${entry.height}" itemscope itemtype="https://schema.org/ImageObject">
      <meta itemprop="name" content="${title}" />
      <meta itemprop="description" content="${alt}" />
      <link itemprop="contentUrl" href="${absoluteImageUrl}" />
      <div class="dg-frame"><div class="dg-canvas" role="img" aria-label="${alt}">${svg}</div></div>
      <button type="button" class="dg-zoom" aria-label="Enlarge diagram" title="Enlarge"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></button>
      <noscript>
        <img src="${absoluteImageUrl}" alt="${alt}" title="${title}" loading="lazy" />
      </noscript>
      ${structuredDataScript}
    </figure>
  `.trim().replace(/\n\s*/g, '');

  return {
    type: 'mdxJsxFlowElement',
    name: 'div',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'dangerouslySetInnerHTML',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: `{ __html: ${JSON.stringify(html)} }`,
          data: {
            estree: {
              type: 'Program',
              body: [
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'ObjectExpression',
                    properties: [
                      {
                        type: 'Property',
                        method: false,
                        shorthand: false,
                        computed: false,
                        key: { type: 'Identifier', name: '__html' },
                        value: { type: 'Literal', value: html },
                        kind: 'init',
                      },
                    ],
                  },
                },
              ],
              sourceType: 'module',
            },
          },
        },
      },
    ],
    children: [],
  };
}

/**
 * Simple tree walker - visits all nodes of a given type
 */
function visit(tree, type, visitor) {
  function walk(node, index, parent) {
    if (node.type === type) {
      visitor(node, index, parent);
    }
    if (node.children) {
      // Walk in reverse to allow safe modifications during iteration
      for (let i = node.children.length - 1; i >= 0; i--) {
        walk(node.children[i], i, node);
      }
    }
  }
  walk(tree, null, null);
}

/**
 * Remark plugin to inline mermaid SVGs with SEO metadata
 */
export function remarkMermaidInline() {
  return function transformer(tree) {
    const manifestData = getManifest();
    const seoManifestData = getSeoManifest();

    // Transform ```mermaid code blocks
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'mermaid' && parent && index !== null) {
        const code = node.value;
        const hash = hashDiagram(code);
        const cached = manifestData[hash];
        const seoData = seoManifestData[hash];

        const svg = cached?.svg ? readSvg(cached.svg) : null;
        if (svg) {
          parent.children[index] = createMermaidJsxElement(svg, cached, hash, seoData);
          return;
        }

        // Fallback: convert to Mermaid component (client-side rendering)
        parent.children[index] = {
          type: 'mdxJsxFlowElement',
          name: 'Mermaid',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'chart',
              value: code,
            },
          ],
          children: [],
        };
      }
    });

    // Transform <Mermaid chart="..."> JSX components
    visit(tree, 'mdxJsxFlowElement', (node, index, parent) => {
      if (node.name === 'Mermaid' && parent && index !== null) {
        const chartAttr = node.attributes?.find(
          (attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'chart'
        );

        if (chartAttr) {
          let code;
          if (typeof chartAttr.value === 'string') {
            code = chartAttr.value;
          } else if (chartAttr.value?.value) {
            code = chartAttr.value.value;
          } else if (chartAttr.value?.data?.estree) {
            const expr = chartAttr.value.data.estree.body?.[0]?.expression;
            if (expr?.type === 'TemplateLiteral') {
              code = expr.quasis.map(q => q.value.raw).join('');
            }
          }

          if (code) {
            code = code.replace(/\\n/g, '\n');
            const hash = hashDiagram(code);
            const cached = manifestData[hash];
            const seoData = seoManifestData[hash];

            const svg = cached?.svg ? readSvg(cached.svg) : null;
            if (svg) {
              parent.children[index] = createMermaidJsxElement(svg, cached, hash, seoData);
            }
          }
        }
      }
    });
  };
}

export default remarkMermaidInline;
