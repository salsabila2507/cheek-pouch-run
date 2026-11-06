# Publication and ownership checklist

Current state: built and tested; **publicly hosted on squeekrun.site**; Direct Submission **pending verify**; **not IMD-built**. No Squeekchain team approval is claimed.

- Public repository: https://github.com/salsabila2507/cheek-pouch-run
- Production game: https://squeekrun.site
- Mirror: https://cheek-pouch-run.vercel.app
- Creator: **0xyas**; GitHub account and commit identity: **salsabila2507**.

Source publication and Vercel hosting do not supply team approval. `project.json` records the public repository, live URL `https://squeekrun.site`, verification `pending-verify`, issued page tag `099e6481-92a0-4eb5-af7c-29c2b0d3b42d`, and keeps `imdJob`, `imdSite` and `approval` as `null`. Never invent values or reuse another project’s values.

## IMD path
1. Use the published repository and production game linked above for this project. Confirm any different destination with 0xyas before changing it.
2. User funds the actual IMD job from the regular wallet verified on their own Genesis profile. No signing keys or token approvals are part of this game.
3. Give IMD `docs/IMD-JOB.md` and this source package. Preserve the working mechanics and honest provenance.
4. Record the resulting real job ID and `.imd.site` URL in `project.json` and README. Remove “not IMD-built” only after the job actually exists and completes.
5. Follow Squeekchain’s actual attribution flow and team review. Never fabricate verification meta tags or badges.

## Direct path (only if chosen instead)
1. The source is published under **salsabila2507** at the repository linked above. Keep the actual game source and README there.
2. The production game is hosted on Vercel at the URL linked above. Build and publish the tested `dist/` output when a production update is authorized. The game needs no secret environment variables.
3. Ask Squeekchain for its issued DNS record, page verification tag and exact repository README line. Add only those values.
4. Confirm all three match the same project and creator before pressing Verify.

## Before claiming ready for review
- Finish real-browser touch/keyboard/responsive QA; the current automated DOM tests do not replace it.
- Check all current board projects, including the seven not returned by the latest fetch.
- Re-run tests and live outage/sleep/block checks on the actual production origin.
- Confirm CORS access to the public API from that origin.
- Verify ownership metadata and final public source URL are the creator’s.
- Obtain Squeekchain team approval; this document is not approval.

## Finished-run update
The local update preserves real hardware validation, optimistic/settled separation and one-time observed-block encounters. Sleep is playable without synthetic RPM or seed scoring; transport failure remains frozen. Pouch pressure, bank goals and night-survival bests are browser-local game mechanics, not onchain rewards. Code lane rules were reopened at https://squeekchain.com/genesis/code; the build is pending Direct Submission verify, not IMD-built and not approved. Optional burrow checkpoint uses Sepolia SQK approve(self, 0) after a bank or Live block window and arms a local nest soft-start only. Publishing this update is a separate action from building and testing it.
