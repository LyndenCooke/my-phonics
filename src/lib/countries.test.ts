import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { COUNTRIES, countryByName, flagUrl } from "./countries";
import { LIBRARY_WORLD, libraryCoverUrl, libraryJourneyLevel } from "./libraryWorld";
import { JOURNEY_LEVEL_COUNT } from "./levels8";

/**
 * The World of Books globe can only place a book whose country is in the
 * shared registry. Before the registry existed, a mis-typed country in the
 * library list or the wizard silently fell off the planet into an "Also
 * from ..." footnote. These tests make that a build failure instead.
 */
describe("country registry", () => {
  it("has unique names and ISO codes", () => {
    const names = COUNTRIES.map((c) => c.name);
    const isos = COUNTRIES.map((c) => c.iso);
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(isos).size).toBe(isos.length);
  });

  it("uses lower-case two-letter ISO codes so flag artwork resolves", () => {
    for (const c of COUNTRIES) {
      expect(c.iso, c.name).toMatch(/^[a-z]{2}$/);
      expect(flagUrl(c.name)).toBe(`https://flagcdn.com/w40/${c.iso}.png`);
    }
  });

  it("places every pin on the planet", () => {
    for (const c of COUNTRIES) {
      const [lon, lat] = c.at;
      expect(lon, `${c.name} longitude`).toBeGreaterThanOrEqual(-180);
      expect(lon, `${c.name} longitude`).toBeLessThanOrEqual(180);
      expect(lat, `${c.name} latitude`).toBeGreaterThanOrEqual(-85);
      expect(lat, `${c.name} latitude`).toBeLessThanOrEqual(85);
    }
  });

  it("gives every country an emoji flag, never a bare letter pair", () => {
    for (const c of COUNTRIES) {
      // Two regional-indicator symbols.
      expect(Array.from(c.flag).length, c.name).toBe(2);
      expect(c.flag, c.name).toMatch(/^[\u{1F1E6}-\u{1F1FF}]{2}$/u);
    }
  });

  it("returns nothing for a country it does not know", () => {
    expect(countryByName("Atlantis")).toBeNull();
    expect(flagUrl("Atlantis")).toBeNull();
  });
});

describe("library books on the globe", () => {
  it("every library book points at a country the globe can place", () => {
    for (const b of LIBRARY_WORLD) {
      const c = countryByName(b.country);
      expect(c, `${b.title} (${b.legacySub}) → ${b.country}`).not.toBeNull();
      expect(b.flag, `${b.title} flag`).toBe(c!.flag);
    }
  });

  it("has one entry per book and one slug per book", () => {
    const subs = LIBRARY_WORLD.map((b) => b.legacySub);
    const slugs = LIBRARY_WORLD.map((b) => b.slug);
    expect(new Set(subs).size).toBe(subs.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("ships a cover image for every pinned book", () => {
    for (const b of LIBRARY_WORLD) {
      const file = path.join(process.cwd(), "public", libraryCoverUrl(b));
      expect(fs.existsSync(file), `${b.title}: ${libraryCoverUrl(b)}`).toBe(true);
    }
  });

  it("lands every book on a real journey level", () => {
    for (const b of LIBRARY_WORLD) {
      const lv = libraryJourneyLevel(b);
      expect(lv, b.title).toBeGreaterThanOrEqual(1);
      expect(lv, b.title).toBeLessThanOrEqual(JOURNEY_LEVEL_COUNT);
    }
  });

  it("keeps the Trinidad pin off Spain (Port of Spain is in Trinidad)", () => {
    const boat = LIBRARY_WORLD.find((b) => b.slug === "the-boat-with-the-red-sail");
    expect(boat?.country).toBe("Trinidad and Tobago");
  });
});
