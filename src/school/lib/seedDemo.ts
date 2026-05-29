/**
 * Demo-data seeder for the school app.
 *
 * Runs in-app as the logged-in school admin (so it satisfies RLS — every row
 * is written under a school the caller is a member of). Idempotent: deletes
 * the school's existing classrooms first (cascade removes students +
 * assessment results), then re-creates the demo set.
 *
 * Designed for the Loom walkthrough: a believable international primary school
 * with three classes spanning the level range, a handful of outliers, and a
 * few unassessed children so the dashboard's "needs assessment" alert fires.
 */
import { schoolDb } from './schoolClient';

const FIRST_NAMES = [
  // Arabic / Gulf
  'Aisha', 'Omar', 'Fatima', 'Yusuf', 'Layla', 'Zaid', 'Mariam', 'Hamza',
  'Noor', 'Khalid', 'Sara', 'Bilal', 'Hana', 'Tariq', 'Salma', 'Ibrahim',
  // Pakistani
  'Ayaan', 'Zara', 'Hassan', 'Iqra', 'Rohan', 'Amna', 'Faisal', 'Mahnoor',
  'Usman', 'Eshal', 'Daniyal', 'Areeba',
  // British
  'Oliver', 'Amelia', 'George', 'Isla', 'Harry', 'Ava', 'Jack', 'Mia',
  'Charlie', 'Grace', 'Thomas', 'Freya', 'Oscar', 'Poppy', 'Henry', 'Daisy',
  'Arthur', 'Florence', 'Theo', 'Evie',
];

const LAST_NAMES = [
  'Al-Farsi', 'Khan', 'Hussain', 'Rahman', 'Ahmed', 'Malik', 'Saleh', 'Iqbal',
  'Patel', 'Begum', 'Sheikh', 'Aziz', 'Nasser', 'Qureshi', 'Mahmood', 'Karim',
  'Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Evans', 'Roberts', 'Walker',
  'Hughes', 'Green', 'Clarke', 'Cooper',
];

type ClassSpec = {
  name: string;
  yearGroup: string;
  count: number;
  levelWeights: Partial<Record<number, number>>; // level → relative weight
  unassessed: number; // how many to leave with null level
};

