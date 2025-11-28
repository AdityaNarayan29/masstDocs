import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config';
import { remarkMermaidInline } from './lib/remark-mermaid-inline.mjs';

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.vercel.app/docs/mdx/collections#define-docs
export const docs = defineDocs({
  docs: {
    schema: frontmatterSchema,
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // Use our custom plugin that inlines pre-rendered SVGs
    // Falls back to client-side Mermaid component if SVGs not found
    remarkPlugins: [remarkMermaidInline],
  },
});
