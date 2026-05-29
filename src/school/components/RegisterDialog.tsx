import { useEffect, useState } from 'react';
import { Check, Clock, Loader2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { schoolDb, type AttendanceStatus, type AttendanceRow } from '../lib/schoolClient';

export type RegisterStudent = { id: string; first_name: string; last_name: string | null };

export type RegisterContext =
  | { type: 'group'; level: number }
  | { type: 'class'; classroomId: string };

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * RegisterDialog — take the register for a set of pupils. Works for a phonics
 * group (context.type === 'group') or a classroom. Pre-fills from any existing
 * attendance for the chosen date + lesson, then upserts on save.
 */
export default function RegisterDialog({
  open,
  onClose,
  schoolId,
  title,
  students,
  context,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  schoolId: string;
  title: string;
  students: RegisterStudent[];
  context: RegisterContext;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const defaultLesson = context.type === 'group' ? 'Phonics group' : 'Class register';
  const [date, setDate] = useState(todayISO());
  const [lesson, setLesson] = useState(defaultLesson);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing register for this date+lesson (so re-opening edits, not duplicates).
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const ids = students.map((s) => s.id);
      const base: Record<string, AttendanceStatus> = {};
      for (const s of students) base[s.id] = 'present'; // default everyone present
      if (ids.length > 0) {
        const { data } = await schoolDb.attendance()
          .select('student_id, status, session_date, lesson')
          .in('student_id', ids)
          .eq('session_date', date)
          .eq('lesson', lesson);
        for (const r of (data ?? []) as Pick<AttendanceRow, 'student_id' | 'status'>[]) {
          base[r.student_id] = r.status;
        }
      }
      setStatuses(base);
      setLoading(false);
    })();
  }, [open, date, lesson, students]);

  if (!open) return null;

  const setOne = (id: string, status: AttendanceStatus) => setStatuses((p) => ({ ...p, [id]: status }));
  const markAll = (status: AttendanceStatus) => setStatuses(Object.fromEntries(students.map((s) => [s.id, status])));

  const presentCount = Object.values(statuses).filter((s) => s === 'present' || s === 'late').length;

  const save = async () => {
    setSaving(true);
    const rows = students.map((s) => ({
      school_id: schoolId,
      student_id: s.id,
      session_date: date,
      lesson,
      context_type: context.type,
      group_level: context.type === 'group' ? context.level : null,
      classroom_id: context.type === 'class' ? context.classroomId : null,
      status: statuses[s.id] ?? 'present',
      recorded_by: user?.id ?? null,
    }));
    const { error } = await schoolDb.attendance().upsert(rows, { onConflict: 'student_id,session_date,lesson' });
    setSaving(false);
    if (error) {
      toast({ title: 'Could not save register', description: (error as { message?: string }).message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Register saved', description: `${presentCount}/${students.length} present on ${new Date(date).toLocaleDateString('en-GB')}.` });
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-xl">Take the register</h3>
            <p className="text-sm text-slate-500">{title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
        </header>

        <div className="px-5 py-3 border-b border-slate-100 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-bold text-slate-600 mb-1">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayISO()}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none" />
          </label>
          <label className="block">
            <span className="block text-xs font-bold text-slate-600 mb-1">Lesson</span>
            <input value={lesson} onChange={(e) => setLesson(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none" />
          </label>
        </div>

        <div className="px-5 py-2 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">{presentCount}/{students.length} present</span>
          <div className="flex gap-2">
            <button onClick={() => markAll('present')} className="text-xs font-semibold text-emerald-700 hover:underline">All present</button>
            <button onClick={() => markAll('absent')} className="text-xs font-semibold text-rose-700 hover:underline">All absent</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No pupils to register here yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {students.map((s) => {
                const st = statuses[s.id] ?? 'present';
                return (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-1">
                    <span className="font-semibold text-sm">{s.first_name} {s.last_name ?? ''}</span>
                    <div className="flex gap-1">
                      <SegBtn active={st === 'present'} tone="emerald" onClick={() => setOne(s.id, 'present')}><Check className="w-3.5 h-3.5" /> Present</SegBtn>
                      <SegBtn active={st === 'late'} tone="amber" onClick={() => setOne(s.id, 'late')}><Clock className="w-3.5 h-3.5" /> Late</SegBtn>
                      <SegBtn active={st === 'absent'} tone="rose" onClick={() => setOne(s.id, 'absent')}><X className="w-3.5 h-3.5" /> Absent</SegBtn>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving || students.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save register'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function SegBtn({ active, tone, onClick, children }: { active: boolean; tone: 'emerald' | 'amber' | 'rose'; onClick: () => void; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    emerald: active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300',
    amber: active ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300',
    rose: active ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300',
  };
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-bold ${tones[tone]}`}>
      {children}
    </button>
  );
}
