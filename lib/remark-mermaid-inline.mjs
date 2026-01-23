/**
 * Remark plugin that inlines pre-rendered Mermaid SVGs at build time
 * with SEO metadata (schema.org ImageObject).
 *
 * This reads SVGs from public/mermaid-cache/ and embeds them directly
 * into the HTML with proper SEO attributes for Google Image indexing.
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
 * Generate schema.org ImageObject JSON-LD
 * This tells Google: "show this image, but link to this page when clicked"
 */
function generateStructuredData(seoData, hash) {
  const imageUrl = seoData.cloudinaryUrl || `${SITE_URL}/mermaid-cache/${hash}-light.png`;
  // The page URL where the image lives - this is where Google sends users
  const pageUrl = seoData.pageUrl ? `${SITE_URL}${seoData.pageUrl}` : SITE_URL;

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: imageUrl,
    url: pageUrl, // Landing page URL - where users go when clicking the image
    name: seoData.title || 'Architecture Diagram',
    description: seoData.alt || 'System architecture diagram from MASST Docs',
    // Add keywords for better discovery
    keywords: `system design, architecture diagram, ${seoData.pageTitle || ''}, software architecture, MASST Docs`.trim(),
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
 * Create an MDX JSX element for the mermaid diagram with SEO
 */
function createMermaidJsxElement(lightSvg, darkSvg, hash, seoData) {
  const alt = escapeHtml(seoData?.alt || 'Architecture diagram');
  const title = escapeHtml(seoData?.title || 'Diagram');

  // Get image URL for SEO (prefer Cloudinary, fallback to local PNG)
  const imageUrl = seoData?.cloudinaryUrl || `/mermaid-cache/${hash}-light.png`;
  const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;

  // Generate structured data JSON-LD
  const structuredData = seoData ? generateStructuredData(seoData, hash) : null;
  const structuredDataScript = structuredData
    ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
    : '';

  // Build the HTML with SEO elements
  // - figure element for semantic structure
  // - noscript img for search engines (they often don't execute JS)
  // - aria-label for accessibility
  // - itemprop attributes for schema.org microdata
  const html = `
    <figure class="mermaid-container my-6 overflow-x-auto" itemscope itemtype="https://schema.org/ImageObject">
      <meta itemprop="name" content="${title}" />
      <meta itemprop="description" content="${alt}" />
      <link itemprop="contentUrl" href="${absoluteImageUrl}" />
      <div class="mermaid-light block dark:hidden [&>svg]:max-w-full [&>svg]:h-auto" role="img" aria-label="${alt}">${lightSvg}</div>
      <div class="mermaid-dark hidden dark:block [&>svg]:max-w-full [&>svg]:h-auto" role="img" aria-label="${alt}">${darkSvg}</div>
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

        if (cached) {
          const lightSvg = readSvg(cached.light);
          const darkSvg = readSvg(cached.dark);

          if (lightSvg && darkSvg) {
            parent.children[index] = createMermaidJsxElement(lightSvg, darkSvg, hash, seoData);
            return;
          }
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

            if (cached) {
              const lightSvg = readSvg(cached.light);
              const darkSvg = readSvg(cached.dark);

              if (lightSvg && darkSvg) {
                parent.children[index] = createMermaidJsxElement(lightSvg, darkSvg, hash, seoData);
              }
            }
          }
        }
      }
    });
  };
}

export default remarkMermaidInline;
