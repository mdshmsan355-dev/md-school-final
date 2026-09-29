# Phase 2 completion notes

- Full school management: grades, sections, students, transfers, subjects and ordering.
- Academic-year lifecycle: create, edit, activate, close, reopen and safe delete.
- Missing score values remain incomplete; they are not converted to zero.
- Final result requires both first and second periods to be complete.
- Dense ranking is enforced: 1, 1, 2, 3, 4, 5.
- Only ranks 1–5 are top students; successful students after rank 5 are shown as successful only.
- Rank-5 ties remain rank 5.
- Result issuance stores a JSON snapshot.
- Result templates are stored per grade and result period, including the final period.
- Six approved result-card templates are available.
- Official Yemen Republic / Ministry of Education header is included in the result card and PDF.
- Login uses the supplied scenery image byte-for-byte; no image edit or overlay is applied to the asset.
- Password login, username change verification and passkey login remain separate from official result branding.
- Raw score terms are restricted to first/second; final is represented only as a result period.
- PDF generation is custom and places six cards on each A4 page.

## Verification performed in the source tree

- TypeScript/TSX parser validation passed for the changed files.
- Result calculation was executed directly from the TypeScript source and verified to produce `1, 1, 2, 3, 4, 5, 0` for seven successful students, where rank `0` means not in the top five.
- The supplied login image and the project login asset have identical SHA-256 bytes.

A full production build still requires installing the project's dependencies in the target environment because this container does not include Bun/node_modules.

## 2026-09-29 — Failed-subject result marking
- Added `failedSubjectCount` to calculated results.
- When a selected period is complete and one or more subjects are below the period pass mark, the student's failed subjects are counted.
- Failed subject score and percentage are shown with a red circular marker in the result card.
- The result summary shows `راسب في مادة واحدة`, `راسب في مادتين`, or the appropriate count when the student fails multiple subjects.
- The PDF renderer mirrors the red circle around each failed subject score and shows the same failed-subject message.
- A first-term failure does not automatically carry into the final result: the final period evaluates the combined first+second term subject total against the final pass threshold.
