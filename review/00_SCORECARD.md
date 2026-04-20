# Launch Readiness Scorecard — 2026-04-20

## Verdict: LAUNCH-BLOCKING ISSUES
## Estimated work to launch: 14 days

## Scores (1-10)
| Area            | Score | What's blocking 10/10 |
|-----------------|-------|-----------------------|
| Functionality   | 7 | Core flows exist, but interactive-vs-static parity and progress persistence gaps remain |
| Code quality    | 5 | Non-strict TS config, duplicated app surfaces, monolithic components |
| Security        | 6 | RLS present, but edge input validation/CORS hardening and abuse controls are thin |
| Phonics rigour  | 5 | Strong framework, but validator/story mismatch undermines “every word decodable” confidence |
| UX / polish     | 6 | Good skeleton, but copy-feature mismatch and weak failure states |
| Mobile          | 6 | Touch support exists; unknown real-device robustness and heavy media risk |
| Accessibility   | 5 | Some ARIA/keyboard support, but no full WCAG pass evidence |
| Performance     | 5 | 626kB JS chunk warning, image-heavy reader |
| Payments        | 7 | Stripe wired via edge functions; needs trust-state and error hardening |
| Legal (privacy/terms/GDPR) | 3 | No clear policy pages/links in reviewed route surfaces |
| Analytics       | 4 | No clear centralized analytics instrumentation footprint in reviewed surfaces |
| Error handling  | 5 | Inconsistent handling; silent degradations in some media paths |
| SEO / discoverability | 6 | Funnel/landing routes exist, but consistency and trust content need tightening |
| Marketing readiness | 6 | Positioning is strong; credibility risks from promise mismatch and inconsistent status docs |

## P0 — Blocks launch (5 items)
- [ ] Implement CI gate (build + typecheck + tests + lint + migration sanity) and enforce on main branch
- [ ] Fix failing Python tests and add launch-critical E2E (assessment → unlock → read → checkout redirect)
- [ ] Resolve app-surface ambiguity (root app vs phonics-fun-hub) and define single production source
- [ ] Resolve phonics QA reliability gap (story format + validator compatibility + policy enforcement)
- [ ] Align “interactive books” marketing claims with actual per-book experience (no silent downgrade without clear user expectation)

## P1 — Fix in launch week (10 items)
- [ ] Increase TS strictness and address resulting defects
- [ ] Add robust edge-function input validation and request abuse controls
- [ ] Persist live reading progress and completion events from readers
- [ ] Add reader media/network error states and retry affordances
- [ ] Reduce JS bundle size and optimize media loading strategy
- [ ] Replace/clarify personalised claims if personalised flow is reverted
- [ ] Add privacy/terms links at all data-capture and checkout entry points
- [ ] Reconcile curriculum/status inconsistencies across docs and surfaced copy
- [ ] Add better parent-facing explanation of assessment confidence and recommendations
- [ ] Replace placeholder-style social proof with verifiable testimonials or remove

## P2 — Post-launch (8 items)
- [ ] Refactor monolithic interactive reader into smaller tested modules
- [ ] Consolidate one-off generation scripts into reusable pipeline commands
- [ ] Add richer analytics event schema and dashboarding
- [ ] Add reader deep-linking and resume URLs
- [ ] Add low-bandwidth mode for image-heavy reading sessions
- [ ] Improve explicit PSC-format signalling where desired
- [ ] Expand accessibility QA to full keyboard/screen-reader/contrast matrix
- [ ] Build external validation studies for assessment placement accuracy

## Three biggest risks an investor will flag
1. The headline educational claim (“every word decodable/tricky-word compliant”) is not currently protected by a clearly reliable automated gate.
2. Product surface complexity and duplication (two app footprints) increases execution and maintenance risk near launch.
3. Trust layer (legal pages, validated testimonials, robust error handling) is undercooked for paid family product launch.

## Three things that will most impress an investor
1. Strong integrated product thesis: pedagogy + culture + digital interactivity + printable assets in one platform.
2. Real technical breadth already built (adaptive assessment, Supabase schema with RLS, Stripe flows, interactive reader engine).
3. Clear curriculum architecture and content pipeline foundation that can scale once QA governance is tightened.
