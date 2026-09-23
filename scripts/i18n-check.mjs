#!/usr/bin/env node
/**
 * i18n sanity check.
 *
 *   node scripts/i18n-check.mjs            # everything
 *   node scripts/i18n-check.mjs landing    # only these namespaces
 *
 * 1. Every locale file parses and has exactly the English keys
 *    (plural keys may use any CLDR suffix: _zero _one _two _few _many _other).
 * 2. {{placeholders}} and <tags> in each translation match the English.
 * 3. Literal t('key') / t('ns:key') calls in src/ resolve to an English key.
 * Exit code 1 on any error.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const LOCALES = path.join(ROOT, 'src', 'i18n', 'locales');
const only = new Set(process.argv.slice(2));
const PLURAL = /_(zero|one|two|few|many|other)$/;

const errors = [];
const warn = [];

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}
const base = (k) => k.replace(PLURAL, '');
const tokens = (s) => {
  if (typeof s !== 'string') return '';
  const ph = [...s.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => `{{${m[1]}}}`);
  const tags = [...s.matchAll(/<\/?([\w-]+)\s*\/?>/g)].map((m) => `<${m[1]}>`);
  return [...ph, ...tags].sort().join(' ');
};

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    errors.push(`${path.relative(ROOT, file)}: invalid JSON — ${e.message}`);
    return null;
  }
}

const langs = fs.readdirSync(LOCALES).filter((d) => fs.statSync(path.join(LOCALES, d)).isDirectory());
const enNs = fs.readdirSync(path.join(LOCALES, 'en')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
const en = {};
for (const ns of enNs) en[ns] = flatten(readJson(path.join(LOCALES, 'en', `${ns}.json`)) ?? {});

// 1 + 2: locale parity
for (const ns of enNs) {
  if (only.size && !only.has(ns)) continue;
  const enKeys = en[ns];
  const enBases = new Set(Object.keys(enKeys).map(base));
  for (const lng of langs) {
    if (lng === 'en') continue;
    const file = path.join(LOCALES, lng, `${ns}.json`);
    if (!fs.existsSync(file)) { warn.push(`${lng}/${ns}.json missing (falls back to English)`); continue; }
    const tr = readJson(file);
    if (!tr) continue;
    const flat = flatten(tr);
    const trBases = new Set(Object.keys(flat).map(base));
    for (const b of enBases) if (!trBases.has(b)) errors.push(`${lng}/${ns}: missing key "${b}"`);
    for (const b of trBases) if (!enBases.has(b)) errors.push(`${lng}/${ns}: extra key "${b}" (not in English)`);
    for (const [k, v] of Object.entries(flat)) {
      const enVal = enKeys[k] ?? enKeys[`${base(k)}_other`] ?? enKeys[base(k)];
      if (enVal === undefined) continue;
      if (typeof v !== 'string' || !v.trim()) { errors.push(`${lng}/${ns}: "${k}" is empty or not a string`); continue; }
      // Plural forms may legitimately drop {{count}} (e.g. Arabic "one" form).
      const a = tokens(enVal).split(' ').filter((t) => !(PLURAL.test(k) && t === '{{count}}')).join(' ');
      const b = tokens(v).split(' ').filter((t) => !(PLURAL.test(k) && t === '{{count}}')).join(' ');
      if (a !== b) errors.push(`${lng}/${ns}: "${k}" placeholders/tags differ — en [${a}] vs [${b}]`);
    }
  }
}

// 3: literal keys used in code
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}
const has = (ns, key) => {
  const k = en[ns];
  if (!k) return false;
  return key in k || `${key}_other` in k || `${key}_one` in k ||
    Object.keys(k).some((x) => x.startsWith(`${key}.`)); // returnObjects on a subtree
};
for (const file of walk(path.join(ROOT, 'src'))) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('useTranslation') && !src.includes('i18n')) continue;
  const m = src.match(/useTranslation\(\s*(?:\[\s*)?['"]([\w-]+)['"]/);
  const defNs = m ? m[1] : 'common';
  const nsDecl = [...src.matchAll(/useTranslation\(\s*\[([^\]]*)\]/g)].flatMap((x) => [...x[1].matchAll(/['"]([\w-]+)['"]/g)].map((y) => y[1]));
  for (const call of src.matchAll(/\bt\(\s*['"]([\w.:-]+)['"]/g)) {
    let key = call[1];
    let ns = defNs;
    if (key.includes(':')) [ns, key] = key.split(':');
    if (!en[ns]) { errors.push(`${path.relative(ROOT, file)}: t('${call[1]}') — namespace "${ns}" has no English file`); continue; }
    if (has(ns, key)) continue;
    // Keys may live in any namespace this file declares.
    if (nsDecl.some((n) => has(n, key))) continue;
    if (only.size && !only.has(ns)) continue;
    errors.push(`${path.relative(ROOT, file)}: t('${call[1]}') — no English key "${ns}:${key}"`);
  }
  for (const call of src.matchAll(/i18nKey=["']([\w.:-]+)["']/g)) {
    let key = call[1];
    let ns = defNs;
    if (key.includes(':')) [ns, key] = key.split(':');
    if (!has(ns, key) && !nsDecl.some((n) => has(n, key))) {
      if (only.size && !only.has(ns)) continue;
      errors.push(`${path.relative(ROOT, file)}: i18nKey="${call[1]}" — no English key "${ns}:${key}"`);
    }
  }
}

for (const w of warn) console.log(`warn  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\n${enNs.length} namespaces × ${langs.length} languages — ${errors.length} error(s), ${warn.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
