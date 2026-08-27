import { AsyncLocalStorage } from "node:async_hooks";
import * as db from "./db.mjs";

const storage = new AsyncLocalStorage();

export class SpendCapError extends Error {
  constructor(message, exposure = {}) {
    super(message);
    this.name = "SpendCapError";
    this.spendCap = true;
    this.exposure = exposure;
  }
}

export class DuplicateSpendOperationError extends Error {
  constructor(message) { super(message); this.name = "DuplicateSpendOperationError"; this.duplicateSpend = true; }
}

export function withSpendContext(context, fn) {
  return storage.run({ ...context, sequence: 0 }, fn);
}

export function currentSpendContext() {
  return storage.getStore() || null;
}

function safePart(value) {
  return String(value || "call").toLowerCase().replace(/[^a-z0-9:_-]+/g, "-").slice(0, 120);
}

export async function beginPaidCall({ call, provider, model, estimateUsd, requestMeta = null }) {
  const ctx = storage.getStore();
  if (!ctx?.bookId) return null;
  ctx.sequence += 1;
  const operationKey = `${ctx.bookId}:e${Number(ctx.epoch || 0)}:${safePart(ctx.step)}:${ctx.sequence}:${safePart(call)}`;
  const attempt = await db.beginSpendAttempt({
    bookId: ctx.bookId,
    operationKey,
    step: ctx.step,
    callName: call,
    provider,
    model,
    estimateUsd,
    capUsd: ctx.capUsd,
    clientRequestId: crypto.randomUUID(),
    requestMeta,
  });
  if (!attempt?.allowed) {
    const recentActive = attempt?.reason === "duplicate operation" && attempt?.status === "active"
      && Date.now() - new Date(attempt.startedAt || 0).getTime() < 6 * 60_000;
    if (recentActive) throw new DuplicateSpendOperationError("This paid operation is already running");
    throw new SpendCapError(attempt?.reason || "Paid call would exceed the book spend cap", attempt?.exposure);
  }
  return attempt;
}

export async function completePaidCall(attempt, { costUsd, providerRequestId = null, usage = null, responseMeta = null } = {}) {
  if (!attempt?.id) return;
  await db.finishSpendAttempt({
    id: attempt.id,
    status: "confirmed",
    actualUsd: Number(costUsd || 0),
    providerRequestId,
    usage,
    responseMeta,
  });
  attempt.reconciled = true;
}

export async function failPaidCall(attempt, error, { definitelyUnbilled = false, providerRequestId = null } = {}) {
  if (!attempt?.id || attempt.reconciled) return;
  await db.finishSpendAttempt({
    id: attempt.id,
    status: definitelyUnbilled ? "released" : "uncertain",
    actualUsd: definitelyUnbilled ? 0 : null,
    providerRequestId,
    error: String(error?.message || error).slice(0, 500),
  });
}

export async function spendExposure(bookId) {
  return db.getSpendExposure(bookId);
}
