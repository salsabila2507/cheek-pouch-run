# Publication and ownership checklist

Current state: built and tested; **publicly hosted**, **not submitted**, **not IMD-built**. No Squeekchain verification or team approval is claimed.

- Public repository: https://github.com/salsabila2507/cheek-pouch-run
- Production game: https://cheek-pouch-run.vercel.app
- Creator: **0xyas**; GitHub account and commit identity: **salsabila2507**.

Source publication and Vercel hosting do not supply a verified wallet, an IMD job ID, an issued page tag or approval. `project.json` records the public repository and live URL, keeps verification `not-submitted`, and keeps `imdJob`, `imdSite`, `issuedPageTag` and `approval` as `null`. Never invent these values or reuse another project’s values.

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
The local update preserves real hardware validation, optimistic/settled separation and one-time observed-block encounters. Sleep is playable without synthetic RPM or seed scoring; transport failure remains frozen. Pouch pressure, bank goals and night-survival bests are browser-local game mechanics, not onchain rewards. Code lane rules were reopened at https://squeekchain.com/genesis/code; the build is still not submitted, not IMD-built and not approved. Publishing this update is a separate action from building and testing it.
