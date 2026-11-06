# QA record — 6 November 2026, Asia/Jakarta

## Executed checks
- 49 automated tests: strict wheel policy and schema gates; hardware/simulated separation; stale/future/unknown data; milli-RPM conversion; BigInt block identity; no initial/reconnect/rollback/menu/pause catch-up; transport failure and rate-limit backoff; runner physics, double-jump/duck, seed values, pouch cap, bank/checkpoint, hits; independent defensive records; Canvas art; DOM/control/lifecycle integration; static imports/assets/metadata; 24 deterministic 320/390/960px long-run replays; six targeted text-contrast checks and a WCAG luminance-formula check; public publication metadata and README/verification documentation regressions.
- JavaScript syntax checks and static build.
- Dependency audit: zero known vulnerabilities at the latest check.
- Standalone native Canvas renders at 960×450 and 390×430, inspected as images. These are **art renders, not browser screenshots**.
- Local HTTP smoke check on http://127.0.0.1:4179 for the document and all linked/runtime assets.

The normal suite command is `npm test`; test counts and final exit status must be rechecked before reporting success. Tests were written and observed failing before the corresponding wheel, engine, transport, art and UI implementations. Regression tests reproduced and fixed blocked-localStorage boot and keyboard activation of Jump. The replay controller itself initially released duck before the full owl hitbox cleared; tracing demonstrated the test-controller issue and the test was corrected.

## Live data observed
The official public status endpoint was opened during this build: hardware provenance, online measurement, IDLE/0 RPM, projected/settled height 1140. Thus the observed real state correctly closes Live start, not a fabricated running state. Active/ZOOMIES, block advances, sleep transitions and outages were tested with explicit schema-shaped fixtures, not claimed as a real hamster running session. The official docs confirm public browser CORS support.

## Still needs actual browser/device QA
No browser-driving or reviewer subagent tool was available to this executor. It did not attach to the box browser with Playwright/CDP or automate the desktop. DOM tests use LinkeDOM and native Canvas; they do not prove CSS layout, real touch feel, browser AudioContext or production CORS.

For the published game at https://cheek-pouch-run.vercel.app, have an available browser agent or human test:
- 320, 375, 390, 768 and 1440px viewports; no horizontal overflow; start scrolls the mobile canvas into view.
- Touch double-jump, hold-duck, release/cancel; keyboard and button activation; rotation midrun.
- Sound toggle, reduced motion, disabled local storage, background-tab pause.
- A genuine active hamster session and real newly observed projected block.
- Offline/HTTP errors and recovery from the actual deployed origin, with no score/physics or catch-up.
- All current board entries, including six not returned in the public board fetch.

## Publication and contrast regression checks
Public source: https://github.com/salsabila2507/cheek-pouch-run. The production game URL was opened and its public page responded. Hosting is not submission, verification or approval; the project remains **not submitted** and **not IMD-built**.

The added regression checks first reproduced the stale publication metadata and text contrast below 4.5:1. Practice notes, sidebar copy, live notes, guide paragraphs, honesty copy and notebook paragraphs now use `#53644c`: 5.43:1 on the sidebar, 5.69:1 on the page and 5.74:1 on the live panel. These CSS-color calculations do not replace actual browser/device QA or prove full-page WCAG conformance.

No claim of full real-browser QA, anti-cheat, token rewards, IMD execution, official verification or guaranteed Code lane acceptance is made.
