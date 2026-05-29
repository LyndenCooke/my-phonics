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

const CLASSES: ClassSpec[] = [
  {
    name: 'Year R Oak',
    yearGroup: 'Reception',
    count: 24,
    levelWeights: { 1: 5, 2: 6, 3: 5, 4: 2, 5: 1 },
    unassessed: 3,
  },
  {
    name: 'Year 1 Willow',
    yearGroup: 'Year 1',
    count: 28,
    levelWeights: { 2: 1, 3: 5, 4: 7, 5: 6, 6: 2 },
    unassessed: 3,
  },
  {
    name: 'Year 2 Cedar',
    yearGroup: 'Year 2',
    count: 26,
    levelWeights: { 4: 1, 5: 5, 6: 7, 7: 6, 8: 2 },
    unassessed: 2,
  },
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
    }

    return { ok: true, classrooms: CLASSES.length, students: totalStudents };
  } catch (err) {
    return { ok: false, classrooms: 0, students: 0, error: (err as Error).message };
  }
}
