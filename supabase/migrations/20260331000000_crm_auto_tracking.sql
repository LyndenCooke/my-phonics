-- CRM Auto-Tracking Triggers
-- Automatically moves contacts through pipeline stages based on user actions

-- ============================================================
-- TRIGGER 1: On signup (profile created) → Create CRM contact as "New Lead"
-- ============================================================
CREATE OR REPLACE FUNCTION public.crm_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  _stage_id UUID;
BEGIN
  SELECT id INTO _stage_id FROM public.crm_pipeline_stages WHERE name = 'New Lead' LIMIT 1;

  INSERT INTO public.crm_contacts (profile_id, stage_id, source, last_activity_at)
  VALUES (NEW.id, _stage_id, 'organic', now())
  ON CONFLICT (profile_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_crm_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_on_signup();

-- ============================================================
-- TRIGGER 2: On assessment completed → Move to "Assessed"
-- ============================================================
CREATE OR REPLACE FUNCTION public.crm_on_assessment()
RETURNS TRIGGER AS $$
DECLARE
  _stage_id UUID;
  _current_sort INTEGER;
  _new_sort INTEGER;
BEGIN
  SELECT id, sort_order INTO _stage_id, _new_sort
  FROM public.crm_pipeline_stages WHERE name = 'Assessed' LIMIT 1;

  -- Only advance forward (don't move backwards if already past Assessed)
  SELECT ps.sort_order INTO _current_sort
  FROM public.crm_contacts cc
  JOIN public.crm_pipeline_stages ps ON ps.id = cc.stage_id
  WHERE cc.profile_id = NEW.user_id;

  IF _current_sort IS NULL OR _current_sort < _new_sort THEN
    UPDATE public.crm_contacts
    SET stage_id = _stage_id, last_activity_at = now(), updated_at = now()
    WHERE profile_id = NEW.user_id;
  ELSE
    UPDATE public.crm_contacts
    SET last_activity_at = now(), updated_at = now()
    WHERE profile_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_crm_on_assessment
  AFTER INSERT ON public.assessment_results
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_on_assessment();

-- ============================================================
-- TRIGGER 3: On free book unlocked → Move to "Free Trial"
-- ============================================================
CREATE OR REPLACE FUNCTION public.crm_on_free_trial()
RETURNS TRIGGER AS $$
DECLARE
  _stage_id UUID;
  _current_sort INTEGER;
  _new_sort INTEGER;
BEGIN
  -- Only fire for free/sample books (no purchase_id means it was free)
  IF NEW.purchase_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, sort_order INTO _stage_id, _new_sort
  FROM public.crm_pipeline_stages WHERE name = 'Free Trial' LIMIT 1;

  SELECT ps.sort_order INTO _current_sort
  FROM public.crm_contacts cc
  JOIN public.crm_pipeline_stages ps ON ps.id = cc.stage_id
  WHERE cc.profile_id = NEW.user_id;

  IF _current_sort IS NULL OR _current_sort < _new_sort THEN
    UPDATE public.crm_contacts
    SET stage_id = _stage_id, last_activity_at = now(), updated_at = now()
    WHERE profile_id = NEW.user_id;
  ELSE
    UPDATE public.crm_contacts
    SET last_activity_at = now(), updated_at = now()
    WHERE profile_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_crm_on_free_trial
  AFTER INSERT ON public.user_books
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_on_free_trial();

-- ============================================================
-- TRIGGER 4: On purchase completed → Move to "Purchased" + update lifetime value
-- ============================================================
CREATE OR REPLACE FUNCTION public.crm_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
  _stage_id UUID;
  _current_sort INTEGER;
  _new_sort INTEGER;
BEGIN
  -- Only fire when status changes to 'completed'
  IF NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;
  IF OLD IS NOT NULL AND OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT id, sort_order INTO _stage_id, _new_sort
  FROM public.crm_pipeline_stages WHERE name = 'Purchased' LIMIT 1;

  SELECT ps.sort_order INTO _current_sort
  FROM public.crm_contacts cc
  JOIN public.crm_pipeline_stages ps ON ps.id = cc.stage_id
  WHERE cc.profile_id = NEW.user_id;

  IF _current_sort IS NULL OR _current_sort < _new_sort THEN
    UPDATE public.crm_contacts
    SET stage_id = _stage_id,
        lifetime_value_pence = COALESCE(lifetime_value_pence, 0) + COALESCE(NEW.amount_paid, 0),
        last_activity_at = now(),
        updated_at = now()
    WHERE profile_id = NEW.user_id;
  ELSE
    UPDATE public.crm_contacts
    SET lifetime_value_pence = COALESCE(lifetime_value_pence, 0) + COALESCE(NEW.amount_paid, 0),
        last_activity_at = now(),
        updated_at = now()
    WHERE profile_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_crm_on_purchase
  AFTER INSERT OR UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_on_purchase();

-- ============================================================
-- TRIGGER 5: On reading activity → Update last_activity_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.crm_on_reading_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.crm_contacts
  SET last_activity_at = now(), updated_at = now()
  WHERE profile_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_crm_on_reading_activity
  AFTER INSERT ON public.reading_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_on_reading_activity();

-- ============================================================
-- Helper: Update CRM contact source from client-side tracker
-- ============================================================
CREATE OR REPLACE FUNCTION public.crm_set_source(
  _source TEXT,
  _tags TEXT[] DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.crm_contacts
  SET source = COALESCE(_source, source),
      tags = CASE WHEN array_length(_tags, 1) > 0 THEN tags || _tags ELSE tags END,
      updated_at = now()
  WHERE profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
