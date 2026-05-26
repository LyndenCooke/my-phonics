/**
 * School tables aren't in the auto-generated `integrations/supabase/types.ts`
 * (that file regenerates from production schema). Until the next regeneration,
 * this shim gives us typed access to the new tables without polluting the
 * generated file.
 */
import { supabase } from '@/integrations/supabase/client';

export type SchoolRow = {
  id: string;
  name: string;
  country: string | null;
  seat_count: number;
  subscription_tier: string;
  created_by: string | null;
  created_at: string;
};

export type ClassroomRow = {
  id: string;
  school_id: string;
  name: string;
  year_group: string | null;
  teacher_id: string | null;
  created_at: string;
};

export type SchoolStudentRow = {
  id: string;
  school_id: string;
  classroom_id: string;
  first_name: string;
  last_name: string | null;
  date_of_birth: string | null;
  current_level: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SchoolMembershipRow = {
  id: string;
  school_id: string;
  user_id: string;
  role: 'admin' | 'teacher';
  invited_email: string | null;
  created_at: string;
};

export type SchoolAssessmentResultRow = {
  id: string;
  student_id: string;
  classroom_id: string;
  school_id: string;
  administered_by: string | null;
  recommended_level: string | null;
  score_total: number | null;
  score_max: number | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untyped = supabase as any;

export const schoolDb = {
  schools: () => untyped.from('schools'),
  memberships: () => untyped.from('school_memberships'),
  classrooms: () => untyped.from('classrooms'),
  students: () => untyped.from('school_students'),
  assessments: () => untyped.from('school_assessment_results'),
};

export type CreateSchoolResponse =
  | { ok: true; school_id: string }
  | { ok: false; reason: string };

export async function rpcCreateSchoolWithAdmin(args: {
  p_name: string;
  p_country: string | null;
  p_seat_count: number;
}): Promise<{ data: CreateSchoolResponse | null; error: unknown }> {
  return (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: CreateSchoolResponse | null; error: unknown }>)(
    'create_school_with_admin',
    args,
  );
}
