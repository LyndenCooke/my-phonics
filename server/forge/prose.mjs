// Deterministic prose checks on the finished story text.
//
// Capitalisation and terminal punctuation are MECHANICAL — they need a
// regex, not a language model. A decodability rewrite once returned a whole
// book in lower case ("in the kitchen, she set dates...") and it shipped,
// because nothing checked. Anything that can be fixed without judgement is
// fixed here; anything that needs judgement is reported for the QA gate.

const ABBREVIATIONS = ["Mr", "Mrs", "Ms", "Dr", "St"];

// Family words are proper nouns when used AS a name ("First, Mum set a bowl",
// "Nani sat with Amira, Mum, and the cups") and common nouns when they follow
// a determiner ("her mum", "the nani"). Capital letters for names of people
// are taught at Level 3, so a book printing "mum" as a name is teaching the
// child the wrong thing (spotted in the Level 7 book, 2026-07-26).
const FAMILY_WORDS = [
  "mum", "mummy", "mam", "mama", "dad", "daddy", "papa", "baba",
  "nani", "nana", "dadi", "dada", "granny", "grandma", "grandad", "grandpa",
  "auntie", "aunty", "uncle", "bibi", "teta", "yaya",
];
const DETERMINERS = /\b(my|your|his|her|their|our|its|the|a|an|this|that|every|each)$/i;

