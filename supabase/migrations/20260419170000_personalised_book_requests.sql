-- Personalised Book Requests
-- Customers submit a questionnaire from the /personalised-book page.
-- Admins review requests in the CRM, approve them, and manually kick off
-- the book generation pipeline (or later, an automated one).

CREATE TABLE public.personalised_book_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who asked (nullable — guests may submit before creating an account)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,

  -- Child details
  child_name TEXT NOT NULL,
  child_age TEXT,
  skin_tone TEXT,      -- one of our brand keys: very-dark, dark, med-dark, medium, med-light, light
  hair_colour TEXT,
  hair_style TEXT,

  -- Story inputs
  interests TEXT,      -- free text: "dinosaurs, swimming, spicy food"
  culture TEXT,        -- free text: "Lagos", "Istanbul", etc.
  level TEXT,          -- human-readable level string from the form
  notes TEXT,

  -- Admin workflow
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_review', 'designing', 'preview_sent', 'paid', 'delivered', 'cancelled')),
  assigned_to UUID REFERENCES public.profiles(id),
  preview_url TEXT,    -- link to the generated preview PDF once ready
  internal_notes TEXT, -- admin-only notes

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security:
--   - Customers can insert their own requests (or insert anonymously).
--   - Customers can read their own rows.
--   - Admins can read/update/delete everything.
ALTER TABLE public.personalised_book_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a personalised book request"
  ON public.personalised_book_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own requests"
  ON public.personalised_book_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage personalised book requests"
  ON public.personalised_book_requests
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_personalised_book_requests_updated_at
  BEFORE UPDATE ON public.personalised_book_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes for the admin list view
CREATE INDEX idx_pbr_status ON public.personalised_book_requests(status);
CREATE INDEX idx_pbr_created ON public.personalised_book_requests(created_at DESC);
CREATE INDEX idx_pbr_email ON public.personalised_book_requests(email);
