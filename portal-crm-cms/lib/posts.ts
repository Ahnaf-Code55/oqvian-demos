import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type Post = { id: string; title: string; slug: string; status: "draft" | "published"; body: string };
const filePath = path.join(process.cwd(), "data", "posts.json");

export async function readPosts(): Promise<Post[]> {
  return JSON.parse(await readFile(filePath, "utf8")) as Post[];
}

export async function writePosts(posts: Post[]) {
  await writeFile(filePath, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
}

export function validatePost(value: unknown, existing: Post[], exceptId?: string): Omit<Post, "id"> | string {
  if (!value || typeof value !== "object") return "Post data is required.";
  const input = value as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const slug = typeof input.slug === "string" ? input.slug.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const status = input.status;
  if (title.length < 3 || title.length > 100) return "Title must be 3 to 100 characters.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return "Use a URL safe slug with lowercase letters, numbers, and hyphens.";
  if (existing.some((post) => post.slug === slug && post.id !== exceptId)) return "That slug is already in use.";
  if (status !== "draft" && status !== "published") return "Choose draft or published status.";
  if (body.length > 12000) return "Body must be 12,000 characters or fewer.";
  return { title, slug, status, body };
}
