# masstDocs

Source for [docs.masst.dev](https://docs.masst.dev): system design and AI engineering, explained in diagrams. Free, with a new reel every day on [@masstdev](https://www.instagram.com/masstdev/).

Sections: System Design (`/sd`), HLD case studies (`/hld`), LLD and design patterns (`/lld`), DSA patterns (`/dsa`), AI Engineering (`/ai`) and Reel Notes (`/reels`).

## Run locally

Needs Node 20+ and pnpm.

```bash
pnpm install
pnpm dev:fast          # http://localhost:3000 (add -p 3005 to change the port)
```

`pnpm dev:fast` uses the diagram cache committed in `public/mermaid-cache/`. Use `pnpm dev` or `pnpm pre-render-mermaid` only when you change a diagram; those need Puppeteer's Chrome (`pnpm approve-builds` to allow its install script).

## Environment variables

The docs run with no `.env`. Two optional features need keys:

| Feature | File | Variables |
|---|---|---|
| AI chat (hidden when not set) | `.env.local` | `GROQ_API_KEY`, `HUGGINGFACE_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX` |
| Branded diagram images for SEO | `.env` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SITE_URL` |

See `.env.local.example` and `.env.example`.

## Writing content

Add an `.mdx` file in the right folder under `content/docs/` and list it in that folder's `meta.json`. For a new reel, run `pnpm new-reel <number> <slug> --title "..."` instead. See [ARCHITECTURE.md](ARCHITECTURE.md) for how sections, diagrams, search and the chat work, and [PLAN.md](PLAN.md) for the current restructure plan.

## Deploy

Push to `main` on GitHub; Vercel deploys automatically.
