# OQVIAN demos

Five small working demos built by OQVIAN, a small agency for AI, automation, web and cloud work. All of them use a fictional business and sample data. They are samples of what we build, not client work. Built with AI coding assistants (Claude and Codex), then run and checked by hand.

| Demo | What it shows | Run |
|---|---|---|
| [rag-chatbot](rag-chatbot) | Chatbot that answers from its own documents and cites the passage it used | `node server.mjs` (port 4101) |
| [portal-crm-cms](portal-crm-cms) | Next.js client portal, sales pipeline CRM and a blog editor, with Dockerfile and CI | `npm install && npm run build && npx next start -p 4102` |
| [three-landing](three-landing) | Three.js product landing page with a 3D lamp and color swatches | serve the folder (port 4103) |
| [security-check](security-check) | Passive security header and TLS checker that writes an HTML report | `node check.mjs https://your-site --out report.html` |

Screenshots are in [screenshots](screenshots).

The security checker is passive and for sites you own or have permission to check. It is not a penetration test.
