import { describe, it, expect } from "vitest";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — untyped .mjs module
import { customerBook, shareableBook, SHAREABLE_STATUSES } from "../../server/forge/router.mjs";

/**
 * A custom_books row carries far more than a browser should ever see: the
 * family's email, the raw form answers about their child, archived rejected
 * drafts and the whole resumable pipeline job. These projections are the
 * only things the customer wizard and the public share link receive.
 */
const row = {
  id: "0b3f1c2e-1111-4222-8333-444455556666",
  status: "ready",
  title: "Zofia and the Red Sled",
  level: 3,
  focus_sound: "sh",
  child_name: "Zofia",
  child_age: 5,
  country: "Poland",
  country_flag: "🇵🇱",
  city: "Kraków",
  culture_notes: "pierogi with babcia",
  likes: "sledging",
  faith: "Christian",
  appearance: { gender: "girl", hair: "blonde plaits" },
  email: "family@example.com",
  user_id: "user-1",
  photo_used: true,
  pages: [{ type: "cover", title: "Zofia and the Red Sled" }, { type: "story", text: "Zofia has a red sled." }],
  profile: { type: "profile", name: "Zofia" },
  progress: { step: "assemble", message: "Done", pct: 100, job: { cost: 2.6, prompts: ["secret"], sceneUrls: ["a", "b"] } },
  rejected_runs: [{ notes: "internal" }],
  review_note: "checked by hand",
  cost_usd: 2.6,
  share_requested: true,
  wall_of_love_opt_in: false,
  created_at: "2026-09-01T10:00:00Z",
};

describe("customerBook (what the wizard polls)", () => {
  const out = customerBook(row);

  it("keeps what the wizard renders", () => {
    expect(out).toMatchObject({
      id: row.id, status: "ready", title: row.title, level: 3, focus_sound: "sh",
      child_name: "Zofia", country: "Poland", country_flag: "🇵🇱",
      share_requested: true, wall_of_love_opt_in: false, user_id: "user-1",
    });
    expect(out.pages).toBe(row.pages);
    expect(out.profile).toBe(row.profile);
    expect(out.progress).toEqual({ step: "assemble", message: "Done", pct: 100 });
  });

  it("never ships the email, the raw child details, the spend or the pipeline job", () => {
    for (const k of ["email", "child_age", "city", "culture_notes", "likes", "faith", "appearance", "photo_used", "rejected_runs", "review_note", "cost_usd"]) {
      expect(out, k).not.toHaveProperty(k);
    }
    expect(out.progress).not.toHaveProperty("job");
  });

  it("tolerates a row with no progress yet", () => {
    expect(customerBook({ ...row, progress: null }).progress).toBeNull();
  });
});

describe("shareableBook (the public /story link)", () => {
  const out = shareableBook(row);

  it("is the printed book and its label, nothing more", () => {
    expect(Object.keys(out).sort()).toEqual(
      ["child_name", "country", "country_flag", "created_at", "focus_sound", "id", "level", "pages", "pdf_url", "title"],
    );
    expect(out.pages).toBe(row.pages);
  });

  it("only finished books are shareable", () => {
    expect(SHAREABLE_STATUSES.has("ready")).toBe(true);
    expect(SHAREABLE_STATUSES.has("approved")).toBe(true);
    for (const s of ["awaiting_payment", "generating", "failed", "needs_review", "content_rejected", "rejected"]) {
      expect(SHAREABLE_STATUSES.has(s), s).toBe(false);
    }
  });
});
