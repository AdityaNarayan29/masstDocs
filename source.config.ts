import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config';
import { z } from 'zod';
import { remarkMermaidInline } from './lib/remark-mermaid-inline.mjs';

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.vercel.app/docs/mdx/collections#define-docs
export const docs = defineDocs({
  docs: {
    // Reel notes (content/docs/reels) add the optional fields below;
    // the reels page renders its "Go deeper" card from them.
    schema: frontmatterSchema.extend({
      reel: z.number().int().positive().optional(),
      // YAML turns an unquoted 2026-11-09 into a Date; keep it as YYYY-MM-DD.
      date: z
        .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()])
        .transform((d) => (typeof d === 'string' ? d : d.toISOString().slice(0, 10)))
        .optional(),
      instagram: z.url().optional(),
      related: z.array(z.string().startsWith('/')).optional(),
    }),
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
