# Cheek Pouch Run — design

User-approved concept: a mobile-first endless runner genuinely powered by Squeektoshi, for **0xyas**. English interface. Original hand-drawn pixel graphics, warm editorial typography, forest dusk palette. No token, wagering, transactions or wallet requirement.

## Game loop
Jump (including a second jump), duck under owls, collect seeds in a visibly growing cheek pouch. Three hits end the run and lose the unbanked pouch. Returning home banks the pouch and ends the run. A newly observed wheel block creates exactly one golden seed burst and a physical burrow checkpoint: land at it to bank and keep running. Greater RPM raises speed; 70+ RPM gives ZOOMIES and double seed values. Sleeping closes seed collection and scored distance and raises danger: retreat with what you already earned.

## Real data, not decoration
Poll the documented public /v1/status endpoint every five seconds. Validate schemaVersion=1, hardware provenance, online freshness, nonfuture timestamps, accepted oracle, healthy builder and nonfaulted core. Require ACTIVE plus positive RPM for scoring. IDLE or zero RPM means sleeping, not fabricated running. Treat source staleness, malformed JSON, transport timeout or missing fields as unknown; pause all gameplay while unknown. A transport heartbeat expires after 12 seconds even if the API source freshness budget is longer. Show projected versus settled blocks distinctly: projected blocks are not Ethereum settlement or SQK rewards.

Block heights are decimal strings compared as BigInt. First connection establishes a baseline, never a bonus. A forward change during uninterrupted fresh observation emits one checkpoint, regardless of height gap. Reconnection, installation/epoch change, or menu time do not replay bonuses. Duplicate/rollback observations do not duplicate events.

Practice is explicitly simulated, with an independent local record and deterministic simulated wheel cycle. No practice result enters Live records. Local-only scores are not secure competitive scores or an onchain claim. No public leaderboard is pretended.

## Architecture
Zero runtime dependencies: HTML, CSS, ES modules, Canvas 2D. wheel.js handles validation, gating and event tracking; engine.js handles physics, collision, pouch and checkpoint rules; art.js draws original pixels; game.js orchestrates controls, DOM and sound; storage.js holds mode-separated local records. Small local Node static server, deployable static output. No secret or API key needed.

## Verification
Node tests cover real API shape, gates, unavailable/old/replayed data, high-precision block comparisons, reconnect/no catch-up, practice separation, jump/duck, hits, checkpoint and bank logic. DOM integration tests cover controls and offline pause. Render sample scenes to PNG without automating the box browser. Static link/asset checks and HTTP smoke tests. Browser tools unavailable here; interactive real-browser QA must be explicitly disclosed.

## Distribution and honesty
Keep IMD handoff prompt, provenance notes, attribution and verification instructions ready. No fake IMD job/site or verified claim. An actual IMD build must be funded and run later. The source is now published at https://github.com/salsabila2507/cheek-pouch-run and the production game is hosted at https://cheek-pouch-run.vercel.app. Publication does not imply submission, verification or team approval; confirm any destination change with 0xyas. Never modify unrelated repositories. Team approval is not guaranteed by game mechanics or this checklist.
