#!/usr/bin/env node
// Build docs/guide.pdf from docs/guide.md. Maintainer tool, not needed to use the template.
// Needs: pandoc, pdftotext (poppler), and the Playwright library with Chromium
//   (e.g. `npx playwright install chromium`, then PLAYWRIGHT=/path/to/node_modules/playwright).
// Run: node docs/build-pdf.mjs
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const src = join(here, 'guide.md')
const out = join(here, 'guide.pdf')
const work = mkdtempSync(join(tmpdir(), 'guide-pdf-'))
const html = join(work, 'guide.html')

const css = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400&display=swap');
@page { size: A4; margin: 18mm 17mm 20mm 17mm; }
html { font-family: 'Be Vietnam Pro', Arial, sans-serif; font-size: 10.2pt; line-height: 1.55; color: #1d2733; }
body { margin: 0; max-width: none; padding: 0; }
p { margin: 0 0 0.6em; text-align: left; }
h1 { font-size: 17pt; color: #0f4c5c; margin: 0 0 0.5em; padding-bottom: 4px; border-bottom: 2px solid #0f4c5c; margin-top: 1.2em; break-after: avoid; }
h2 { font-size: 12.5pt; color: #0f4c5c; margin: 1.1em 0 0.4em; break-after: avoid; }
h1 + p, h2 + p { break-before: avoid; }
code { font-family: 'JetBrains Mono', Menlo, Consolas, monospace; font-size: 8.6pt; background: #eef2f5; padding: 0 3px; border-radius: 3px; }
pre { background: #eef2f5; padding: 8px 10px; border-radius: 6px; break-inside: avoid; white-space: pre-wrap; }
pre code { background: none; padding: 0; }
blockquote { margin: 0.6em 0; padding: 6px 12px; border-left: 3px solid #f2a541; background: #fdf6ec; break-inside: avoid; }
blockquote p, blockquote li { margin: 0.2em 0; }
table { border-collapse: collapse; width: 100%; margin: 0.6em 0 0.9em; font-size: 8.8pt; break-inside: auto; }
th, td { border: 1px solid #c9d3dc; padding: 4px 6px; vertical-align: top; text-align: left; }
th { background: #0f4c5c; color: #fff; font-weight: 600; }
tr { break-inside: avoid; }
table:has(th:nth-child(4)) { table-layout: fixed; }
table:has(th:nth-child(4)) th:nth-child(1) { width: 14%; }
table:has(th:nth-child(4)) th:nth-child(2) { width: 42%; }
table:has(th:nth-child(4)) th:nth-child(3) { width: 24%; }
table:has(th:nth-child(4)) td:nth-child(4) { word-break: break-all; font-size: 8pt; color: #3d5361; }
ul, ol { margin: 0.2em 0 0.7em; padding-left: 1.3em; }
li { margin: 0.15em 0; }
a { color: #0b6e85; text-decoration: none; word-break: break-all; }
#title-block-header { height: 250mm; display: flex; flex-direction: column; justify-content: center; break-after: page; }
#title-block-header .title { font-size: 30pt; line-height: 1.2; color: #0f4c5c; border: none; margin: 0 0 12px; break-before: avoid; }
#title-block-header .subtitle { font-size: 15pt; color: #3d5361; margin: 0 0 40px; }
#title-block-header .date { font-size: 10.5pt; color: #6b7c88; }
#title-block-header::after { content: 'Bộ khung ai-app-starter · Codex · Claude Code · React · Supabase · Cloudflare'; font-size: 10pt; color: #6b7c88; margin-top: 8px; }
nav#TOC { break-after: page; }
nav#TOC::before { content: 'Mục lục'; display: block; font-size: 17pt; font-weight: 700; color: #0f4c5c; border-bottom: 2px solid #0f4c5c; padding-bottom: 4px; margin-bottom: 12px; }
nav#TOC ul { list-style: none; padding-left: 0; margin: 0; }
nav#TOC ul ul { padding-left: 1.4em; margin: 0.1em 0 0.4em; }
nav#TOC li { margin: 0.25em 0; }
nav#TOC > ul > li > a { font-weight: 600; }
nav#TOC a { color: #1d2733; word-break: normal; display: flex; }
nav#TOC a::after { content: attr(data-page); margin-left: auto; padding-left: 12px; color: #6b7c88; }
`
writeFileSync(join(work, 'style.css'), css)

execFileSync('pandoc', [src, '-s', '--toc', '--toc-depth=2', '-c', 'style.css', '--metadata', 'pagetitle=Tự dựng web app cùng Codex', '-o', html])

const pw = await import(process.env.PLAYWRIGHT ? pathToFileURL(join(process.env.PLAYWRIGHT, 'index.mjs')).href : 'playwright')
const browser = await (pw.chromium || pw.default.chromium).launch({ args: ['--mute-audio'] })
const page = await browser.newPage()
await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
const footer = '<div style="width:100%;font-size:8px;color:#6b7c88;padding:0 17mm;display:flex;justify-content:space-between;font-family:Arial"><span>Tự dựng web app cùng Codex</span><span class="pageNumber"></span></div>'
const render = () => page.pdf({ path: out, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer, margin: { top: '18mm', bottom: '20mm', left: '17mm', right: '17mm' } })

// Pass 1 to find which page each heading lands on; pass 2 writes those numbers into the TOC.
await render()
const pages = execFileSync('pdftotext', ['-layout', out, '-'], { encoding: 'utf8' }).split('\f')
const headings = await page.evaluate(() => [...document.querySelectorAll('nav#TOC a')].map(a => a.textContent.trim()))
const norm = s => s.replace(/\s+/g, ' ').trim()
const tocEnd = pages.findIndex((p, i) => i > 0 && !p.includes('Mục lục')) // first page after the TOC
const numbers = headings.map(h => {
  const i = pages.findIndex((p, k) => k >= tocEnd && p.split('\n').some(l => norm(l) === norm(h)))
  return i < 0 ? '' : String(i + 1)
})
await page.evaluate(nums => document.querySelectorAll('nav#TOC a').forEach((a, i) => a.setAttribute('data-page', nums[i])), numbers)
await render()
await browser.close()
console.log(`Wrote ${out} (${pages.length - 1} pages). TOC pages: ${numbers.join(' ')}`)
