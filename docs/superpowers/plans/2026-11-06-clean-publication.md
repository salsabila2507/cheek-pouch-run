# Clean Publication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Correct readable copy and public project metadata while retaining honest submission status and sole creator attribution.

**Architecture:** Keep the existing static game and its runtime unchanged. Add targeted regression tests, update CSS and publication documentation, rebuild the allowlisted distribution, and prepare a clean single-commit snapshot without destroying existing history.

**Tech Stack:** HTML, CSS, ES modules, Node test runner, linkedom, Git.

## Global Constraints
- Creator: 0xyas; GitHub author: salsabila2507 <salsabila2507@users.noreply.github.com>.
- Repository: https://github.com/salsabila2507/cheek-pouch-run.
- Production URL: https://cheek-pouch-run.vercel.app.
- Keep verification not-submitted and all unissued IMD/tag/approval values null.
- Change only this project. Preserve existing history until destructive rewrite confirmation.

---

### Task 1: Regression tests
- [x] Update tests/static.test.js to expect the exact public repository, production URL and null unissued verification values.
- [x] Add publication-document tests requiring both project links and rejecting outdated no-repository/no-hosting claims.
- [x] Add CSS contrast tests for practice notes, guide paragraphs, honesty paragraphs, sidebar copy and live notes, including notebook paragraphs.
- [x] Run npm test; confirm failures are the outdated metadata/docs and sub-4.5:1 contrast.

### Task 2: Minimal corrections
- [x] Update only the affected CSS foreground colors to an opaque dark green that achieves at least 4.5:1 against their actual light backgrounds.
- [x] Set project.json verification.publicRepository and top-level liveUrl to the exact public URLs; keep unissued values null.
- [x] Update README.md and docs/VERIFICATION.md to describe published hosting without claiming submission or approval.
- [x] Correct the outdated publication restriction in the original design document.
- [x] Run npm test, npm run check, npm run build and npm audit.

### Task 3: Clean snapshot and evidence
- [x] Scan project text and prepared Git metadata for unwanted attribution; retain only creator attribution.
- [x] Confirm dist assets match source and local working tree changes are scoped.
- [ ] Prepare one fresh root commit using only salsabila2507 author and committer, preserving the original Git directory until rewrite approval.
- [ ] Report exact SHA, author, test count, audit, and any publication/rewrite approval still needed.
