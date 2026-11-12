#!/usr/bin/env node

/**
 * Watch content/ and re-run the diagram pre-render when an MDX file changes.
 * The pre-render only renders new or changed diagrams, so this is quick.
 * Run it alongside `pnpm dev:fast`.
 *
 * Usage: pnpm dev:watch
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '..', 'content');
const PRE_RENDER = path.join(__dirname, 'pre-render-mermaid.mjs');
const DEBOUNCE_MS = 500;

let timer = null;
let running = false;
let again = false;

function render() {
  if (running) {
    again = true;
    return;
  }
  running = true;
  const proc = spawn(process.execPath, [PRE_RENDER], { stdio: 'inherit' });
  proc.on('close', () => {
    running = false;
    if (again) {
      again = false;
      render();
    }
  });
}

const watcher = fs.watch(CONTENT_DIR, { recursive: true }, (_event, filename) => {
  if (!filename || !/\.mdx?$/.test(filename)) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`\nChanged: ${filename}`);
    render();
  }, DEBOUNCE_MS);
});

console.log('Watching content/ for diagram changes. Ctrl+C to stop.');
render();

process.on('SIGINT', () => {
  watcher.close();
  process.exit(0);
});