// Two-form entry primary: 2 classes per year group. The level weights overlap
// heavily across year groups on purpose — schools group by phonics level, not
// by age — so the "all classes" view in Phonics Groups shows e.g. a Level 1
// group made up of mostly Reception, a few Year 1s, and the odd struggling
// Year 2. Likewise advanced Reception children sit in groups with Year 1s.
const CLASSES: ClassSpec[] = [
  // Reception — beginning readers, but a few are already racing ahead.
  { name: 'Reception Oak',   yearGroup: 'Reception', count: 26, levelWeights: { 1: 9, 2: 8, 3: 4, 4: 1 },                         unassessed: 3 },
  { name: 'Reception Maple', yearGroup: 'Reception', count: 25, levelWeights: { 1: 9, 2: 8, 3: 4, 4: 1 },                         unassessed: 2 },
  // Year 1 — centre of mass mid-programme, with a struggling tail down to L1.
  { name: 'Year 1 Willow',   yearGroup: 'Year 1',    count: 28, levelWeights: { 1: 2, 2: 3, 3: 6, 4: 7, 5: 4, 6: 1 },             unassessed: 2 },
  { name: 'Year 1 Birch',    yearGroup: 'Year 1',    count: 27, levelWeights: { 1: 2, 2: 3, 3: 6, 4: 7, 5: 4, 6: 1 },             unassessed: 2 },
  // Year 2 — mostly fluent, but a real tail of children still on early levels.
  { name: 'Year 2 Cedar',    yearGroup: 'Year 2',    count: 27, levelWeights: { 1: 1, 2: 2, 3: 2, 4: 3, 5: 6, 6: 7, 7: 4, 8: 1 }, unassessed: 2 },
  { name: 'Year 2 Rowan',    yearGroup: 'Year 2',    count: 26, levelWeights: { 1: 1, 2: 2, 3: 2, 4: 3, 5: 6, 6: 7, 7: 4, 8: 1 }, unassessed: 2 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedLevel(weights: Partial<Record<number, number>>): number {
  const entries = Object.entries(weights) as [string, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [lvl, w] of entries) {
    r -= w;
    if (r <= 0) return Number(lvl);
  }
  return Number(entries[0][0]);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export type SeedResult = { ok: boolean; classrooms: number; students: number; error?: string };

export async function seedDemoSchool(schoolId: string): Promise<SeedResult> {
  try {
    // 1. Wipe existing classrooms (cascade clears students + assessments).
    const { data: existing } = await schoolDb.classrooms().select('id').eq('school_id', schoolId);
    const existingIds = ((existing ?? []) as { id: string }[]).map((r) => r.id);
    if (existingIds.length > 0) {
      await schoolDb.classrooms().delete().in('id', existingIds);
    }

    const names = shuffle(
      FIRST_NAMES.flatMap((f) => LAST_NAMES.map((l) => ({ first: f, last: l }))),
    );
    let nameCursor = 0;

    let totalStudents = 0;

    for (const spec of CLASSES) {
      // 2. Create the classroom.
      const { data: room, error: roomErr } = await schoolDb
        .classrooms()
        .insert({ school_id: schoolId, name: spec.name, year_group: spec.yearGroup })
        .select('id')
        .single();
      if (roomErr || !room) {
        return { ok: false, classrooms: 0, students: 0, error: (roomErr as { message?: string })?.message ?? 'classroom insert failed' };
      }
      const classroomId = (room as { id: string }).id;

      // 3. Build the student rows.
      const studentRows = [];
      for (let i = 0; i < spec.count; i++) {
        const nm = names[nameCursor++ % names.length];
        const assessed = i >= spec.unassessed; // first `unassessed` are left null
        const level = assessed ? weightedLevel(spec.levelWeights) : null;
        studentRows.push({
          school_id: schoolId,
          classroom_id: classroomId,
          first_name: nm.first,
          last_name: nm.last,
          current_level: level === null ? null : `L${level}`,
          __assessed: assessed,
          __level: level,
        });
      }

      // 4. Insert students, get their IDs back to attach assessments.
      const insertPayload = studentRows.map(({ __assessed, __level, ...row }) => row);
      const { data: inserted, error: stuErr } = await schoolDb
        .students()
        .insert(insertPayload)
        .select('id, first_name, last_name, current_level');
      if (stuErr) {
        return { ok: false, classrooms: 0, students: 0, error: (stuErr as { message?: string }).message };
      }
      totalStudents += (inserted ?? []).length;

      // 5. Assessment results for the assessed students.
      const insertedList = (inserted ?? []) as { id: string; current_level: string | null }[];
      const assessmentRows = insertedList
        .filter((s) => s.current_level)
        .map((s) => {
          const lvl = Number(s.current_level!.replace('L', ''));
          return {
            student_id: s.id,
            classroom_id: classroomId,
            school_id: schoolId,
            recommended_level: s.current_level,
            score_total: Math.min(lvl + Math.floor(Math.random() * 2), 6),
            score_max: 6,
            payload: { method: 'screener', seeded: true },
            created_at: daysAgo(7 + Math.floor(Math.random() * 45)),
          };
        });
      if (assessmentRows.length > 0) {
        await schoolDb.assessments().insert(assessmentRows);
      }

      // Attendance: the last ~12 weekday phonics sessions, ~90% present.
      const sessionDates: string[] = [];
      for (let d = 1; sessionDates.length < 12 && d < 40; d++) {
        const day = new Date();
        day.setDate(day.getDate() - d);
        const dow = day.getDay();
        if (dow === 0 || dow === 6) continue; // skip weekends
        sessionDates.push(day.toISOString().slice(0, 10));
      }
      const attendanceRows = insertedList.flatMap((s) => {
        const lvl = Number((s.current_level ?? 'L0').replace('L', '')) || null;
        return sessionDates.map((date) => {
          const r = Math.random();
          const status = r < 0.88 ? 'present' : r < 0.94 ? 'late' : 'absent';
          return {
            school_id: schoolId,
            student_id: s.id,
            session_date: date,
            lesson: 'Phonics group',
            context_type: 'group' as const,
            group_level: lvl,
            status,
          };
        });
      });
      // Insert in chunks to stay well under payload limits.
      for (let i = 0; i < attendanceRows.length; i += 500) {
        await schoolDb.attendance().insert(attendanceRows.slice(i, i + 500));
      }
    }

    return { ok: true, classrooms: CLASSES.length, students: totalStudents };
  } catch (err) {
    return { ok: false, classrooms: 0, students: 0, error: (err as Error).message };
  }
}
