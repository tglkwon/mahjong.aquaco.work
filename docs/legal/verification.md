# Policy page verification

Date: 2026-10-05

The user confirmed that the external AI provider is undecided, the existing contact email remains, development material is kept on a personal PC, and consent/deletion procedures will be developed later.

Implemented a clearly labeled, not-yet-effective proposal on the About page in Korean, English and Japanese. Corrected the previous blanket claim that all data stays out of servers. Retention periods describe future policy, not existing timed deletion. No new collection, training, consent or deletion functionality was enabled.

Checks:

- `npx tsc --noEmit`: passed on the final source.
- `npm run build`: passed. The first sandboxed attempt failed with `spawn EPERM`; the normal-environment retry succeeded. Browserslist reported existing stale compatibility data.
- `git diff --check`: passed; Git reported line-ending conversion notices.
- Local `/about` browser inspection: Korean proposal, pending-policy banner, all retention rows and final section were present; English and Japanese selections displayed the corresponding proposal heading. Returned to Korean for the saved preview.
- Preview: `policy-preview.png`.

Changes are local only. The production site has not been deployed or changed. Before an effective privacy policy can be published, finish provider/storage/log/backup disclosures and align the consent and deletion operation with the policy. These are deferred work, not implemented by the page edit.
