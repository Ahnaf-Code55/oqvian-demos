import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
assert.match(html, /https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.js/);
assert.equal((html.match(/class="swatch(?:\s|")/g) || []).length, 4);
assert.match(js, /prefers-reduced-motion/);
assert.match(js, /if\s*\(!reducedMotion\)\s*lamp\.rotation\.y/);
console.log('PASS');
