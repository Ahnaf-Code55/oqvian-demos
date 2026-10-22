#!/usr/bin/env node
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import { URL, pathToFileURL } from 'node:url';
import { checkServerIdentity } from 'node:tls';

const MAX_REDIRECTS = 3;
const USER_AGENT = 'OQVIAN-Passive-Header-Check/1.0';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function headerValue(headers, name) {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(', ') : value || '';
}

function requestOnce(target) {
  return new Promise((resolve, reject) => {
    const transport = target.protocol === 'https:' ? https : http;
    const req = transport.request(target, {
      method: 'GET',
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,*/*;q=0.8' },
      timeout: 12000,
      rejectUnauthorized: target.protocol !== 'https:',
    }, (res) => {
      const response = { statusCode: res.statusCode || 0, headers: res.headers, tlsInfo: captureTls(target, res.socket) };
      res.resume();
      res.on('end', () => resolve(response));
    });
    req.on('timeout', () => req.destroy(new Error('Request timed out after 12 seconds')));
    req.on('error', reject);
    req.end();
  });
}

async function fetchTarget(input) {
  let target = new URL(input);
  let firstUrl = target.href;
  const redirects = [];
  let response;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    response = await requestOnce(target);
    if (![301, 302, 303, 307, 308].includes(response.statusCode) || !headerValue(response.headers, 'location')) break;
    if (hop === MAX_REDIRECTS) throw new Error(`Stopped after ${MAX_REDIRECTS} redirects`);
    const next = new URL(headerValue(response.headers, 'location'), target);
    redirects.push({ from: target.href, to: next.href, statusCode: response.statusCode });
    target = next;
  }
  return { firstUrl, finalUrl: target.href, target, response, redirects };
}

function captureTls(target, socket) {
  if (target.protocol !== 'https:') return { protocol: 'Not checked, target uses HTTP', days: null, hostnameMatch: null };
  const cert = socket?.getPeerCertificate?.();
  const validTo = cert?.valid_to ? Date.parse(cert.valid_to) : NaN;
  const days = Number.isFinite(validTo) ? Math.floor((validTo - Date.now()) / 86400000) : null;
  let hostnameMatch = false;
  try {
    hostnameMatch = Boolean(cert && !checkServerIdentity(target.hostname, cert));
  } catch {}
  return { protocol: socket?.getProtocol?.() || 'Unknown', days, hostnameMatch };
}

function tlsDetails(_target, response) {
  return response.tlsInfo || { protocol: 'Not checked, target uses HTTP', days: null, hostnameMatch: null };
}

function finding(status, title, value, why, fix) {
  return { status, title, value, why, fix };
}

export function evaluate(result, tlsInfo) {
  const { firstUrl, finalUrl, target, response, redirects } = result;
  const headers = response.headers;
  const hsts = headerValue(headers, 'strict-transport-security');
  const csp = headerValue(headers, 'content-security-policy');
  const xfo = headerValue(headers, 'x-frame-options');
  const frameAncestors = /(?:^|;)\s*frame-ancestors\b/i.test(csp);
  const contentType = headerValue(headers, 'x-content-type-options');
  const referrer = headerValue(headers, 'referrer-policy');
  const permissions = headerValue(headers, 'permissions-policy');
  const server = headerValue(headers, 'server');
  const powered = headerValue(headers, 'x-powered-by');
  const cookies = headers['set-cookie'] || [];
  const cookieList = Array.isArray(cookies) ? cookies : [cookies];
  const hstsMaxAge = hsts.match(/(?:^|;)\s*max-age\s*=\s*(\d+)/i)?.[1];
  const hstsGood = Boolean(hstsMaxAge && Number(hstsMaxAge) > 0 && /(?:^|;)\s*includesubdomains\b/i.test(hsts));
  const cspOnlyUnsafeInline = /'unsafe-inline'/i.test(csp) && !/(?:default-src|script-src|style-src)\s+[^;]*(?:'self'|'none'|https?:|\*)/i.test(csp);
  const cspStatus = !csp ? 'FAIL' : cspOnlyUnsafeInline ? 'WARN' : 'PASS';
  let cookieStatus = 'PASS';
  let cookieValue = 'No Set-Cookie headers observed';
  if (cookieList.length) {
    const missing = [];
    if (cookieList.some((cookie) => !/;\s*secure(?:;|$)/i.test(cookie))) missing.push('Secure');
    if (cookieList.some((cookie) => !/;\s*httponly(?:;|$)/i.test(cookie))) missing.push('HttpOnly');
    if (cookieList.some((cookie) => !/;\s*samesite\s*=/i.test(cookie))) missing.push('SameSite');
    cookieStatus = missing.length ? 'WARN' : 'PASS';
    cookieValue = missing.length ? `Missing on at least one cookie: ${missing.join(', ')}` : `${cookieList.length} cookie(s) include all three flags`;
  }
  const initial = new URL(firstUrl);
  const redirectedToHttps = initial.protocol === 'https:' || (target.protocol === 'https:' && redirects.length > 0);
  const rows = [
    finding(redirectedToHttps ? 'PASS' : 'FAIL', 'HTTP to HTTPS redirect', redirects.length ? `${redirects.length} redirect(s), final URL is ${finalUrl}` : `${finalUrl}${initial.protocol === 'http:' ? ', no HTTPS redirect observed' : ', HTTPS requested directly'}`, 'HTTPS protects traffic from passive reading and in transit changes.', 'Redirect all HTTP requests to HTTPS and update internal links to HTTPS.'),
    finding(!hsts ? 'FAIL' : hstsGood ? 'PASS' : 'WARN', 'HSTS policy', hsts || 'Header not present', 'HSTS tells browsers to use HTTPS for future visits.', 'Set Strict-Transport-Security with a suitable max-age and includeSubDomains after confirming every subdomain supports HTTPS.'),
    finding(cspStatus, 'Content Security Policy', csp || 'Header not present', 'CSP can limit the sources that may run scripts and load page content.', "Define a restrictive policy with explicit sources. Avoid relying on unsafe-inline."),
    finding(xfo || frameAncestors ? 'PASS' : 'FAIL', 'Clickjacking protection', xfo ? `X-Frame-Options: ${xfo}` : frameAncestors ? 'CSP frame-ancestors directive present' : 'No X-Frame-Options or CSP frame-ancestors observed', 'Frame restrictions make it harder to disguise your page inside another site.', 'Set X-Frame-Options to DENY or SAMEORIGIN, or define CSP frame-ancestors.'),
    finding(/^nosniff$/i.test(contentType.trim()) ? 'PASS' : contentType ? 'WARN' : 'FAIL', 'MIME sniffing protection', contentType || 'Header not present', 'This header asks browsers to respect the declared content type.', 'Set X-Content-Type-Options to nosniff.'),
    finding(referrer ? 'PASS' : 'WARN', 'Referrer policy', referrer || 'Header not present', 'A referrer policy controls how much URL information is shared with other sites.', 'Choose a policy such as strict-origin-when-cross-origin.'),
    finding(permissions ? 'PASS' : 'WARN', 'Permissions policy', permissions || 'Header not present', 'A permissions policy can limit browser features such as camera and location access.', 'Set a Permissions-Policy that disables features your site does not use.'),
    finding(server || powered ? 'WARN' : 'PASS', 'Technology header leakage', [server && `Server: ${server}`, powered && `X-Powered-By: ${powered}`].filter(Boolean).join('; ') || 'No Server or X-Powered-By value observed', 'Detailed platform headers can give attackers extra clues about your stack.', 'Remove or generalize Server and X-Powered-By response headers.'),
    finding(cookieStatus, 'Cookie flags', cookieValue, 'Secure, HttpOnly, and SameSite reduce common cookie exposure and cross-site risks.', 'Set Secure, HttpOnly, and an appropriate SameSite value on session cookies.'),
    finding(tlsInfo.protocol.startsWith('TLSv1.2') || tlsInfo.protocol.startsWith('TLSv1.3') ? 'PASS' : tlsInfo.protocol.startsWith('Not checked') ? 'WARN' : 'FAIL', 'TLS protocol', tlsInfo.protocol, 'Modern TLS versions protect connections with current cryptographic protocols.', 'Enable TLS 1.2 or TLS 1.3 and disable older protocol versions.'),
    finding(tlsInfo.days === null ? (target.protocol === 'https:' ? 'WARN' : 'WARN') : tlsInfo.days < 0 ? 'FAIL' : tlsInfo.days <= 30 ? 'WARN' : 'PASS', 'Certificate expiry', tlsInfo.days === null ? 'No certificate expiry date available' : tlsInfo.days < 0 ? `Expired ${Math.abs(tlsInfo.days)} day(s) ago` : `${tlsInfo.days} day(s) remaining`, 'An expired certificate causes browser warnings and can interrupt service.', 'Renew the certificate before its expiry date and confirm automatic renewal.'),
    finding(tlsInfo.hostnameMatch === null ? 'WARN' : tlsInfo.hostnameMatch ? 'PASS' : 'FAIL', 'Certificate hostname match', tlsInfo.hostnameMatch === null ? 'Not checked, target uses HTTP' : tlsInfo.hostnameMatch ? `${target.hostname} matches certificate` : `Certificate does not match ${target.hostname}`, 'A name match helps confirm the certificate was issued for the requested host.', 'Install a currently valid certificate that includes this hostname.'),
  ];
  const points = rows.reduce((sum, row) => sum + (row.status === 'PASS' ? 1 : row.status === 'WARN' ? 0.5 : 0), 0);
  return { rows, score: Math.round(points / rows.length * 100), firstUrl, finalUrl, statusCode: response.statusCode, redirects };
}

export function reportHtml(report, generatedAt = new Date()) {
  const date = generatedAt.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
  const rows = report.rows.map((row) => `<article class="finding ${row.status.toLowerCase()}">
    <div class="finding-top"><span class="status">${row.status}</span><h2>${escapeHtml(row.title)}</h2></div>
    <p class="value">${escapeHtml(row.value)}</p><p class="why"><b>Why it matters</b>${escapeHtml(row.why)}</p>
    <p class="fix"><b>How to fix</b>${escapeHtml(row.fix)}</p>
  </article>`).join('\n');
  const redirectTrail = report.redirects.length ? `<p class="trail">Redirect path: ${report.redirects.map((step) => `${escapeHtml(step.statusCode)} ${escapeHtml(step.from)} to ${escapeHtml(step.to)}`).join(' | ')}</p>` : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Security header and TLS report</title>
<style>
:root{color-scheme:light;--paper:#f3f0e8;--ink:#172b32;--muted:#5d6d70;--line:#ccd3ca;--teal:#116d68;--good:#176b4b;--warn:#98611d;--bad:#a53832;--mono:"IBM Plex Mono","SFMono-Regular",Consolas,monospace;--serif:"Source Serif 4",Georgia,serif}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 var(--serif)}main{max-width:960px;margin:0 auto;padding:36px 24px 52px}.eyebrow,.sample,.label,.status,b{font:700 11px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase}.eyebrow{color:var(--teal);margin:0 0 12px}header{border-bottom:2px solid var(--ink);padding-bottom:24px}.headrow{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}h1{font-size:clamp(30px,6vw,54px);letter-spacing:-.035em;line-height:1.04;margin:0 0 18px;max-width:620px}.sample{white-space:nowrap;background:#dce8dd;color:#225547;border:1px solid #a9c4b0;padding:8px 10px}.target{overflow-wrap:anywhere;font:13px/1.6 var(--mono);margin:0;color:var(--muted)}.meta{display:flex;gap:20px;flex-wrap:wrap;margin-top:18px;color:var(--muted);font:12px var(--mono)}.scorebox{display:flex;align-items:center;gap:20px;padding:26px 0 22px;border-bottom:1px solid var(--line)}.score{font:500 64px/.9 var(--mono);letter-spacing:-.09em;color:var(--teal)}.score small{font-size:17px;letter-spacing:0;color:var(--muted)}.scorecopy h2{font-size:23px;margin:0 0 4px}.scorecopy p{color:var(--muted);margin:0}.label{color:var(--teal)}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 24px;padding-top:8px}.finding{padding:18px 0;border-bottom:1px solid var(--line);break-inside:avoid}.finding-top{display:flex;align-items:center;gap:10px}.finding h2{font-size:19px;margin:0}.status{min-width:56px;text-align:center;padding:4px 6px;border-radius:2px;color:white;background:var(--teal)}.warn .status{background:var(--warn)}.fail .status{background:var(--bad)}.value{font:12px/1.55 var(--mono);overflow-wrap:anywhere;background:#e8e7dc;padding:9px 10px;margin:12px 0}.finding p:not(.value){font-size:14px;margin:8px 0;color:var(--muted)}.finding b{display:block;color:var(--ink);margin-bottom:2px}.trail{font:11px/1.6 var(--mono);overflow-wrap:anywhere;color:var(--muted);margin-top:18px}footer{border-top:2px solid var(--ink);padding-top:15px;margin-top:30px;color:var(--muted);font:11px/1.6 var(--mono)}:focus-visible{outline:3px solid #d17d29;outline-offset:3px}
@media(max-width:620px){main{padding:24px 17px 36px}.headrow{display:block}.sample{display:inline-block;margin-top:16px}.grid{grid-template-columns:1fr}.score{font-size:54px}.scorebox{align-items:flex-start}}
@media print{body{background:#fff;color:#111;font-size:12px}main{max-width:none;padding:8mm}.sample{background:#fff}.grid{grid-template-columns:1fr 1fr;gap:0 12mm}.finding{padding:10px 0}.finding p:not(.value){font-size:10px}.value{background:#f2f2f2}header,.scorebox,footer{break-inside:avoid}a{color:inherit}}
</style></head><body><main><header><div class="headrow"><div><p class="eyebrow">OQVIAN / Site review</p><h1>Security header and TLS report</h1></div><span class="sample">Demo with sample data</span></div><p class="target">Target: ${escapeHtml(report.firstUrl)}</p><div class="meta"><span>Generated ${escapeHtml(date)}</span><span>HTTP status ${escapeHtml(report.statusCode)}</span><span>Passive checks only</span></div></header>
<section class="scorebox"><div class="score">${report.score}<small> / 100</small></div><div class="scorecopy"><p class="label">Header and transport snapshot</p><h2>${report.rows.filter((row) => row.status === 'PASS').length} checks passed</h2><p>Score summarizes the observed checks, it is not a complete security rating.</p></div></section>
<section class="grid" aria-label="Findings">${rows}</section>${redirectTrail}<footer>One GET request through at most ${MAX_REDIRECTS} redirects. TLS details are read from the HTTPS connection. This report is a passive snapshot, not a penetration test.</footer></main></body></html>`;
}

async function runCheck(url, outputPath) {
  const fetched = await fetchTarget(url);
  const tlsInfo = tlsDetails(fetched.target, fetched.response);
  const report = evaluate(fetched, tlsInfo);
  fs.writeFileSync(outputPath, reportHtml(report));
  console.log(`Target: ${report.firstUrl}`);
  console.log(`Final URL: ${report.finalUrl} (HTTP ${report.statusCode})`);
  console.log(`Score: ${report.score}/100`);
  console.log(`HTML report: ${outputPath}`);
  for (const row of report.rows) console.log(`${row.status.padEnd(4)} ${row.title}: ${row.value}`);
  return report;
}

function localServer(port, headers) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', ...headers });
      res.end('<!doctype html><title>Local sample</title><p>Local self-check page.</p>');
    });
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function selfTest() {
  const weakHeaders = {
    server: 'SampleServer/0.1', 'x-powered-by': 'DemoRuntime',
    'set-cookie': 'session=example; Path=/',
  };
  const goodHeaders = {
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
    'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'set-cookie': 'session=example; Path=/; Secure; HttpOnly; SameSite=Lax',
  };
  let weakServer;
  let goodServer;
  try {
    weakServer = await localServer(4104, weakHeaders);
    goodServer = await localServer(4105, goodHeaders);
    const weak = await runCheck('http://127.0.0.1:4104/', 'sample-report.html');
    const good = await runCheck('http://127.0.0.1:4105/', '/tmp/security-check-good-report.html');
    if (!(weak.score < good.score)) throw new Error(`Expected weak score ${weak.score} to be lower than good score ${good.score}`);
    console.log(`PASS self-check, weak ${weak.score}/100 is lower than good ${good.score}/100`);
  } finally {
    await Promise.all([weakServer, goodServer].filter(Boolean).map((server) => new Promise((resolve) => server.close(resolve))));
    try { fs.unlinkSync('/tmp/security-check-good-report.html'); } catch {}
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) {
    console.log('Notice: this checker is for sites you own or have permission to test. The self-check uses local sample servers only.');
    await selfTest();
    return;
  }
  const url = args.find((arg) => !arg.startsWith('--'));
  if (!url || args.includes('--help')) {
    console.log('Usage: node check.mjs <url> [--out report.html]\n       node check.mjs --selftest\nNotice: only run against sites you own or have permission to test. Checks are passive and make GET requests only.');
    if (!url && !args.includes('--help')) process.exitCode = 2;
    return;
  }
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Enter a valid absolute URL, including http:// or https://'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http:// and https:// URLs are supported');
  const outIndex = args.indexOf('--out');
  const outputPath = outIndex >= 0 ? args[outIndex + 1] : 'report.html';
  if (!outputPath || outputPath.startsWith('--')) throw new Error('Provide a file path after --out');
  console.log('Notice: only run against sites you own or have permission to test. This performs passive GET checks only.');
  await runCheck(parsed.href, outputPath);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