function capitaliseFamilyNames(text) {
  return text.replace(new RegExp(`\\b(${FAMILY_WORDS.join("|")})\\b`, "gi"), (word, _w, offset) => {
    const before = text.slice(Math.max(0, offset - 12), offset).trimEnd();
    if (DETERMINERS.test(before)) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

// Split into sentences on terminal punctuation, keeping the punctuation.
// Quotes are common in these books ("Oh no!" said Mum.) so a closing quote or
// bracket may follow the terminator.
function sentencesOf(text) {
  const raw = String(text)
    .split(/(?<=[.!?]["'”’)]?)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Re-join speech attribution onto the speech it belongs to, so
  // '"I can!" she said.' counts as ONE sentence rather than two — otherwise
  // every line of dialogue inflates the sentence count and trips the
  // lower-case check on "she".
  const out = [];
  for (const part of raw) {
    const prev = out[out.length - 1];
    // A fragment inside an UNCLOSED quote is still mid-speech: '"Dad! Dad!"
    // Zaid yells.' split into '"Dad!' + 'Dad!"…' and the two one-word
    // "sentences" tripped every length check once dialogue unlocked at L3
    // (2026-08-24). Merge until the quotes balance.
    if (prev && (prev.match(/["“”]/g) || []).length % 2 === 1) {
      out[out.length - 1] = `${prev} ${part}`;
      continue;
    }
    if (prev && endsInQuote(prev) && (ATTRIBUTION.test(part) || NAME_ATTRIBUTION.test(part))) {
      out[out.length - 1] = `${prev} ${part}`;
    } else {
      out.push(part);
    }
  }
  return out;
}

// Name-first attribution after speech ('"Dad!" Zaid yells.') is the natural
// form below Level 5, where "said" is not yet a taught tricky word. Join-only:
// fixMechanics' lower-casing keeps using ATTRIBUTION, so names stay capital.
const NAME_ATTRIBUTION = /^[A-Z][a-z']* (said|says|asked|asks|yelled|yells|called|calls|cried|cries|shouted|shouts|replied|replies|whispered|whispers|told|tells|grinned|grins|laughed|laughs)\b/;

// Speech attribution is NOT a new sentence. '"I can do it!" said Cerys.' is
// one sentence: the ! belongs to the speech, and "said" stays lower case. The
// splitter treats !" as a boundary, so without this the auto-capitaliser
// produced '"I can do it!" Says Cerys.' — teaching the wrong thing on a page
// about capital letters (spotted in the Wales book, 2026-07-26).
const ATTRIBUTION = /^(said|says|say|asked|asks|called|calls|cried|cries|shouted|shouts|replied|replies|whispered|whispers|grinned|grins|smiled|smiles|laughed|laughs|he|she|they|we)\b/i;

function endsInQuote(sentence) {
  return /["'”’]\s*$/.test(sentence);
}

// First letter that can carry a capital, skipping opening quotes/brackets.
function firstLetterIndex(sentence) {
  for (let i = 0; i < sentence.length; i++) {
    if (/[A-Za-z]/.test(sentence[i])) return i;
    if (!/["'“”‘’(\s—-]/.test(sentence[i])) return -1;
  }
  return -1;
}

// Fix what is unambiguously formatting: sentence-initial capitals, the
// pronoun I, and the child's name wherever it appears.
export function fixMechanics(text, childName) {
  const parts = sentencesOf(text);
  let out = parts
    .map((s, idx) => {
      const i = firstLetterIndex(s);
      if (i < 0) return s;
      // Attribution after speech continues the sentence — lower case it.
      if (idx > 0 && endsInQuote(parts[idx - 1]) && ATTRIBUTION.test(s.slice(i))) {
        return s.slice(0, i) + s[i].toLowerCase() + s.slice(i + 1);
      }
      return s.slice(0, i) + s[i].toUpperCase() + s.slice(i + 1);
    })
    .join(" ");
  out = out.replace(/\bi\b/g, "I");
  out = capitaliseFamilyNames(out);
  if (childName) {
    const safe = childName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\b${safe}\\b`, "gi"), childName);
  }
  return out;
}

// Report what a regex can prove is wrong. `allowed` is the level's cumulative
// punctuation list from reading_progression.json.
export function checkProse({ pages, childName, level, progression }) {
  const issues = [];
  const allowed = progression?.punctuation || [];
  const mayUseComma = allowed.some((p) => p.includes("comma"));
  const mayUseApostrophe = allowed.some((p) => p.includes("apostrophe"));
  const mayUseQuestion = allowed.includes("?");
  const mayUseExclamation = allowed.includes("!");

  const allSentences = [];
  pages.forEach((text, idx) => {
    const page = idx + 1;
    const sentences = sentencesOf(text);
    allSentences.push(...sentences);

    for (const s of sentences) {
      const i = firstLetterIndex(s);
      if (i >= 0 && s[i] !== s[i].toUpperCase()) {
        issues.push({ page, type: "capital", detail: `sentence starts lower case: "${s.slice(0, 40)}"` });
      }
      if (!/[.!?]["'”’)]?$/.test(s)) {
        issues.push({ page, type: "terminator", detail: `sentence has no . ? or !: "${s.slice(0, 40)}"` });
      }
    }
    if (!mayUseQuestion && text.includes("?")) {
      issues.push({ page, type: "punctuation", detail: "question mark is not taught until Level 3" });
    }
    if (!mayUseExclamation && text.includes("!")) {
      issues.push({ page, type: "punctuation", detail: "exclamation mark is not taught until Level 4" });
    }
    if (!mayUseComma && text.includes(",")) {
      issues.push({ page, type: "punctuation", detail: `comma used at Level ${level}, before commas are taught` });
    }
    // "comma (repetition only)" licenses ONLY "sip, sip, sip" — but the bare
    // .includes("comma") test above let it license every comma at every level
    // (a clause-joining comma sailed through a Level 3 check, 2026-08-24).
    // Until list commas are taught, any comma whose neighbours differ is wrong.
    if (mayUseComma && !allowed.some((p) => p.includes("commas in a list") || p.includes("fronted"))) {
      for (const m of text.matchAll(/([A-Za-z']+)\s*,\s*([A-Za-z']+)/g)) {
        if (m[1].toLowerCase() === m[2].toLowerCase()) continue;
        // A vocative comma ("Mum, is the rod in the shed?") is correct English
        // — the flag is house punctuation policy (commas wait for Level 5),
        // not a grammar error, and the message should say so (2026-08-25).
        const vocative = /^[A-Z]/.test(m[1]);
        issues.push({
          page, type: "punctuation",
          detail: vocative
            ? `comma after a name ("${m[1]}, …") — correct English, but commas beyond the repetition comma are house-reserved until commas in a list are taught`
            : `comma joins different words ("${m[1]}, ${m[2]}") — only the repetition comma ("sip, sip") is taught at Level ${level}`,
        });
      }
    }
    // Never taught at ANY level — a minimal-prompt test produced a Level 3
    // page with a semicolon and nothing flagged it (2026-08-24).
    for (const [ch, name] of [[";", "semicolon"], [":", "colon"], ["—", "dash"], ["(", "brackets"]]) {
      if (text.includes(ch)) issues.push({ page, type: "punctuation", detail: `${name} used — not taught at any level of these books` });
    }
    if (!mayUseApostrophe && /[''’]/.test(text)) {
      issues.push({ page, type: "punctuation", detail: `apostrophe used at Level ${level}, before apostrophes are taught` });
    }
    // DETERMINISTIC LANGUAGE BLOCKLIST (2026-08-25): patterns every judge has
    // now waved through at least once. Regex, not judgement.
    // "No Mum is at the shops" / "No tin bug is on the rug" — the unnatural
    // negative: nobody says it; write "The tin bug is not on the rug" or "No
    // tin bug!".
    for (const m of text.matchAll(/\bNo\s+([a-z]+\s+)?[a-z]+\s+is\s+(at|on|in|by)\b/gi)) {
      issues.push({ page, type: "language", detail: `unnatural negative ("${m[0]}…") — write "X is not …" or "No X!"` });
    }
    // "Dad is at the shrub" — a parent parked as a location marker is safety
    // wallpaper, not narration (appeared twice in one book, 2026-08-25).
    for (const m of text.matchAll(/\b(Mum|Dad|Mam|Nan|Nana|Gran|Grandad|Grandma)\s+is\s+(at|by|on|in|with)\s+\w/g)) {
      issues.push({ page, type: "language", detail: `parent parked as scenery ("${m[0]}…") — a parent in the text must act; presence belongs in the picture` });
    }

    if (progression) {
      const [minS, maxS] = progression.sentences_per_page;
      if (sentences.length < minS || sentences.length > maxS) {
        issues.push({
          page, type: "length",
          detail: `${sentences.length} sentence(s); Level ${level} expects ${minS}-${maxS}`,
        });
      }
      const [minW, maxW] = progression.words_per_sentence;
      for (const s of sentences) {
        const words = s.split(/\s+/).filter(Boolean).length;
        if (words < Math.max(2, minW - 3) || words > maxW + 4) {
          issues.push({
            page, type: "length",
            detail: `${words}-word sentence; Level ${level} expects about ${minW}-${maxW}`,
          });
        }
      }
    }
  });

  // Whole-book checks
  const text = pages.join(" ");
  if (childName) {
    const lower = new RegExp(`(^|[^A-Za-z])${childName.toLowerCase()}\\b`);
    if (lower.test(text) && !new RegExp(`\\b${childName}\\b`).test(text)) {
      issues.push({ page: 0, type: "capital", detail: `the name ${childName} appears in lower case` });
    }
  }
  const opener = (s) => (s.match(/[A-Za-z']+/) || [""])[0].toLowerCase();
  if (allSentences.length >= 4) {
    const counts = {};
    for (const s of allSentences) counts[opener(s)] = (counts[opener(s)] || 0) + 1;
    const [word, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (n > allSentences.length / 2) {
      issues.push({
        page: 0, type: "variety",
        detail: `${n} of ${allSentences.length} sentences start with "${word}"`,
      });
    }
  }
  const tense = { past: 0, present: 0 };
  if (/\b(was|were|had|said|went|got|made)\b/.test(text)) tense.past = 1;
  if (/\b(is|are|has|says|goes|gets|makes)\b/.test(text)) tense.present = 1;
  if (tense.past && tense.present) {
    issues.push({ page: 0, type: "tense", detail: "past and present tense both used across the book" });
  }

  return issues;
}
