// Re-seed the demo school in prod with the latest seedDemo shape (pathway
// progress, teacher judgement, multi-window assessment history, attendance).
// Uses the service-role key from myphonics_books/.env — bypasses RLS.
//
//   node scripts/reseed_demo_school.mjs           # re-seed all schools
//   node scripts/reseed_demo_school.mjs <id>      # re-seed one school
//
// Mirrors src/school/lib/seedDemo.ts so the in-app demo button and this
// script produce equivalent data.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL = 'https://jfbgdeyjngvzpfucwpuk.supabase.co';

function loadServiceKey() {
  const env = readFileSync(join(BASE, '.env'), 'utf8');
  const m = env.match(/^SUPABASE_SERVICE_KEY=(.+)$/m);
  if (!m) throw new Error('SUPABASE_SERVICE_KEY not found in myphonics_books/.env');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

const KEY = loadServiceKey();

function rest(path, init = {}) {
  return fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`, apikey: KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  });
}
async function json(res) {
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  if (!text) return [];
  try { return JSON.parse(text); } catch { throw new Error(`Bad JSON (status ${res.status}, body: ${text.slice(0, 300)})`); }
}

// ── Data mirrored from src/school/data + seedDemo ────────────────────────────
const TEACHING_STEP_COUNT = { 1: 14, 2: 23, 3: 11, 4: 21, 5: 17, 6: 13, 7: 10, 8: 9 };

const FIRST_NAMES = [
  'Aisha','Omar','Fatima','Yusuf','Layla','Zaid','Mariam','Hamza','Noor','Khalid',
  'Sara','Bilal','Hana','Tariq','Salma','Ibrahim',
  'Ayaan','Zara','Hassan','Iqra','Rohan','Amna','Faisal','Mahnoor','Usman','Eshal','Daniyal','Areeba',
  'Oliver','Amelia','George','Isla','Harry','Ava','Jack','Mia','Charlie','Grace','Thomas','Freya',
  'Oscar','Poppy','Henry','Daisy','Arthur','Florence','Theo','Evie',
];
const LAST_NAMES = [
  'Al-Farsi','Khan','Hussain','Rahman','Ahmed','Malik','Saleh','Iqbal','Patel','Begum','Sheikh','Aziz','Nasser','Qureshi','Mahmood','Karim',
  'Smith','Jones','Taylor','Brown','Wilson','Evans','Roberts','Walker','Hughes','Green','Clarke','Cooper',
];

const CLASSES = [
  { name: 'Reception Oak',   yearGroup: 'Reception', count: 26, levelWeights: { 1: 9, 2: 8, 3: 4, 4: 1 },                         unassessed: 3 },
  { name: 'Reception Maple', yearGroup: 'Reception', count: 25, levelWeights: { 1: 9, 2: 8, 3: 4, 4: 1 },                         unassessed: 2 },
  { name: 'Year 1 Willow',   yearGroup: 'Year 1',    count: 28, levelWeights: { 1: 2, 2: 3, 3: 6, 4: 7, 5: 4, 6: 1 },             unassessed: 2 },
  { name: 'Year 1 Birch',    yearGroup: 'Year 1',    count: 27, levelWeights: { 1: 2, 2: 3, 3: 6, 4: 7, 5: 4, 6: 1 },             unassessed: 2 },
  { name: 'Year 2 Cedar',    yearGroup: 'Year 2',    count: 27, levelWeights: { 1: 1, 2: 2, 3: 2, 4: 3, 5: 6, 6: 7, 7: 4, 8: 1 }, unassessed: 2 },
  { name: 'Year 2 Rowan',    yearGroup: 'Year 2',    count: 26, levelWeights: { 1: 1, 2: 2, 3: 2, 4: 3, 5: 6, 6: 7, 7: 4, 8: 1 }, unassessed: 2 },
];

const HISTORY_WINDOWS = [
  { name: 'Autumn 2', date: '2025-12-05' },
  { name: 'Spring 1', date: '2026-02-06' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function weightedLevel(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [lvl, w] of entries) { r -= w; if (r <= 0) return Number(lvl); }
  return Number(entries[0][0]);
}
function clampLevel(n) { return Math.max(1, Math.min(8, n)); }
function pickJudgement() {
  const r = Math.random();
  return r < 0.1 ? 'needs_support' : r < 0.22 ? 'ready_soon' : 'continue';
}
function daysAgoISO(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString();
}

// ── Seed one school ──────────────────────────────────────────────────────────
async function seedSchool(schoolId, schoolName) {
  console.log(`Re-seeding "${schoolName}" (${schoolId})…`);

  // Wipe existing classrooms (cascade clears students + attendance + assessments).
  await fetch(`${URL}/rest/v1/classrooms?school_id=eq.${schoolId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, Prefer: 'return=minimal' },
  }).then((r) => { if (!r.ok && r.status !== 204) throw new Error(`wipe failed ${r.status}`); });

  // Create classrooms in one batch.
  const roomPayload = CLASSES.map((c) => ({ school_id: schoolId, name: c.name, year_group: c.yearGroup }));
  const rooms = await json(await rest('classrooms', { method: 'POST', body: JSON.stringify(roomPayload) }));

  const names = shuffle(FIRST_NAMES.flatMap((f) => LAST_NAMES.map((l) => ({ first: f, last: l }))));
  let cursor = 0;
  let totalStudents = 0;

  for (let ci = 0; ci < CLASSES.length; ci++) {
    const spec = CLASSES[ci];
    const room = rooms[ci];

    // Build students.
    const studentRows = [];
    for (let i = 0; i < spec.count; i++) {
      const nm = names[cursor++ % names.length];
      const assessed = i >= spec.unassessed;
      const level = assessed ? weightedLevel(spec.levelWeights) : null;
      const stepCount = level ? TEACHING_STEP_COUNT[level] : 0;
      const completed = stepCount ? Math.floor(Math.random() * stepCount) : 0;
      studentRows.push({
        school_id: schoolId,
        classroom_id: room.id,
        first_name: nm.first,
        last_name: nm.last,
        current_level: level ? `L${level}` : null,
        pathway_completed: completed,
        teacher_judgement: level ? pickJudgement() : null,
      });
    }
    const inserted = await json(await rest('school_students', { method: 'POST', body: JSON.stringify(studentRows) }));
    totalStudents += inserted.length;

    // Assessment history per assessed pupil.
    const assessmentRows = [];
    for (const s of inserted) {
      if (!s.current_level) continue;
      const lvl = Number(String(s.current_level).replace('L', ''));
      const startLvl = clampLevel(lvl - 1);
      HISTORY_WINDOWS.forEach((w, idx) => {
        assessmentRows.push({
          student_id: s.id, classroom_id: room.id, school_id: schoolId,
          recommended_level: `L${idx === 0 ? startLvl : lvl}`,
          score_total: Math.min(lvl + Math.floor(Math.random() * 2), 6), score_max: 6,
          payload: { method: 'window', seeded: true, note: idx === 0 ? 'Initial placement' : 'Whole-school window' },
          created_at: new Date(w.date).toISOString(),
        });
      });
      if (Math.random() < 0.8) {
        assessmentRows.push({
          student_id: s.id, classroom_id: room.id, school_id: schoolId,
          recommended_level: s.current_level,
          score_total: Math.min(lvl + Math.floor(Math.random() * 2), 6), score_max: 6,
          payload: { method: 'window', seeded: true, note: 'Whole-school window' },
          created_at: daysAgoISO(7 + Math.floor(Math.random() * 14)),
        });
      }
    }
    for (let i = 0; i < assessmentRows.length; i += 500) {
      await json(await rest('school_assessment_results', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(assessmentRows.slice(i, i + 500)) }));
    }

    // Attendance: last 12 weekday sessions, ~88% present.
    const sessionDates = [];
    for (let d = 1; sessionDates.length < 12 && d < 40; d++) {
      const day = new Date(); day.setDate(day.getDate() - d);
      const dow = day.getDay();
      if (dow === 0 || dow === 6) continue;
      sessionDates.push(day.toISOString().slice(0, 10));
    }
    const attendanceRows = inserted.flatMap((s) => {
      const lvl = s.current_level ? Number(String(s.current_level).replace('L', '')) : null;
      return sessionDates.map((date) => {
        const r = Math.random();
        const status = r < 0.88 ? 'present' : r < 0.94 ? 'late' : 'absent';
        return { school_id: schoolId, student_id: s.id, session_date: date, lesson: 'Phonics group', context_type: 'group', group_level: lvl, status };
      });
    });
    for (let i = 0; i < attendanceRows.length; i += 500) {
      await json(await rest('attendance', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(attendanceRows.slice(i, i + 500)) }));
    }

    console.log(`  ${spec.name}: ${inserted.length} pupils, ${assessmentRows.length} assessments, ${attendanceRows.length} attendance rows`);
  }
  console.log(`Done. ${CLASSES.length} classrooms, ${totalStudents} pupils.`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const targetId = process.argv[2];
  let schools;
  if (targetId) {
    schools = await json(await rest(`schools?id=eq.${targetId}&select=id,name`));
  } else {
    schools = await json(await rest('schools?select=id,name'));
  }
  if (schools.length === 0) { console.log('No schools to seed.'); return; }
  for (const s of schools) await seedSchool(s.id, s.name);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
