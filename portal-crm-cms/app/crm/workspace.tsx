"use client";

import { useMemo, useState } from "react";
import { Deal, seedDeals, Stage, stages } from "@/lib/deals";

const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

export default function CrmWorkspace() {
  const [deals, setDeals] = useState<Deal[]>(seedDeals);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Stage | "All stages">("All stages");
  const filtered = useMemo(() => deals.filter((deal) => `${deal.company} ${deal.contact} ${deal.email}`.toLowerCase().includes(query.toLowerCase()) && (filter === "All stages" || deal.stage === filter)), [deals, query, filter]);
  function moveDeal(id: string, stage: Stage) { setDeals((current) => current.map((deal) => deal.id === id ? { ...deal, stage } : deal)); }
  return <>
    <div className="eyebrow"><span>STUDIO GROWTH / CRM</span><span>PIPELINE 001</span></div>
    <div className="page-heading"><div><p className="kicker">A little momentum, made visible.</p><h1>Sales <em>pipeline</em></h1></div><div className="crm-heading-note"><span className="online-dot" /> LOCAL SAMPLE DATA</div></div>
    <div className="pipeline-toolbar"><div><span className="app-meta">CURRENT QUARTER</span><strong>Q4 / 2026</strong></div><div className="pipeline-summary"><span>12 <small>OPEN + CLOSED</small></span><i /> <span>{money(deals.reduce((total, deal) => total + deal.value, 0))}<small>PIPELINE VALUE</small></span></div></div>
    <section className="pipeline" aria-label="Sales pipeline">{stages.map((stage) => {
      const cards = deals.filter((deal) => deal.stage === stage);
      const total = cards.reduce((sum, deal) => sum + deal.value, 0);
      return <div className="pipeline-column" key={stage}><div className="column-head"><div><span className={`stage-marker stage-${stage.toLowerCase()}`} /> <h2>{stage}</h2><span className="column-count">{String(cards.length).padStart(2, "0")}</span></div><strong>{money(total)}</strong></div><div className="deal-list">{cards.map((deal) => <DealCard key={deal.id} deal={deal} onMove={moveDeal} />)}</div></div>;
    })}</section>
    <section className="surface-panel contacts-panel"><div className="panel-heading"><div><span className="app-meta">RELATIONSHIPS / 12 CONTACTS</span><h2>Contacts</h2></div><div className="contacts-tools"><label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search contacts" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or companies" /></label><label className="select-wrap"><span className="sr-only">Filter contacts by stage</span><select value={filter} onChange={(event) => setFilter(event.target.value as Stage | "All stages")}><option>All stages</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label></div></div><div className="table-scroll"><table><thead><tr><th>CONTACT</th><th>COMPANY</th><th>STAGE</th><th>EST. VALUE</th><th>LAST TOUCH</th></tr></thead><tbody>{filtered.map((deal) => <tr key={deal.id}><td><strong>{deal.contact}</strong><small>{deal.email}</small></td><td>{deal.company}</td><td><span className={`stage-pill stage-pill-${deal.stage.toLowerCase()}`}>{deal.stage}</span></td><td>{money(deal.value)}</td><td>{deal.date}</td></tr>)}{filtered.length === 0 && <tr><td colSpan={5} className="empty-row">No contacts match this search.</td></tr>}</tbody></table></div></section>
  </>;
}

function DealCard({ deal, onMove }: { deal: Deal; onMove: (id: string, stage: Stage) => void }) {
  const next = stages.filter((stage) => stage !== deal.stage);
  const [open, setOpen] = useState(false);
  return <article className="deal-card"><div className="deal-company"><span className={`deal-avatar avatar-${deal.color}`}>{deal.initials}</span><div><h3>{deal.company}</h3><p>{deal.contact}</p></div><button className="deal-menu" aria-label={`More options for ${deal.company}`} title="Deal options">···</button></div><div className="deal-value"><strong>{money(deal.value)}</strong><span>EST. PROJECT</span></div><div className="deal-card-bottom"><span>{deal.date}</span><button className="move-trigger" type="button" aria-expanded={open} aria-label={`Move ${deal.company} to another stage`} onClick={() => setOpen((current) => !current)}>Move to <span aria-hidden="true">⌄</span></button></div>{open && <div className="move-options" aria-label={`Move ${deal.company} to`}>
    {next.map((stage) => <button type="button" key={stage} onClick={() => { onMove(deal.id, stage); setOpen(false); }}>Move to {stage}</button>)}
  </div>}</article>;
}
