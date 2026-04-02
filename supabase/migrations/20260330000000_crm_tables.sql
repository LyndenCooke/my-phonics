-- CRM Admin Dashboard Tables
-- Adds pipeline, contacts, deals, tasks, notes for admin CRM

-- Pipeline stages (reference data for kanban board)
CREATE TABLE public.crm_pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  colour TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage pipeline stages"
  ON public.crm_pipeline_stages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default stages
INSERT INTO public.crm_pipeline_stages (name, sort_order, colour) VALUES
  ('New Lead', 1, '#6366f1'),
  ('Assessed', 2, '#f59e0b'),
  ('Free Trial', 3, '#3b82f6'),
  ('Purchased', 4, '#10b981'),
  ('Subscribed', 5, '#8b5cf6'),
  ('Churned', 6, '#ef4444');

-- CRM contacts (extends profiles with CRM-specific fields)
CREATE TABLE public.crm_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stage_id UUID REFERENCES public.crm_pipeline_stages(id),
  source TEXT,
  tags TEXT[] DEFAULT '{}',
  assigned_to UUID REFERENCES public.profiles(id),
  lifetime_value_pence INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage contacts"
  ON public.crm_contacts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CRM deals (individual opportunities linked to a contact)
CREATE TABLE public.crm_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE NOT NULL,
  stage_id UUID REFERENCES public.crm_pipeline_stages(id),
  product_id UUID REFERENCES public.products(id),
  title TEXT NOT NULL,
  value_pence INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  expected_close_date DATE,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage deals"
  ON public.crm_deals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CRM tasks (follow-ups, reminders)
CREATE TABLE public.crm_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage tasks"
  ON public.crm_tasks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- CRM notes (freeform notes on contacts/deals)
CREATE TABLE public.crm_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage notes"
  ON public.crm_notes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Analytics views
CREATE OR REPLACE VIEW public.admin_daily_signups AS
  SELECT
    date_trunc('day', created_at)::date AS day,
    COUNT(*)::integer AS signup_count
  FROM public.profiles
  GROUP BY 1
  ORDER BY 1;

CREATE OR REPLACE VIEW public.admin_daily_revenue AS
  SELECT
    date_trunc('day', completed_at)::date AS day,
    SUM(amount_paid)::integer AS total_pence,
    COUNT(*)::integer AS tx_count
  FROM public.purchases
  WHERE status = 'completed'
  GROUP BY 1
  ORDER BY 1;

-- Grant admin access to views
ALTER VIEW public.admin_daily_signups SET (security_invoker = true);
ALTER VIEW public.admin_daily_revenue SET (security_invoker = true);
