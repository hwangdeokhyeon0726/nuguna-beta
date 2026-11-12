import { readFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { Script } from 'node:vm';

const sourceDir = 'nuguna_beta';
const outputDir = 'dist';
const html = await readFile(join(sourceDir, 'index.html'), 'utf8');
if (!html.includes('<!DOCTYPE html>') || !html.includes('id="featuredProducts"')) {
  throw new Error('NUGUNA 정적 사이트 진입 파일을 확인할 수 없습니다.');
}
if (/\bfetch\s*\(/.test(html) || /<script\b[^>]*\bsrc\s*=\s*["']https?:/i.test(html)) {
  throw new Error('정적 베타에는 외부 스크립트 또는 네트워크 요청을 추가할 수 없습니다.');
}
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
if (!scripts.length) throw new Error('앱 스크립트를 찾을 수 없습니다.');
for (const [index, match] of scripts.entries()) {
  new Script(match[1], { filename: `index.html script ${index + 1}` });
}
const files = await readdir(sourceDir, { withFileTypes: true });
const allowed = new Set(['.html', '.css', '.js', '.webp', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2']);
await mkdir(outputDir, { recursive: true });
let count = 0;
for (const file of files) {
  if (!file.isFile() || !allowed.has(extname(file.name).toLowerCase())) continue;
  await copyFile(join(sourceDir, file.name), join(outputDir, file.name));
  count++;
}
for (const asset of ['index.html', 'serum.webp', 'care.webp', 'object.webp', 'phone.webp', 'sample_mugs.png']) {
  await readFile(join(outputDir, asset));
}
console.log(`정적 빌드 성공: ${count}개 파일 → ${outputDir}/`);
