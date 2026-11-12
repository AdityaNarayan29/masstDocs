#!/usr/bin/env node

/**
 * Create the notes page for a new @masstdev reel.
 *
 *   pnpm new-reel 42 kafka-ordering --title "Why Kafka keeps order" \
 *     --kind how --hook "Two orders, one partition. Which ships first?" \
 *     --concept "Partition ordering" --related /sd/building-blocks/message-queues,/sd/building-blocks/pub-sub
 *
 * It:
 * 1. writes content/docs/reels/<number>-<slug>.mdx from content/TEMPLATE-reel.mdx
 * 2. adds the page to reels/meta.json under "How it works" or "Case studies"
 * 3. adds a row to the matching table on the reels index page
 *
 * --kind     how (default) | case
 * --hook     the question (how) or what happened (case) for the index table
 * --concept  the concept (how) or the lesson (case) for the index table
 * --related  comma-separated course URLs for the "Go deeper" card
 * --date     YYYY-MM-DD, defaults to today
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REELS = path.join(ROOT, 'content/docs/reels');
const TEMPLATE = path.join(ROOT, 'content/TEMPLATE-reel.mdx');

const KINDS = {
  how: { separator: '---How it works---', heading: '## How it works' },
  case: { separator: '---Case studies---', heading: '## Case studies' },
};

function fail(message) {
  console.error(`new-reel: ${message}`);
  process.exit(1);
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    title: { type: 'string' },
    description: { type: 'string' },
    kind: { type: 'string', default: 'how' },
    hook: { type: 'string' },
    concept: { type: 'string' },
    related: { type: 'string' },
    date: { type: 'string', default: new Date().toISOString().slice(0, 10) },
  },
});

const [numberArg, slugArg] = positionals;
const number = Number(numberArg);
if (!Number.isInteger(number) || number <= 0) fail('first argument must be the reel number, e.g. 42');
if (!slugArg || !/^[a-z0-9-]+$/.test(slugArg)) fail('second argument must be a slug like kafka-ordering');
if (!values.title) fail('--title is required');
const kind = KINDS[values.kind];
if (!kind) fail('--kind must be "how" or "case"');
if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) fail('--date must be YYYY-MM-DD');

const name = `${number}-${slugArg}`;
const file = path.join(REELS, `${name}.mdx`);
const url = `/reels/${name}`;

const existing = await fs.readdir(REELS);
if (existing.some((f) => f.startsWith(`${number}-`))) fail(`a page for reel #${number} already exists`);

const related = (values.related ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of related) if (!r.startsWith('/')) fail(`related URL must start with "/": ${r}`);

// 1. Page from template
const quote = (s) => JSON.stringify(s);
const template = await fs.readFile(TEMPLATE, 'utf8');
const page = template
  .replaceAll('{{NUMBER}}', String(number))
  .replaceAll('{{TITLE}}', values.title.replaceAll('"', '\\"'))
  .replaceAll('{{DESCRIPTION}}', quote(values.description ?? 'TODO: one-sentence summary shown in search and link previews'))
  .replaceAll('{{DATE}}', values.date)
  .replaceAll('{{RELATED}}', related.length ? related.map((r) => `  - ${r}`).join('\n') : '  - /sd')
  .replaceAll('{{ONE_LINER}}', 'TODO')
  .replaceAll('{{CONCEPT}}', values.concept ?? 'TODO');
await fs.writeFile(file, page);

// 2. Sidebar order: newest first, directly under the kind's separator
const metaPath = path.join(REELS, 'meta.json');
const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
const at = meta.pages.indexOf(kind.separator);
if (at === -1) fail(`meta.json has no "${kind.separator}" separator`);
meta.pages.splice(at + 1, 0, name);
await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

// 3. Index table: new row at the top of the kind's table
const indexPath = path.join(REELS, 'index.mdx');
const index = await fs.readFile(indexPath, 'utf8');
const lines = index.split('\n');
const h = lines.indexOf(kind.heading);
const divider = lines.findIndex((l, i) => i > h && /^\|[-| ]+\|$/.test(l));
if (h === -1 || divider === -1) fail(`could not find the "${kind.heading}" table in reels/index.mdx`);
lines.splice(divider + 1, 0, `| [#${number} · ${values.title}](${url}) | ${values.hook ?? 'TODO'} | ${values.concept ?? 'TODO'} |`);
await fs.writeFile(indexPath, lines.join('\n'));

console.log(`Created ${path.relative(ROOT, file)}`);
console.log(`Added to reels/meta.json and the "${kind.heading.slice(3)}" table in reels/index.mdx`);
const todos = [
  !values.description && 'description',
  !values.hook && 'index --hook',
  !values.concept && 'index --concept',
  !related.length && 'related pages',
  'one-liner and body',
].filter(Boolean);
console.log(`Still to fill in: ${todos.join(', ')} (search for TODO).`);
