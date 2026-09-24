# Site translation (i18n)

Grown-up text is translated into 10 languages; **reading content never is.**

| code | language | dir |
|---|---|---|
| en | English (source) | ltr |
| ar | Arabic | **rtl** |
| zh | Chinese (Simplified) | ltr |
| hi | Hindi | ltr |
| bn | Bengali | ltr |
| ur | Urdu | **rtl** |
| id | Indonesian | ltr |
| fa | Persian | **rtl** |
| tr | Turkish | ltr |
| sw | Swahili | ltr |
| ha | Hausa | ltr |

Language is picked automatically from `?lang=xx` → the saved choice
(`localStorage["mpb:lang"]`) → the browser language → English. Parents
switch with `<LanguageSwitcher />` (translate icon + native name), which sits in
every header/sidebar. `<html lang dir>` is updated automatically.

## What gets translated — and what never does

**Translate** (anything a child does not need to read): navigation, buttons,
headings, marketing copy, explanations for parents/teachers, form labels,
placeholders, validation + toast messages, empty states, dialogs, aria-labels,
`title=` tooltips, alt text for decorative/explanatory images, parent tips,
progress/report explanations, pricing/support copy, legal pages.

**Never translate — keep English and render inside `dir="ltr" lang="en"`:**
- book titles, story text, character names inside stories
- sounds, graphemes, phonemes (`ai`, `/sh/`, "Set 2"), green words, tricky
  words, story words, word lists, assessment items the CHILD reads aloud
- in-game play text (the words/letters a child taps, game HUD a child reads)
- level NAMES/numbers used as product labels ("Level 3", "L4.2") may be
  translated as "Level" → the word only; the number stays
- the brand "MyPhonicsBooks", product names like "Create-A-Book", "World of
  Books" (translate the descriptive text around them, not the name — but
  nav labels like "Create a Book" / "World of Books" ARE translated as
  normal UI labels)
- email addresses, URLs, codes (`TPT-TEACHERS`), prices/currency symbols

Wrap child-reading blocks that appear on a translated page with
`<EnglishOnly>` (`src/i18n/EnglishOnly.tsx`) or add `dir="ltr" lang="en"`.

## How to write it

```tsx
import { useTranslation, Trans } from 'react-i18next';

const { t } = useTranslation('landing');           // page namespace
t('hero.title')                                    // landing:hero.title
t('common:actions.signIn')                         // shared strings
t('hero.booksCount', { count: n })                 // plural: key_one / key_other
t('greeting', { name })                            // "Hi {{name}}"
<Trans t={t} i18nKey="hero.body" components={{ b: <strong />, link: <Link to="/x" /> }} />
// en: "Read <b>free</b> books or <link>take the check</link>."
```

- One namespace per page / feature → `src/i18n/locales/en/<ns>.json`.
  Namespaces are lazy-loaded; `common` is bundled.
- Keys: nested, camelCase, by section (`hero.title`, `faq.q1`, `form.email`).
- Keep interpolation placeholders `{{name}}` and `<tag>` markers intact.
- Module-level constants (arrays of cards, FAQ lists) with English strings:
  either move the text into the JSON and build the array inside the
  component with `t()`, or keep ids in the constant and look up
  `t(\`faq.${id}.q\`)`. `t()` must be called during render, not at import.
- Data files shared with non-UI code (`src/lib/*.ts`): don't restructure —
  in the component call `t(\`levels.${id}.blurb\`, { defaultValue: item.blurb })`.
- Plurals: `key_one`, `key_other` (i18next v23+ suffixes). Other languages
  add their own forms (`_zero`, `_two`, `_few`, `_many`) when translated.
- Dates/numbers: `new Intl.DateTimeFormat(i18n.language, …)` rather than
  hard-coded `'en-GB'`, unless the output is stored/sent somewhere.

## RTL (Arabic, Urdu, Persian)

Prefer Tailwind logical utilities in anything you touch:
`ms-/me-` (not `ml-/mr-`), `ps-/pe-`, `start-/end-` (not `left-/right-`),
`text-start/text-end`, `border-s/border-e`, `rounded-s/rounded-e`.
Directional icons (ChevronRight = "next", ArrowLeft = "back") get
`className="… rtl:-scale-x-100"`. Centred layouts need nothing.
Don't flip: media controls, progress through a book (books are English → LTR),
logos, charts.
