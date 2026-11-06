# Cheek Pouch Run

squeekchain-project: 099e6481-92a0-4eb5-af7c-29c2b0d3b42d

**His wheel. Your wild run.** An original mobile-first forest runner by **0xyas**, powered by Squeektoshi’s hardware telemetry on Squeekchain. Independent project by **0xyas** on GitHub `salsabila2507`. Original code and assets.

Jump mushrooms, duck owls, double-jump for seed arcs, and decide whether your cheeks can survive another stretch. The 40-seed pouch visibly grows: heavy cheeks slow the trail by up to 25% and lower jumps by up to 16%. At 36+ seeds, a visible three-second pressure meter builds toward a stumble that spills a quarter of your pouch, without taking a life. Hold Duck on the ground to steady it, or bank to reset the weight and pressure. Three hits end the run; each hit spills half your unbanked seeds. Heading home banks the existing pouch and ends your run. A newly observed wheel block creates golden seeds and a physical burrow: land to bank, or Duck+land to spend 10 seeds for +1 life then bank the rest. Day play stocks a Nest meter (seed combos and burrow banks); during real sleep that nest softens owl pressure and can absorb a hit. Gold trails, a boost announcement and a double-seed HUD mark 70+ RPM ZOOMIES. Banking has a persistent safe-seed confirmation.

Local objectives alternate between banking targets (12, 24, 36… total seeds) and surviving 12-second stretches of genuine sleep. Objectives never mint points or tokens. Sleep survival has its own local personal best, so Live remains a playable night challenge even at 0 RPM. Result cards show banked seeds, run metres, successful banks, completed goals and sleep-survival seconds.

## Run locally

```sh
npm ci
npm test
npm run build
npm start
# http://127.0.0.1:4179
```

The shipped game is plain HTML/CSS/ES modules/Canvas with **zero runtime packages**, no private keys and no backend. Play works without a wallet. An optional **burrow checkpoint** can connect an injected wallet on Ethereum Sepolia and send SQK `approve(self, 0)` (gas only), arming a local nest soft-start after a bank or Live block window. `@napi-rs/canvas` and `linkedom` are development-only test tools. Serve `dist/` on a static host; opening `index.html` as `file://` is not supported.

## Burrow checkpoint (optional, Sepolia)

