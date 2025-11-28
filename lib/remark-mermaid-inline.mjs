/**
 * Remark plugin that inlines pre-rendered Mermaid SVGs at build time.
 *
 * This reads SVGs from public/mermaid-cache/ and embeds them directly
 * into the HTML, resulting in ZERO network requests and instant rendering.
 */

import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'public', 'mermaid-cache');
const MANIFEST_PATH = path.join(CACHE_DIR, 'manifest.json');

// Load manifest once
let manifest = null;
function getManifest() {
  if (manifest) return manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    manifest = {};
  }
  return manifest;
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
 * Create inline HTML with both light and dark SVGs
 */
function createInlineMermaidHtml(lightSvg, darkSvg) {
  return `<div class="mermaid-container my-6 overflow-x-auto">
  <div class="mermaid-light block dark:hidden [&>svg]:max-w-full [&>svg]:h-auto">${lightSvg}</div>
  <div class="mermaid-dark hidden dark:block [&>svg]:max-w-full [&>svg]:h-auto">${darkSvg}</div>
</div>`;
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
 * Remark plugin to inline mermaid SVGs
 */
export function remarkMermaidInline() {
  return function transformer(tree) {
    const manifestData = getManifest();

    // Transform ```mermaid code blocks
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'mermaid' && parent && index !== null) {
        const code = node.value;
        const hash = hashDiagram(code);
        const cached = manifestData[hash];

        if (cached) {
          const lightSvg = readSvg(cached.light);
          const darkSvg = readSvg(cached.dark);

          if (lightSvg && darkSvg) {
            parent.children[index] = {
              type: 'html',
              value: createInlineMermaidHtml(lightSvg, darkSvg),
            };
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

            if (cached) {
              const lightSvg = readSvg(cached.light);
              const darkSvg = readSvg(cached.dark);

              if (lightSvg && darkSvg) {
                parent.children[index] = {
                  type: 'html',
                  value: createInlineMermaidHtml(lightSvg, darkSvg),
                };
              }
            }
          }
        }
      }
    });
  };
}

export default remarkMermaidInline;
