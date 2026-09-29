# Md School — Release Checklist

## Implemented in this release candidate

- [x] School, student, grade, section, subject and academic-year management.
- [x] Student editing and movement between grades/sections.
- [x] Subject editing, deletion and atomic reordering.
- [x] First/second term raw scores only; final is calculated from both terms.
- [x] Empty score is distinct from zero.
- [x] Term pass threshold and configurable score limits.
- [x] Final subject pass threshold is two times the term threshold.
- [x] First-term failed subjects are highlighted with a red circle in result cards and PDF.
- [x] Status text: ناجح / راسب في مادة... / غير مكتمل.
- [x] Dense ranking: 1، 1، 2، 3، 4، 5.
- [x] Only ranks 1–5 are official top ranks; later successful students are simply ناجح.
- [x] Top-student display is limited to the first term in the results/report views and result cards.
- [x] Six result templates: three children + three formal, with non-pink/non-purple third colors.
- [x] Yemen Republic emblem and official header in result documents.
- [x] Custom A4 PDF generation with six cards per page.
- [x] Result issuance snapshots.
- [x] Closed academic-year protection for grades/sections/subjects/enrollments/scores.
- [x] Username/password login, recovery email and Passkey/fast login.
- [x] Username changes require current-password verification.
- [x] Tenant RLS policies for school isolation.
- [x] Login background is the exact user-supplied scenery asset (SHA-256: `dc81ad8a4617b189510a0be9205cf90b1ce7a71128b425912a5d3a47b8f060f1`).
- [x] PWA manifest, install icons, service worker and install prompt.
- [x] Capacitor configuration and Android scripts prepared.

## Verified in this environment

- [x] Release scenario script passes.
- [x] Static security audit passes.
- [x] PWA manifest is valid JSON.
- [x] Login background hash matches the supplied image.

## Must be performed in the real deployment environment before official school use

1. Apply every SQL migration to the production Supabase project in order.
2. Deploy both Edge Functions and set their server secrets.
3. Enable/configure Supabase Passkeys and the production WebAuthn RP ID/domain.
4. Set production `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Run the full build and lint with dependencies installed.
6. Execute a real two-school RLS isolation test.
7. Execute the complete school workflow with at least 10 students and real scores.
8. Verify the ranking fixture produces 1، 1، 2، 3، 4، 5 and later students show only ناجح.
9. Verify first-term failed subjects are circled in both browser preview and PDF.
10. Verify PDF on a physical printer and an Android device.
11. Publish over HTTPS and test Passkey with the target Android devices.
12. Run `npx cap add android`, `npx cap sync`, then build the signed APK/AAB in Android Studio.

The application is a **release candidate** until these deployment-specific checks are completed; code inspection alone cannot prove a production Supabase project or a physical Android device works correctly.
