import { describe, it, expect } from "vitest";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — untyped .mjs module
import { wordsOf, audioPlan, estimateUsd } from "../../server/forge/audio.mjs";

const pages = [
  { type: "cover", title: "Zofia and the Red Sled" },
  { type: "story", text: "Zofia has a red sled. It is a big sled!" },
  { type: "story", text: "\"Shh,\" said Mum. The sled's bell rang." },
  { type: "profile", name: "Zofia" },
];

describe("wordsOf", () => {
  it("collects each spoken word once, keyed lower-case, keeping the first casing for the voice", () => {
    const words = wordsOf(pages);
    expect(words.get("zofia")).toBe("Zofia");
    expect(words.get("sled")).toBe("sled");
    expect(words.has("shh")).toBe(true);
    expect(words.get("sled's")).toBe("sled's");
    expect([...words.keys()]).not.toContain("");
  });

  it("ignores the cover and profile pages", () => {
    expect(wordsOf([{ type: "cover", title: "Not Spoken" }]).size).toBe(0);
  });
});

describe("audioPlan", () => {
  it("records every sentence and word for a silent book", () => {
    const plan = audioPlan(pages);
    expect(plan.sentences.map((s: { index: number }) => s.index)).toEqual([1, 2]);
    expect(plan.words.length).toBe(wordsOf(pages).size);
  });

  it("records only what is missing on a second run", () => {
    const partly = pages.map((p, i) => (i === 1
      ? { ...p, audio: { sentence: "/s-1.mp3", words: { zofia: "/w-zofia.mp3", has: "/w-has.mp3" } } }
      : p));
    const plan = audioPlan(partly);
    expect(plan.sentences.map((s: { index: number }) => s.index)).toEqual([2]);
    const keys = plan.words.map((w: { key: string }) => w.key);
    expect(keys).not.toContain("zofia");
    expect(keys).not.toContain("has");
    expect(keys).toContain("bell");
  });

  it("re-records everything when forced", () => {
    const done = pages.map((p) => (p.type === "story" ? { ...p, audio: { sentence: "x", words: { a: "y" } } } : p));
    expect(audioPlan(done, { force: true }).sentences.length).toBe(2);
  });
});

describe("estimateUsd", () => {
  it("prices a whole six-page book in pennies, not pounds", () => {
    const words = [...wordsOf(pages).values()];
    const sentences = pages.filter((p) => p.type === "story").map((p) => p.text as string);
    const total = words.reduce((t, w) => t + estimateUsd(w, "eleven_turbo_v2_5"), 0)
      + sentences.reduce((t, s) => t + estimateUsd(s, "eleven_multilingual_v2"), 0);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(0.05);
  });
});
