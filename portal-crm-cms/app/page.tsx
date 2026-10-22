import Link from "next/link";

const apps = [
  { no: "01", title: "Client portal", path: "/portal", note: "A calmer place for project updates, files, invoices, and messages.", meta: "MARLOWE DENTAL / ACTIVE PROJECT" },
  { no: "02", title: "CRM", path: "/crm", note: "A clear view of the studio pipeline, from first hello to signed work.", meta: "12 SAMPLE DEALS / 5 STAGES" },
  { no: "03", title: "CMS admin", path: "/admin", note: "Write, edit, and publish studio journal posts in one small workspace.", meta: "LOCAL JSON / 4 STARTER POSTS" },
];

export default function Home() {
  return <>
    <div className="eyebrow"><span>BRIGHTFIELD / DIGITAL STUDIO</span><span>WORKSPACE 001 / 003</span></div>
    <section className="home-hero"><div><p className="kicker">A little more room to do good work.</p><h1>Good work,<br /><em>in good order.</em></h1></div><div className="hero-note"><span className="note-index">↘</span><p>Three connected tools for the moments around a project: sharing progress, growing relationships, and publishing useful ideas.</p><span className="note-caption">PORTAL · PIPELINE · PUBLISHING</span></div></section>
    <div className="section-head"><h2>Choose a workspace</h2><span>01 / 03</span></div>
    <section className="app-links" aria-label="Demo apps">
      {apps.map((app) => <Link key={app.path} href={app.path} className="app-link"><span className="app-number">{app.no}</span><div className="app-copy"><span className="app-meta">{app.meta}</span><h3>{app.title}</h3><p>{app.note}</p></div><span className="app-arrow" aria-hidden="true">↗</span></Link>)}
    </section>
    <section className="home-bottom"><div className="big-orbit"><span>BF</span><i /></div><p><strong>One thoughtful workspace.</strong><br />Made to keep the small details moving.</p><span className="home-bottom-index">A01 / 2026</span></section>
  </>;
}
