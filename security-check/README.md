# Passive security header and TLS checker

This Node.js command line demo checks common response headers, cookie flags, redirects, and TLS details, then writes a self-contained HTML report. It is passive only, for sites you own or have permission to check, and is not a penetration test.

Run with `node check.mjs https://example.test --out report.html`. The self-check runs with `node check.mjs --selftest`.

Port: no fixed port for normal use. The self-check uses local ports 4104 and 4105.

Not included: crawling, port scanning, payloads, exploitation, or a complete security assessment.