After you bank seeds, or within 60 seconds of a Live wheel block, connect a wallet on Ethereum Sepolia and seal the burrow with one SQK `approve` to yourself for amount `0`. That arms a local nest soft-start on your next Live run (night owls ease a little). No SQK moves. Seeds stay local game points. You can still seal anytime for the public chain mark; the nest boost only arms inside those checkpoints. Recent self-zero approvals show on the site wall. Token: [`0x5501…db60`](https://sepolia.etherscan.io/token/0x5501e1fa81be1c3f49225fa7668da0245d07db60).

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Jump / double jump | Space, Up or W; press twice | Tap Jump or the scene, twice for double |
| Duck | Hold Down or S | Hold Duck |
| Return home and bank | H | Go home & bank |
| Pause | P or Escape | Pause icon |

Sound is optional and starts muted. Reduced-motion preferences disable idle motion and ZOOMIES streaks. Backgrounding the tab pauses the game; it never fast-forwards missed blocks.

## The real-wheel contract

Source: [`GET https://api.squeekchain.com/v1/status`](https://api.squeekchain.com/v1/status), [official reference](https://docs.squeekchain.com/developers/api/). Polled about every five seconds, with a four-second request timeout and `Retry-After` support for 429/503. No credentials. No random/simulated fallback in Live.

| Official signal | Gameplay consequence |
| --- | --- |
| Fresh, hardware-provenance, healthy schema v1; `coreStatus=ACTIVE` and positive `rpmMilli` | Live awake rules: scored run metres and seed collection open |
| `measurement.rpmMilli / 1000` | Base awake speed = `min(395, 140 + 2.8 × RPM)` game pixels/second, reduced by pouch weight and briefly after stumbling |
| RPM ≥ 70 | ZOOMIES: twice the value per seed pickup, announced once on entry, gold scarf wake and HUD |
| `IDLE` or zero RPM | Live remains open: night survival at a base 175 game px/s, more frequent traps and owls, local survival goals/best; new seeds and run metres stop; existing pouch may be banked |
| A forward `builder.projected.blockHeight` during continuous fresh observation | Exactly **one** golden-seed burst and burrow checkpoint for that poll, even if height advanced by many |
| Missing, malformed, stale, nonhardware, unhealthy or unknown status / transport failure | Live waiting room explains the failure while real API polling continues. Physics, distance, traps, objectives and seed scoring freeze. Practice is offered separately |

Numbers carrying block heights remain decimal strings and are compared as `BigInt`. `builder.anchor.blockHeight` is shown separately as the **settled** height. **Projected blocks are optimistic accepted work, not finalized Ethereum transactions or issued SQK.**

The first sample is a baseline, not a reward. Reconnects, epoch/installation changes and expired heartbeat rebaseline without catch-up. Duplicate/rollback heights cannot repeat checkpoints. Blocks seen in the lobby or while paused grant nothing later. Source timestamps must be within their advertised freshness budget (capped at 120s) and cannot be >10s in the future; the transport heartbeat independently expires after 12s. Polling means changes are observed with sampling delay, not instantaneously.

**No disabled Live gate:** genuine IDLE/zero-RPM telemetry opens night survival, not an offline simulation. Unknown or failed telemetry opens a non-scoring waiting room and automatically resumes only when validated real data returns.

**Practice is explicitly simulated** using a separate deterministic training clock. Its banked-seed, run-distance, sleep-survival and goal records use a different browser-storage key from Live. Existing records migrate with zero for new fields. Practice does not rescue an unavailable Live run and never enters Live scores. Live cannot accidentally accept a simulated wheel at the engine boundary.

## Why this is a game, not an API panel

- An original, fully playable double-jump/duck platform runner with collisions, seed arcs, hit spill, invulnerability and an extraction decision.
- Cheek weight, a visible stumble deadline and hold-to-steady ducking make collection a risk/recovery decision, not just a counter. Banking sheds weight immediately.
- Real RPM changes moment-to-moment collision timing. Sleep changes both available actions and hazard pressure. Observed wheel blocks spawn physical encounters rather than just changing a label.
- Custom code-drawn pixel hamster with growing cheeks and mint scarf, layered forest, burrow, mushrooms, owls and particle effects; no sprite pack, copied game, template or generated art asset.
- Not a treasury cash-out game, prediction market, NFT naming tool, tower/raid, DeFi vault, alert bot or dashboard. See the [board comparison](docs/BOARD-COMPARISON.md) for scope and limits of the comparison.

## Honest limits

Seeds are **local game points, not SQK, an airdrop, money, mining rewards or an NFT**. Run metres are game distance, not Squeektoshi’s measured distance. Records are browser-local and editable by their owner: there is no authenticated public leaderboard or anti-cheat claim. Storage-disabled browsers can still play without saving.

This is an independent fan project. It is **not approved, verified, affiliated with Squeekchain, or built by IMD yet**. The Code lane’s automatic and team reviews decide approval; nobody can honestly guarantee “100% accepted” or uniqueness against unseen/unpublished projects.

Project status: **publicly hosted on squeekrun.site**, Direct Submission **pending verify**, **not IMD-built**, **not approved**. A local build or commit is not evidence that the latest changes have reached production; verify the deployed build before claiming a release. Public hosting does not imply Squeekchain team approval.

- Source: [salsabila2507/cheek-pouch-run](https://github.com/salsabila2507/cheek-pouch-run)
- Live game: [squeekrun.site](https://squeekrun.site) (mirror [cheek-pouch-run.vercel.app](https://cheek-pouch-run.vercel.app))

## Squeekchain Code lane / IMD handoff

Official rules: https://squeekchain.com/genesis/code

The product is designed for “Games and mods powered by Squeekchain”, avoiding read-only dashboards, thin wrappers, templates and clones. A functioning local product is not the final ownership/submission step.

- For IMD, use the job brief in [`docs/IMD-JOB.md`](docs/IMD-JOB.md); fund the first real job from the regular wallet verified on **your own** Genesis profile. Do not reuse another project’s attribution.
- Keep the resulting real `.imd.site` domain and actual IMD job ID. Do not claim this local work was an IMD job.
- For direct submission, use the exact DNS record, page tag and repository README line issued by Squeekchain. None has been issued for this project.
- `index.html` carries the issued page meta tag `099e6481-92a0-4eb5-af7c-29c2b0d3b42d`. `project.json` records verification as `pending-verify` with domain `squeekrun.site`. It is project metadata, not an official Squeekchain schema. TXT proof is still the owner’s job.
- See [`docs/VERIFICATION.md`](docs/VERIFICATION.md) for the remaining publication and attribution steps.

## Verification

```sh
npm test             # wheel, transport, runner, records, Canvas, DOM integration
npm run check        # JS syntax
npm run build        # allowlisted static output only
node tools/render-art.js  # standalone Canvas art samples, not browser screenshots
```

Read [`docs/QA.md`](docs/QA.md) for evidence and outstanding real-browser checks. The public source and live game are linked above. `vercel.json` configures the static `dist/` deployment; hosting and source publication are separate from IMD provenance, submission and Squeekchain approval.

## Files

- `src/wheel.js` — strict status normalization, heartbeat, observed-block tracker, isolated Practice clock.
- `src/transport.js` — abortable public API polling and rate-limit backoff.
- `src/engine.js` — physics, seeds, pouch, damage, banking, physical checkpoints.
- `src/art.js` — all original code-drawn pixel artwork and scene rendering.
- `src/game.js` — controls, responsive Canvas, sound, UI and lifecycle.
- `src/storage.js` — defensive, mode-separated local records.
- `tests/` — reproducible policy, mechanics, rendering and DOM tests.

Copyright © 2026 0xyas. Original game code and artwork. No license to third-party Squeekchain marks is implied.
