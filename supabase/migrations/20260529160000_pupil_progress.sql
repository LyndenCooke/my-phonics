-- Per-pupil pathway progress + teacher judgement on the child profile.
-- pathway_completed = number of steps completed within the pupil's CURRENT level
-- (resets to 0 whenever current_level changes). teacher_judgement / teacher_note
-- hold professional judgement between assessment windows.
alter table public.school_students
  add column if not exists pathway_completed integer not null default 0,
  add column if not exists teacher_judgement text,
  add column if not exists teacher_note text;

alter table public.school_students
  drop constraint if exists school_students_judgement_chk;
alter table public.school_students
  add constraint school_students_judgement_chk
  check (teacher_judgement is null or teacher_judgement in ('continue','ready_soon','needs_support'));
