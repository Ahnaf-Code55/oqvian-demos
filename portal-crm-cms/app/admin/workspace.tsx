"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/posts";

type EditorPost = Omit<Post, "id">;
const blankPost: EditorPost = { title: "", slug: "", status: "draft", body: "" };

export default function AdminWorkspace() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState<EditorPost>(blankPost);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  async function loadPosts() { const response = await fetch("/api/posts", { cache: "no-store" }); setPosts(await response.json()); setLoading(false); }
  useEffect(() => {
    let active = true;
    fetch("/api/posts", { cache: "no-store" }).then((response) => response.json()).then((data: Post[]) => {
      if (active) { setPosts(data); setLoading(false); }
    });
    return () => { active = false; };
  }, []);
  function beginEdit(post: Post) { setEditing(post.id); setDraft({ title: post.title, slug: post.slug, status: post.status, body: post.body }); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function startNew() { setEditing(null); setDraft(blankPost); setNotice(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    const response = await fetch("/api/posts", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing ? { ...draft, id: editing } : draft) });
    const result = await response.json();
    if (!response.ok) { setNotice(result.error ?? "Could not save this post."); return; }
    await loadPosts(); startNew(); setNotice(editing ? "Changes saved." : "Post created.");
  }
  async function removePost(post: Post) {
    if (!window.confirm(`Delete “${post.title}”?`)) return;
    const response = await fetch("/api/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: post.id }) });
    if (response.ok) { await loadPosts(); if (editing === post.id) startNew(); setNotice("Post deleted."); }
  }
  const preview = draft.body.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return <>
    <div className="eyebrow"><span>STUDIO JOURNAL / CMS</span><span>CONTENT DESK 004</span></div>
    <div className="page-heading"><div><p className="kicker">Good ideas deserve a good home.</p><h1>Content <em>desk</em></h1></div><Link href="/blog" className="button-outline">View public journal <span>↗</span></Link></div>
    <div className="admin-layout">
      <section className="surface-panel editor-panel"><div className="panel-heading"><div><span className="app-meta">{editing ? "EDIT STORY" : "NEW STORY"} / EDITOR</span><h2>{editing ? "Shape this story" : "Write a story"}</h2></div><span className="panel-count">{editing ? "02" : "01"}</span></div>
        <form className="post-form" onSubmit={submit}><label>Title<input required minLength={3} maxLength={100} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="A clear, useful title" /></label><label>URL slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder="lowercase-words-with-hyphens" /><small>Lowercase letters, numbers, and hyphens only.</small></label><label>Story<textarea rows={8} maxLength={12000} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder={"Write a few paragraphs.\n\nUse ## before a line to make a heading."} /></label><label className="status-select">Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as "draft" | "published" })}><option value="draft">Draft</option><option value="published">Published</option></select></label>{notice && <p className="form-notice" role="status">{notice}</p>}<div className="form-actions"><button className="button-primary" type="submit">{editing ? "Save changes" : "Create post"} <span>↗</span></button>{editing && <button type="button" className="text-button" onClick={startNew}>Cancel edit</button>}</div></form>
      </section>
      <section className="preview-panel"><div className="preview-top"><span className="app-meta">LIVE PREVIEW / TEXT SAFE</span><span>↗</span></div><article className="preview-article"><span className="preview-category">BRIGHTFIELD NOTES</span><h2>{draft.title || "Your story title"}</h2>{preview.length ? preview.map((block, index) => block.startsWith("## ") ? <h3 key={index}>{block.slice(3)}</h3> : <p key={index}>{block}</p>) : <p className="preview-placeholder">Your story preview will appear here. Text is rendered as plain, escaped content.</p>}</article><div className="preview-foot">brightfield.studio/journal/{draft.slug || "your-post-slug"}</div></section>
    </div>
    <section className="surface-panel posts-panel"><div className="panel-heading"><div><span className="app-meta">LOCAL CONTENT / DATA POSTS.JSON</span><h2>All stories</h2></div><span className="panel-count">{String(posts.length).padStart(2, "0")}</span></div>{loading ? <p className="loading-note">Loading local stories…</p> : <div className="post-list">{posts.map((post) => <article className="post-row" key={post.id}><span className="post-date">{post.status === "published" ? "PUBLIC" : "PRIVATE"}</span><div><h3>{post.title}</h3><span>/{post.slug}</span></div><span className={`status-chip ${post.status === "published" ? "status-paid" : "status-pending"}`}>{post.status}</span><div className="post-actions"><button type="button" onClick={() => beginEdit(post)}>Edit</button><button type="button" onClick={() => void removePost(post)}>Delete</button></div></article>)}</div>}</section>
  </>;
}
