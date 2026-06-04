// Screenshot helper.
// Usage: node screenshot.mjs <url> [label]
// Saves full-page PNG into ./print_website/ (auto-incremented).
import puppeteer from 'puppeteer';
import { readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const outDir = join(process.cwd(), 'print_website');

await mkdir(outDir, { recursive: true });
const existing = (await readdir(outDir)).filter((f) => /^screenshot-\d+/.test(f));
const next = existing.length
  ? Math.max(...existing.map((f) => parseInt(f.match(/^screenshot-(\d+)/)[1], 10))) + 1
  : 1;
const outPath = join(outDir, `screenshot-${next}${label}.png`);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

// Scroll through the page so IntersectionObserver reveal animations fire.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y <= document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  // Force any remaining reveal elements visible for a complete capture.
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 900)); // let reveals/animations settle
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(`Saved ${outPath}`);
