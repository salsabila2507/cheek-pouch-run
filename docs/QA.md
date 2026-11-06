# QA record — 6 November 2026, Asia/Jakarta

## Executed checks
- Baseline: 49 automated tests: strict wheel policy and schema gates; hardware/simulated separation; stale/future/unknown data; milli-RPM conversion; BigInt block identity; no initial/reconnect/rollback/menu/pause catch-up; transport failure and rate-limit backoff; runner physics, double-jump/duck, seed values, pouch cap, bank/checkpoint, hits; independent defensive records; Canvas art; DOM/control/lifecycle integration; static imports/assets/metadata; 24 deterministic 320/390/960px long-run replays; six targeted text-contrast checks and a WCAG luminance-formula check; public publication metadata and README/verification documentation regressions.
- JavaScript syntax checks and static build.
- Dependency audit: zero known vulnerabilities at the latest check.
- Standalone native Canvas renders at 960×450 and 390×430, inspected as images. These are **art renders, not browser screenshots**.
- Local HTTP smoke check on http://127.0.0.1:4179 for the document and all linked/runtime assets.

The normal suite command is `npm test`; test counts and final exit status must be rechecked before reporting success. Tests were written and observed failing before the corresponding wheel, engine, transport, art and UI implementations. Regression tests reproduced and fixed blocked-localStorage boot and keyboard activation of Jump. The replay controller itself initially released duck before the full owl hitbox cleared; tracing demonstrated the test-controller issue and the test was corrected.

## Live data observed
The official public status endpoint was opened during this build: hardware provenance, online measurement, IDLE/0 RPM, projected/settled height 1140. That was the baseline behavior; the finished-run update below intentionally opens genuine sleep as night survival, never as fabricated running. Active/ZOOMIES, block advances, sleep transitions and outages were tested with explicit schema-shaped fixtures, not claimed as a real hamster running session. The official docs confirm public browser CORS support.

## Still needs actual browser/device QA
No browser-driving or reviewer subagent tool was available to this executor. It did not attach to the box browser with Playwright/CDP or automate the desktop. DOM tests use LinkeDOM and native Canvas; they do not prove CSS layout, real touch feel, browser AudioContext or production CORS.

For the published game at https://cheek-pouch-run.vercel.app, have an available browser agent or human test:
- 320, 375, 390, 768 and 1440px viewports; no horizontal overflow; start scrolls the mobile canvas into view.
- Touch double-jump, hold-duck, release/cancel; keyboard and button activation; rotation midrun.
- Sound toggle, reduced motion, disabled local storage, background-tab pause.
- A genuine active hamster session and real newly observed projected block.
- Offline/HTTP errors and recovery from the actual deployed origin, with no score/physics or catch-up.
- All current board entries, including seven not returned in the latest public board fetch.

## Publication and contrast regression checks
Public source: https://github.com/salsabila2507/cheek-pouch-run. The production game URL was opened and its public page responded. Hosting is not submission, verification or approval; the project remains **not submitted** and **not IMD-built**.

The added regression checks first reproduced the stale publication metadata and text contrast below 4.5:1. Practice notes, sidebar copy, live notes, guide paragraphs, honesty copy and notebook paragraphs now use `#53644c`: 5.43:1 on the sidebar, 5.69:1 on the page and 5.74:1 on the live panel. These CSS-color calculations do not replace actual browser/device QA or prove full-page WCAG conformance.

No claim of full real-browser QA, anti-cheat, token rewards, IMD execution, official verification or guaranteed Code lane acceptance is made.

## Finished-run local verification — 6 November 2026, Asia/Jakarta

- `npm test`: **93 tests passed, 0 failed** (44 additional tests over the 49-test baseline). Includes 34 text-pair contrast checks plus the standard luminance formula, deterministic load/pressure/stumble/steady mechanics, local banking and sleep objectives, ZOOMIES entry/re-entry, offline wait/recovery, mode-separated night records and rendered warning/trail evidence.
- New behavior tests were observed failing before the corresponding engine, UI, records, contrast and artwork changes, then rerun green.
- `npm run check`, `npm run build`, `git diff --check`: passed.
- Static `dist/` served over local HTTP: **11/11** document, style, favicon, metadata, runtime modules and robots assets returned nonempty 200 responses.
- `npm audit --audit-level=high`: **0 vulnerabilities**.
- Fresh public API GET at **16:42 Asia/Jakarta** returned healthy hardware `IDLE`, **0 RPM**, projected/settled **1140** and `Access-Control-Allow-Origin: *`. This now permits honest Live night survival. No active hardware run or new real block was observed during this update.
- Original native Canvas mobile art render was inspected with the new gold scarf wake. These remain art samples, not browser screenshots.
- Official Code lane and API documentation were reopened. Latest board fetch reports 19 projects, returns 12 descriptions; comparisons remain incomplete and are not approval evidence.

This is **local build/test evidence only**, not a claim that the new build has been pushed or deployed. The prior public hosting links remain correct for the project. Production readiness and actual browser/device QA are not established by these tests. No desktop/browser-driving or independent reviewer tool was available to this executor; CSS layout, real touch feel, AudioContext and deployed-origin behavior remain release QA checks for the parent/browser agent. Ownership verification, submission, IMD provenance and team approval remain unchanged and unclaimed.
