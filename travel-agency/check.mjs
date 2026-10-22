import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const required = [
  'id="journeys"',
  'id="how-it-works"',
  'id="faq"',
  'id="inquiry"',
  'id="quick-inquiry"',
  'data-filter="beach"',
  'data-filter="city"',
  'data-filter="culture"',
  'data-filter="family"',
  'id="thank-you"',
  "Demo with sample data",
  'name="name"',
  'name="email"',
  'name="destination"',
  'name="message"',
];

for (const item of required) assert.ok(html.includes(item), `Missing required content: ${item}`);
assert.equal((html.match(/class="destination"/g) ?? []).length, 6, "Expected six destination cards");
assert.match(html, /<details>[\s\S]*?<summary>/, "Expected details and summary FAQ items");
assert.match(html, /prefers-reduced-motion/, "Expected reduced motion support");
console.log("PASS travel agency demo markup self-check");
