import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
assert.match(html, /id="bestsellers"/);
assert.match(html, /id="ritual"/);
assert.match(html, /id="story"/);
assert.match(html, /class="cart-drawer"/);
assert.match(html, /id="newsletter-form"/);
assert.equal((html.match(/\{id:'(?:cleanser|serum|balm|oil|cream|spf)'/g) ?? []).length, 6);
assert.match(html, /Demo with sample data/);
console.log('PASS: storefront sections, six products, cart drawer, and newsletter form are present.');
