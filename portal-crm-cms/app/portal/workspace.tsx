"use client";

import { FormEvent, useState } from "react";

const steps = ["Discovery", "Identity", "Website", "Launch"];
const invoices = [
  { number: "INV-024", date: "18 Oct 2026", item: "Website, phase two", amount: "$1,850", status: "Awaiting payment" },
  { number: "INV-021", date: "02 Oct 2026", item: "Brand direction", amount: "$1,200", status: "Paid" },
  { number: "INV-019", date: "16 Sep 2026", item: "Project deposit", amount: "$900", status: "Paid" },
];
const files = ["Homepage wireframe.pdf", "Brand direction v2.pdf", "Marlowe photo notes.docx"];

export default function PortalWorkspace() {
  const [messages, setMessages] = useState([
    { name: "Ari Bennett", role: "BRIGHTFIELD STUDIO", time: "Today, 10:42", body: "The revised appointment flow is ready for a look. We kept the booking steps short and made the next action easier to spot." },
    { name: "Marlowe Dental", role: "CLIENT TEAM", time: "Yesterday, 16:18", body: "This feels much clearer. Could we check the mobile version together before we call it finished?" },
  ]);
  const [reply, setReply] = useState("");
  function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reply.trim()) return;
    setMessages([{ name: "You", role: "MARLOWE DENTAL", time: "Just now", body: reply.trim() }, ...messages]);
    setReply("");
  }
  return <>
    <div className="eyebrow"><span>CLIENT SERVICES / PORTAL</span><span>PROJECT 026</span></div>
    <div className="page-heading"><div><p className="kicker">A shared place to keep things moving.</p><h1>Marlowe <em>Dental</em></h1></div><span className="status-chip status-active"><i /> IN PROGRESS</span></div>
    <section className="project-panel">
      <div className="project-intro"><div><span className="app-meta">PROJECT SNAPSHOT / UPDATED 22 OCT 2026</span><h2>A more welcoming<br />first appointment.</h2></div><p>Brand refresh and website experience for a neighborhood dental practice.</p></div>
      <div className="timeline" aria-label="Project timeline"><div className="timeline-line"><span /></div>{steps.map((step, index) => <div className={`timeline-step ${index < 3 ? "done" : ""}`} key={step}><span className="step-dot">{index < 2 ? "✓" : `0${index + 1}`}</span><strong>{step}</strong><small>{["Complete", "Complete", "In review", "Up next"][index]}</small></div>)}</div>
      <div className="project-foot"><span>PROJECT LEAD <b>Ari Bennett</b></span><span>ESTIMATED HANDOFF <b>06 Nov 2026</b></span><span>OPEN ITEMS <b>02</b></span></div>
    </section>
    <div className="portal-grid">
      <section className="surface-panel"><div className="panel-heading"><div><span className="app-meta">FINANCE / 01</span><h2>Open invoices</h2></div><span className="panel-count">03</span></div><div className="table-scroll"><table><thead><tr><th>INVOICE</th><th>DETAIL</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.number}><td><strong>{invoice.number}</strong><small>{invoice.date}</small></td><td>{invoice.item}</td><td>{invoice.amount}</td><td><span className={`status-chip ${invoice.status === "Paid" ? "status-paid" : "status-pending"}`}>{invoice.status}</span></td></tr>)}</tbody></table></div><button className="text-button" type="button">View invoice history <span>↗</span></button></section>
      <section className="surface-panel files-panel"><div className="panel-heading"><div><span className="app-meta">PROJECT LIBRARY / 02</span><h2>Shared files</h2></div><span className="panel-count">03</span></div><ul className="file-list">{files.map((file, index) => <li key={file}><span className="file-type">{["PDF", "PDF", "DOC"][index]}</span><span>{file}<small>{["Updated today", "Updated 18 Oct", "Added 12 Oct"][index]}</small></span><span className="file-arrow">↗</span></li>)}</ul><p className="fine-print">File previews are not included in this demo.</p></section>
    </div>
    <section className="surface-panel message-panel"><div className="panel-heading"><div><span className="app-meta">DIRECT LINE / 03</span><h2>Project messages</h2></div><span className="online-label"><i /> TEAM ONLINE</span></div><div className="message-thread">{messages.map((message, index) => <article className="message" key={`${message.time}-${index}`}><div className="avatar">{message.name === "You" ? "MD" : message.name === "Marlowe Dental" ? "MD" : "AB"}</div><div><div className="message-by"><strong>{message.name}</strong><span>{message.role} · {message.time}</span></div><p>{message.body}</p></div></article>)}</div><form className="reply-form" onSubmit={sendReply}><label className="sr-only" htmlFor="reply">Write a project reply</label><input id="reply" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a thoughtful reply..." /><button type="submit" className="button-primary">Send message <span>↗</span></button></form><p className="fine-print">Replies are held in this browser session only.</p></section>
  </>;
}
