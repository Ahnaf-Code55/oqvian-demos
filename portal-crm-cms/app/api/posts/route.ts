import { randomUUID } from "node:crypto";
import { readPosts, validatePost, writePosts } from "@/lib/posts";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(await readPosts());
}

export async function POST(request: Request) {
  let value: unknown;
  try { value = await request.json(); } catch { return Response.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const posts = await readPosts();
  const checked = validatePost(value, posts);
  if (typeof checked === "string") return Response.json({ error: checked }, { status: 400 });
  const post = { id: randomUUID(), ...checked };
  await writePosts([post, ...posts]);
  return Response.json(post, { status: 201 });
}

export async function PUT(request: Request) {
  let value: unknown;
  try { value = await request.json(); } catch { return Response.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const id = typeof input.id === "string" ? input.id : "";
  const posts = await readPosts();
  const current = posts.find((post) => post.id === id);
  if (!current) return Response.json({ error: "Post not found." }, { status: 404 });
  const checked = validatePost(input, posts, id);
  if (typeof checked === "string") return Response.json({ error: checked }, { status: 400 });
  const updated = { id, ...checked };
  await writePosts(posts.map((post) => post.id === id ? updated : post));
  return Response.json(updated);
}

export async function DELETE(request: Request) {
  let value: unknown;
  try { value = await request.json(); } catch { return Response.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const id = value && typeof value === "object" && "id" in value && typeof value.id === "string" ? value.id : "";
  const posts = await readPosts();
  if (!posts.some((post) => post.id === id)) return Response.json({ error: "Post not found." }, { status: 404 });
  await writePosts(posts.filter((post) => post.id !== id));
  return Response.json({ ok: true });
}
