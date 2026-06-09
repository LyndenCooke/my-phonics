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
  join_code: string | null;
  academic_year: string | null;
};

export type AttendanceStatus = 'present' | 'absent' | 'late';

export type AttendanceRow = {
  id: string;
  school_id: string;
  student_id: string;
  session_date: string;
  lesson: string;
  context_type: 'group' | 'class';
  group_level: number | null;
  classroom_id: string | null;
  status: AttendanceStatus;
  recorded_by: string | null;
  note: string | null;
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
  pathway_completed: number | null;
  teacher_judgement: 'continue' | 'ready_soon' | 'needs_support' | null;
  teacher_note: string | null;
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
  attendance: () => untyped.from('attendance'),
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

export type JoinSchoolResponse =
  | { ok: true; school_id: string; school_name: string }
  | { ok: false; reason: string };

export async function rpcJoinSchoolWithCode(code: string): Promise<{ data: JoinSchoolResponse | null; error: unknown }> {
  return (supabase.rpc as unknown as (
    fn: string, args: Record<string, unknown>,
  ) => Promise<{ data: JoinSchoolResponse | null; error: unknown }>)('join_school_with_code', { p_code: code });
}

/**
 * Download a school resource (storybook PDF / worksheet pack / sound book)
 * via the `school-download` edge function: it verifies the caller's school
 * membership, mints a short-lived signed URL from the PRIVATE buckets, and
 * logs the download. We then fetch the signed URL as a blob so the file
 * saves with a friendly name. Buckets are never public.
 */
export async function downloadSchoolResource(params: {
  resourceType: 'storybook' | 'worksheet_pack' | 'sound_book';
  resourceKey: string;            // storage key stem, e.g. '1_1'
  format?: 'a4' | 'a5';
  filename: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('school-download', {
    body: {
      resource_type: params.resourceType,
      resource_key: params.resourceKey,
      format: params.format ?? null,
    },
  });
  if (error) return { ok: false, error: error.message };
  const signed = (data as { signed_url?: string; error?: string } | null)?.signed_url;
  if (!signed) return { ok: false, error: (data as { error?: string } | null)?.error ?? 'Download unavailable' };

  try {
    const res = await fetch(signed);
    if (!res.ok) return { ok: false, error: `Not found (${res.status})` };
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = params.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Like downloadSchoolResource but returns the short-lived signed URL instead of
 * downloading — so the caller can open the PDF in a new tab for viewing.
 */
export async function viewSchoolResource(params: {
  resourceType: 'storybook' | 'worksheet_pack' | 'sound_book';
  resourceKey: string;
  format?: 'a4' | 'a5';
}): Promise<{ ok: boolean; url?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('school-download', {
    body: {
      resource_type: params.resourceType,
      resource_key: params.resourceKey,
      format: params.format ?? null,
    },
  });
  if (error) return { ok: false, error: error.message };
  const signed = (data as { signed_url?: string; error?: string } | null)?.signed_url;
  if (!signed) return { ok: false, error: (data as { error?: string } | null)?.error ?? 'Unavailable' };
  return { ok: true, url: signed };
}

export type RegenerateCodeResponse = { ok: boolean; join_code?: string; reason?: string };

export async function rpcRegenerateJoinCode(schoolId: string): Promise<{ data: RegenerateCodeResponse | null; error: unknown }> {
  return (supabase.rpc as unknown as (
    fn: string, args: Record<string, unknown>,
  ) => Promise<{ data: RegenerateCodeResponse | null; error: unknown }>)('regenerate_join_code', { p_school_id: schoolId });
}
