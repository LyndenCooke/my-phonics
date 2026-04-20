# Pass 4 — Product / UX Review

## Method note

I started the dev server (`npm run dev`) and confirmed it serves locally, but this environment does not include an interactive browser session for true click-through usability testing. Therefore:
- **Verified:** route/copy/flow logic from source code.
- **Suspect:** runtime micro-interaction quality and visual polish under real-device touch.

Dev server evidence: Vite served at `http://localhost:8080/`.

---

## Customer journey walkthrough (parent of a 4-year-old)

## 1) Landing page

### What works
- Strong above-the-fold CTA pair (“Start Free Assessment” + “Try a Free Book”). `src/pages/LandingPage.tsx:141-149`.
- Clear high-level value narrative and visual appeal.

### Friction / risk
- **P1 copy mismatch:** claims “Personalised decodable books,” while product direction says personalised flow was reverted and books are universal templates. `src/pages/LandingPage.tsx:139`, `.claude/brand-voice-guidelines.md:107-110`.
- **P1 trust risk:** testimonials/social proof appear hardcoded placeholders, not evidently verified customer proof. `src/pages/LandingPage.tsx:361-369`.
- **P1 voice mismatch:** brand guidelines forbid salesy language and mention avoiding certain positioning terms; some landing language feels more growth-marketing than “teacher at pickup time.” `.claude/brand-voice-guidelines.md:10-23,35-40`.

## 2) Assessment funnel

### What works
- Adaptive assessment has clear stage model and progression logic. `src/pages/Assessment.tsx:38-40,108-191`.
- Child-level feedback and progress visuals are present.

### Friction / risk
- **P1:** likely long cognitive flow for a 4-year-old if parent is not coached live.
- **P1:** outcome communication quality depends on final explanation quality; algorithm confidence is not shown in parent-facing uncertainty terms.

## 3) Library / Shop

### What works
- Level filtering and lock/unlock framing are straightforward. `src/pages/Index.tsx:304-312`, `src/components/BookCard.tsx`.
- Upsell modal contextually tied to selected locked book. `src/pages/Index.tsx:325-359`.

### Friction / risk
- **P1:** value clarity for “what exactly I get now vs after checkout” could be sharper in modal and shop.
- **P1:** product catalog and curriculum status inconsistencies can leak into user trust if surfaced.

## 4) Interactive book experience (flagship)

### What works
- Dedicated interactive reader with multiple pedagogical page types and word-level tap interactions. `src/components/InteractiveBookReader.tsx:926-945`, `src/components/interactive/TappableWord.tsx:229-255`.

### Friction / risk
- **P0 claim gap:** marketing says “tap any word” and “interactive reading”; fallback reader for books without interactive data is static JPG pages (no per-word interaction). `src/pages/Index.tsx:246-268`, `src/components/BookReader.tsx:140-147`.
- **P1 flaky connection risk:** no explicit user-facing retry/placeholder states for image/audio failures in interactive mode.
- **P1 offline behaviour risk:** word blend uses browser `speechSynthesis`; offline/voice availability quality will vary by device/browser. `src/components/interactive/TappableWord.tsx:21-31`.

## 5) Personalised book flow (reverted)

### Verified finding
- I found no explicit personalised-book route in current app router.
- However, lingering copy still promises personalisation (“Personalised decodable books”). `src/pages/LandingPage.tsx:139`.

### Risk
- **P1:** orphaned promise (even if no dead link) creates expectation debt.

## 6) Sign-in / account

### What works
- Guest browsing and sign-in prompts are integrated in library and shop. `src/pages/Index.tsx:308-333`, `src/pages/Shop.tsx:232-244`.

### Friction / risk
- **P1:** account creation timing may feel late (guest checkout + magic-link patterns across flows); needs one canonical “why create account now” message.

## 7) Purchase

### What works
- Stripe checkout session creation implemented; provider is Stripe.
- Free sample and paid path differentiated. `supabase/functions/create-checkout-session/index.ts:55-175`.

### Friction / risk
- **P1:** failure states rely mostly on returned error strings and toast handling.
- **P1:** lack of visible trust/legal surface at checkout entry points (privacy/terms).

---

## Positioning & copy

### Verdict
- The intended brand voice is strong and documented.
- Production copy is mostly clear but currently inconsistent with product reality in at least one key promise (personalisation).

### Severity
- **P1:** copy-product mismatch must be corrected before investor demo.

---

## Mobile & accessibility quickspot (code-level)

### Positives
- Reader includes keyboard navigation and touch/swipe handling. `src/components/InteractiveBookReader.tsx:902-922`.
- ARIA labels present on major nav buttons. `src/components/InteractiveBookReader.tsx:952,961-963`.

### Gaps
- **P1:** no clear fallback messaging for failed media fetch in interactive pages.
- **P1:** touch-zone/navigation affordance may be unclear for youngest users on small screens in static reader; invisible tap zones can be confusing. `src/components/BookReader.tsx:176-185`.
- **P1:** no clear evidence of full keyboard/focus-visible audit and WCAG AA contrast audit across all pages.

---

## Prioritised UX punch list

### P0
1. Resolve interactive promise mismatch: either ensure all surfaced books are fully interactive or clearly label static-reader books.

### P1
1. Remove/replace personalisation claims if feature is reverted.
2. Add resilient error states for image/audio/network failures in reader.
3. Tighten assessment completion UX for busy parents (time expectation + progress reassurance).
4. Add privacy/terms links at all data-capture and checkout initiation points.
5. Replace placeholder-style testimonials with verifiable social proof or remove.

### P2
1. Add deeper child-first affordances (audio UI hints, calmer transitions, optional narration pacing controls).

---

## 5 concrete conversion-rate improvements

1. **Single source CTA hierarchy:** unify top CTA across landing/funnel to one primary action (“Find your child’s level”).
2. **Expectation card before assessment:** show time, what parent must do, what they get at end.
3. **Post-result offer clarity:** explicit “You unlock X now, and can add Y later.”
4. **Trust strip near checkout CTA:** curriculum basis, no card for free flow, data privacy line.
5. **Outcome-led social proof:** short measurable parent outcomes tied to level movement rather than generic praise.
