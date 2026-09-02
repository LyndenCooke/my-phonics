import { describe, it, expect } from "vitest";
// The forge's deterministic decodability gate. It is plain Node ESM and
// reads the canonical curriculum JSON, so it runs here with no provider
// keys and no spend.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — untyped .mjs module
import { allLevels, decodeProblems, getLevel, isFutureSoundProblem } from "../../server/forge/phonics.mjs";

type Level = { level: number; graphemes: string[]; cumulative: string[]; trickyWords: string[]; storyPages: number };
const levels: Level[] = allLevels();

/**
 * Every case below is an incident from the forge's history (see the comments
 * in server/forge/phonics.mjs): a word that shipped in a customer book, or
 * killed a finished PDF at typeset, before the gate learned to catch it.
 * Until now those lessons lived only in comments. CI now refuses to forget.
 */
describe("decodeProblems — words that must be caught", () => {
  const caught = (word: string, level: number) => decodeProblems([word], level);

  it("window at Level 3: 'ow' is a Level 4 sound (shipped in a customer book, 2026-08-24)", () => {
    const p = caught("window", 3);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatch(/"ow"/);
    expect(isFutureSoundProblem(p[0])).toBe(true);
  });

  it("by at Level 3: word-final y says /igh/, not /y/ (shipped 2026-08-24)", () => {
    expect(caught("by", 3)).toHaveLength(1);
    expect(caught("happy", 3)).toHaveLength(1);
  });

  it("buys at Level 3: uy is a dishonest spelling, never a future sound", () => {
    const p = caught("buys", 3);
    expect(p).toHaveLength(1);
    expect(isFutureSoundProblem(p[0])).toBe(false);
  });

  it("market at Level 4: unstressed e is not honestly decodable (killed a PDF, 2026-08-22)", () => {
    const p = caught("market", 4);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatch(/not honestly decodable/);
  });

  it("takes at Level 4: magic-e is taught at Level 5 (external review, 2026-08-25)", () => {
    const p = caught("takes", 4);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatch(/a-e/);
    expect(isFutureSoundProblem(p[0])).toBe(true);
    expect(caught("takes", 5)).toHaveLength(0);
  });

  it("opened at Level 3: the -ed ending is taught at Level 4 (external review, 2026-08-25)", () => {
    expect(caught("opened", 3)).toHaveLength(1);
    expect(caught("opened", 4)).toHaveLength(0);
    // Honest e+d words keep their short e at every level.
    expect(caught("bed", 2)).toHaveLength(0);
    expect(caught("shed", 3)).toHaveLength(0);
  });

  it("the all-family says /or/: call is caught, shall is honest, all is tricky from Level 4", () => {
    expect(caught("call", 3)).toHaveLength(1);
    expect(caught("shall", 3)).toHaveLength(0);
    expect(caught("all", 4)).toHaveLength(0);
  });

  it("the want-family says /o/: was is caught until it becomes a tricky word", () => {
    expect(caught("was", 3)).toHaveLength(1);
    expect(caught("was", 4)).toHaveLength(0);
  });

  it("ship at Level 2: sh is a Level 3 sound, and a previewable future sound", () => {
    const p = caught("ship", 2);
    expect(p).toHaveLength(1);
    expect(isFutureSoundProblem(p[0])).toBe(true);
    expect(caught("ship", 3)).toHaveLength(0);
  });
});

describe("decodeProblems — words that must pass", () => {
  it("accepts the first Level 1 words a child ever reads", () => {
    expect(decodeProblems(["sat", "pin", "tap", "dog", "mat"], 1)).toHaveLength(0);
  });

  it("exempts the hero's name, and only the hero's name", () => {
    expect(decodeProblems(["Zofia"], 1, { heroName: "Zofia" })).toHaveLength(0);
    expect(decodeProblems(["Zofia"], 1)).toHaveLength(1);
  });

  it("treats family words as people, not practice words", () => {
    expect(decodeProblems(["mum", "dad"], 1)).toHaveLength(0);
    expect(decodeProblems(["mum"], 1, { allowPeople: false })).toHaveLength(1);
  });

  it("honours a borrowed tricky word in page text only", () => {
    expect(decodeProblems(["was"], 3, { borrow: ["was"] })).toHaveLength(0);
    expect(decodeProblems(["was"], 3)).toHaveLength(1);
  });

  it("reads a Level 5 book's split digraphs", () => {
    expect(decodeProblems(["cake", "time", "home", "cube"], 5)).toHaveLength(0);
  });
});

describe("curriculum data the forge is built on", () => {
  it("exposes eight levels, each with its own sounds and tricky words", () => {
    expect(levels.map((l) => l.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const l of levels) {
      expect(l.graphemes.length, `Level ${l.level} graphemes`).toBeGreaterThan(0);
      expect(Array.isArray(l.trickyWords), `Level ${l.level} tricky`).toBe(true);
    }
  });

  it("makes the sound ladder cumulative: nothing taught is ever un-taught", () => {
    for (let i = 1; i < levels.length; i++) {
      const prev = new Set(levels[i - 1].cumulative);
      for (const g of prev) expect(levels[i].cumulative, `Level ${levels[i].level} lost "${g}"`).toContain(g);
      for (const g of levels[i].graphemes) expect(levels[i].cumulative, `Level ${levels[i].level} missing own "${g}"`).toContain(g);
    }
  });

  it("only ever asks for a saddle-stitchable story length (6 or 8 pages)", () => {
    for (const l of levels) expect([6, 8], `Level ${l.level}`).toContain(l.storyPages);
  });

  it("rejects a level that does not exist", () => {
    expect(getLevel(9)).toBeNull();
    expect(decodeProblems(["anything"], 9)).toHaveLength(0);
  });
});
