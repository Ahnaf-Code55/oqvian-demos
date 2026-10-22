import Link from "next/link";
import { readPosts } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BlogIndex() {
  const posts = (await readPosts()).filter((post) => post.status === "published");
  return <><div className="eyebrow"><span>BRIGHTFIELD / JOURNAL</span><span>SMALL STUDIO NOTES</span></div><section className="blog-hero"><span className="app-meta">FIELD NOTES / 2026</span><h1>Thoughts on<br /><em>doing good work.</em></h1><p>Short notes on clear ideas, careful design, and the details that make projects feel easier.</p></section><div className="section-head"><h2>Latest writing</h2><span>{String(posts.length).padStart(2, "0")} STORIES</span></div><div className="blog-list">{posts.map((post, index) => <Link className="blog-row" href={`/blog/${post.slug}`} key={post.id}><span className="blog-number">0{index + 1}</span><div><span className="app-meta">BRIGHTFIELD NOTES / 5 MIN READ</span><h2>{post.title}</h2><p>{post.body.split(/\n\s*\n/)[0]}</p></div><span className="app-arrow">↗</span></Link>)}</div></>;
}
