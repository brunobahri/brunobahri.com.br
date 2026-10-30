import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');

const budgets = {
  htmlGzipPerPage: 12 * 1024,
  cssGzipTotal: 4 * 1024,
  fontsTotal: 80 * 1024,
};

const requiredHeaders = [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
];

const failures = [];
const report = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)])),
  );
  return files.flat();
}

const files = await walk(dist);
const byExt = (ext) => files.filter((file) => extname(file) === ext);

const scripts = byExt('.js').concat(byExt('.mjs'));
if (scripts.length) failures.push(`javascript shipped: ${scripts.map((f) => relative(dist, f)).join(', ')}`);

for (const file of byExt('.html')) {
  const html = await readFile(file, 'utf8');
  const name = relative(dist, file);
  if (/<script\b/i.test(html)) failures.push(`${name}: <script> tag`);
  if (/<style\b/i.test(html)) failures.push(`${name}: inline <style> blocked by CSP`);
  if (/\sstyle\s*=/i.test(html)) failures.push(`${name}: style attribute blocked by CSP`);
  if (/\son[a-z]+\s*=/i.test(html)) failures.push(`${name}: inline event handler`);
  const external = [...html.matchAll(/<(?:link|img|source|iframe)\b[^>]*\s(?:href|src)="(https?:\/\/[^"]+)"/gi)]
    .map((match) => match[1])
    .filter((url) => !url.startsWith('https://brunobahri.com.br'));
  if (external.length) failures.push(`${name}: third-party resource ${external.join(', ')}`);
  const gzip = gzipSync(html).length;
  report.push(`${name}: ${html.length} B, ${gzip} B gzip`);
  if (gzip > budgets.htmlGzipPerPage) failures.push(`${name}: ${gzip} B gzip over budget`);
}

const cssGzip = (await Promise.all(byExt('.css').map(async (file) => gzipSync(await readFile(file)).length))).reduce((a, b) => a + b, 0);
report.push(`css total: ${cssGzip} B gzip`);
if (cssGzip > budgets.cssGzipTotal) failures.push(`css: ${cssGzip} B gzip over budget`);

const fonts = byExt('.woff2');
const fontBytes = (await Promise.all(fonts.map(async (file) => (await stat(file)).size))).reduce((a, b) => a + b, 0);
report.push(`fonts total: ${fontBytes} B in ${fonts.length} files`);
if (fontBytes > budgets.fontsTotal) failures.push(`fonts: ${fontBytes} B over budget`);

const headers = await readFile(join(dist, '_headers'), 'utf8');
for (const header of requiredHeaders) {
  if (!headers.includes(`${header}:`)) failures.push(`_headers: missing ${header}`);
}

const securityTxt = await readFile(join(dist, '.well-known', 'security.txt'), 'utf8');
const expires = securityTxt.match(/^Expires:\s*(.+)$/m)?.[1];
const expiresAt = expires ? Date.parse(expires) : NaN;
const now = Date.now();
if (!/^Contact:/m.test(securityTxt)) failures.push('security.txt: missing Contact');
if (Number.isNaN(expiresAt) || expiresAt <= now) failures.push('security.txt: Expires missing or in the past');
if (expiresAt - now > 366 * 24 * 60 * 60 * 1000) failures.push('security.txt: Expires more than a year ahead');

console.log(report.join('\n'));

if (failures.length) {
  console.error(`\nFAIL\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('\nPASS');
