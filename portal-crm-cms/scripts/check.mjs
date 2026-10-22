import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const posts = JSON.parse(await readFile(new URL("../data/posts.json", import.meta.url), "utf8"));
assert.equal(posts.length, 4, "expected four seeded posts");
assert.equal(posts.filter((post) => post.status === "published").length, 3, "expected three published posts");
assert.equal(new Set(posts.map((post) => post.id)).size, posts.length, "post ids must be unique");
assert.equal(new Set(posts.map((post) => post.slug)).size, posts.length, "post slugs must be unique");
for (const post of posts) {
  assert.ok(post.title.length >= 3 && post.title.length <= 100, `invalid title: ${post.id}`);
  assert.match(post.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `invalid slug: ${post.id}`);
  assert.ok(["draft", "published"].includes(post.status), `invalid status: ${post.id}`);
  assert.equal(typeof post.body, "string", `body must be text: ${post.id}`);
}
console.log("Self-check passed: 4 seeded posts, unique IDs and slugs, safe slugs, and valid statuses.");
