import Link from "next/link";
import { notFound } from "next/navigation";
import { readPosts } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = (await readPosts()).find((item) => item.slug === slug && item.status === "published");
  if (!post) notFound();
  const blocks = post.body.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return <article className="public-post"><Link href="/blog" className="back-link">← All journal notes</Link><span className="app-meta">BRIGHTFIELD NOTES / 2026</span><h1>{post.title}</h1><div className="post-rule" />{blocks.map((block, index) => block.startsWith("## ") ? <h2 key={index}>{block.slice(3)}</h2> : <p key={index}>{block}</p>)}</article>;
}
