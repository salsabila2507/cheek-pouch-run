# Cheek Pouch Run Implementation Plan

> For agentic workers: execute inline with tests before implementation.

**Goal:** Deliver an original, playable wheel-powered runner with truthful Live and separate Practice modes.
**Architecture:** Independent wheel policy, simulation, drawing, storage, and browser orchestration modules.
**Tech Stack:** Canvas 2D, native ES modules, CSS, Node test runner.

## Global Constraints
- English UI. Original pixel artwork. Mobile-first touch controls and accessible keyboard equivalents.
- /v1/status polling ~5s. No simulated fallback in Live. API loss pauses the game.
- Projected and settled blocks are different; no financial rewards.
- Only one bonus per observed advance, no initial/reconnect/menu catch-up.
- Practice and Live saves never mix. No unrelated repositories are modified.

## Execution checklist
- [x] Write failing wheel, storage and engine contract tests; run and observe failures.
- [x] Implement strict status normalization, tracker, practice cycle and mode storage; run tests.
- [x] Implement runner physics, jump/duck, collecting, bank, checkpoint and collision mechanics; run tests.
- [x] Build responsive HTML/CSS and original Canvas scene with three parallax layers, growing-cheek hamster, owls, mushrooms, seed arcs and burrows.
- [x] Wire polling, transport expiry, keyboard/touch, sound, pause, records and result card.
- [x] Add DOM integration and transport tests. Rasterize and inspect representative desktop/mobile scenes.
- [x] Document controls, exact API coupling, limitations, IMD handoff and verification procedure; prepare static release.
- [x] Run full tests, syntax checks and local HTTP/asset smoke tests; report only observed results.
