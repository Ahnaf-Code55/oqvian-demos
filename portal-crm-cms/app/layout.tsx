import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brightfield Studio | Workspace",
  description: "A client portal, sales pipeline, and publishing workspace sample.",
};

const links = [
  ["01", "Overview", "/"],
  ["02", "Client portal", "/portal"],
  ["03", "CRM", "/crm"],
  ["04", "CMS admin", "/admin"],
  ["↗", "Journal", "/blog"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-frame">
          <aside className="sidebar">
            <Link className="brand" href="/" aria-label="Brightfield Studio home">
              <span className="brand-mark">B<span>.</span></span>
              <span className="brand-name">brightfield<span>STUDIO WORKSPACE</span></span>
            </Link>
            <div className="nav-label">WORKSPACE</div>
            <nav aria-label="Main navigation">
              {links.map(([number, label, href]) => <Link key={href} href={href} className="nav-link"><span>{number}</span>{label}</Link>)}
            </nav>
            <div className="side-bottom"><div className="online-dot" /> All systems local <span>DEMO BUILD / 26.10</span></div>
          </aside>
          <div className="page-column">
            <header className="topbar"><Link href="/" className="mobile-brand">B<span>.</span> / BRIGHTFIELD</Link><span className="crumb">Studio workspace <b>/</b> Sample environment</span><span className="demo-tag"><i /> Demo with sample data</span><nav className="mobile-nav" aria-label="Workspace navigation">{links.map(([, label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav></header>
            <main className="main-content">{children}</main>
            <footer className="site-footer"><span>BRIGHTFIELD STUDIO</span><span>DESIGNED FOR CLEARER WORK</span></footer>
          </div>
        </div>
      </body>
    </html>
  );
}
