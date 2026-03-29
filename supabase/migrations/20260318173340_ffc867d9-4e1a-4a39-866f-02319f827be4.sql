
-- App role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Children table
CREATE TABLE public.children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE,
  current_level INTEGER DEFAULT 1 CHECK (current_level BETWEEN 1 AND 6),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own children" ON public.children
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all children" ON public.children
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Books table
CREATE TABLE public.books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 6),
  sub_level TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  focus_sounds TEXT[] NOT NULL,
  tricky_words TEXT[],
  story_words TEXT[],
  cover_image_url TEXT,
  pdf_url TEXT,
  page_count INTEGER DEFAULT 16,
  sort_order INTEGER NOT NULL,
  is_free_sample BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published books" ON public.books
  FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage books" ON public.books
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Book pages
CREATE TABLE public.book_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  page_type TEXT NOT NULL CHECK (page_type IN (
    'cover', 'guide', 'reference', 'story', 'activity',
    'writing', 'nonsense', 'certificate', 'back_cover'
  )),
  text_content TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL,
  UNIQUE(book_id, page_number)
);
ALTER TABLE public.book_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read book pages" ON public.book_pages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.books WHERE books.id = book_pages.book_id AND books.is_published = true
  ));
CREATE POLICY "Admins can manage book pages" ON public.book_pages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Products
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN (
    'free_sample', 'level_pack', 'starter_bundle', 'full_bundle', 'subscription'
  )),
  price_pence INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'gbp',
  stripe_price_id TEXT,
  levels_included INTEGER[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products" ON public.products
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Purchases
CREATE TABLE public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'gbp',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON public.purchases
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User books
CREATE TABLE public.user_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'purchase' CHECK (source IN ('purchase', 'free_sample', 'subscription', 'admin_grant')),
  purchase_id UUID REFERENCES public.purchases(id),
  last_page_read INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, book_id)
);
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own books" ON public.user_books
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own books" ON public.user_books
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all user books" ON public.user_books
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  quiz_type TEXT NOT NULL CHECK (quiz_type IN (
    'comprehension', 'word_reading', 'sound_matching', 'nonsense_words'
  )),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quiz questions" ON public.quiz_questions
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Quiz attempts
CREATE TABLE public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  quiz_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quiz attempts" ON public.quiz_attempts
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Assessment items
CREATE TABLE public.assessment_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_type TEXT NOT NULL CHECK (round_type IN ('sound_recognition', 'word_reading', 'tricky_words')),
  item_text TEXT NOT NULL,
  target_level INTEGER NOT NULL CHECK (target_level BETWEEN 1 AND 6),
  sort_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.assessment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active assessment items" ON public.assessment_items
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage assessment items" ON public.assessment_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Assessment results
CREATE TABLE public.assessment_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  total_sounds_correct INTEGER NOT NULL DEFAULT 0,
  total_sounds_asked INTEGER NOT NULL DEFAULT 0,
  total_words_correct INTEGER NOT NULL DEFAULT 0,
  total_words_asked INTEGER NOT NULL DEFAULT 0,
  total_tricky_correct INTEGER NOT NULL DEFAULT 0,
  total_tricky_asked INTEGER NOT NULL DEFAULT 0,
  highest_level_passed INTEGER NOT NULL DEFAULT 0,
  recommended_level INTEGER NOT NULL DEFAULT 1,
  detailed_answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own assessments" ON public.assessment_results
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all assessments" ON public.assessment_results
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Drawings
CREATE TABLE public.drawings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own drawings" ON public.drawings
  FOR ALL USING (auth.uid() = user_id);

-- Download log
CREATE TABLE public.download_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  downloaded_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.download_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own downloads" ON public.download_log
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all downloads" ON public.download_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Reading streaks
CREATE TABLE public.reading_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  activity_date DATE NOT NULL,
  books_read INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  UNIQUE(user_id, child_id, activity_date)
);
ALTER TABLE public.reading_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own streaks" ON public.reading_streaks
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all streaks" ON public.reading_streaks
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('book-pages', 'book-pages', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('book-pdfs', 'book-pdfs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('drawings', 'drawings', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Public read book covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'book-covers');
CREATE POLICY "Admin write book covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update book covers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read book pages" ON storage.objects
  FOR SELECT USING (bucket_id = 'book-pages');
CREATE POLICY "Admin write book pages" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'book-pages' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update book pages" ON storage.objects
  FOR UPDATE USING (bucket_id = 'book-pages' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth read book pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'book-pdfs' AND auth.role() = 'authenticated');
CREATE POLICY "Admin write book pdfs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'book-pdfs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own drawings" ON storage.objects
  FOR SELECT USING (bucket_id = 'drawings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users write own drawings" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'drawings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed: Level 1 books
INSERT INTO public.books (level, sub_level, title, slug, focus_sounds, tricky_words, story_words, sort_order, is_free_sample) VALUES
  (1, 'L1.1', 'Tap! Tap! Tap!', 'tap-tap-tap', '{"s","a","t","p","i","n"}', '{"I","a","the","is","happy"}', '{"tap","sat","pan","tin"}', 1, true),
  (1, 'L1.2', 'The Mud on the Dog', 'the-mud-on-the-dog', '{"m","d","g","o"}', '{"I","a","the"}', '{"mud","dog","dig","mop"}', 2, true),
  (1, 'L1.3', 'The Fish in the Tank', 'the-fish-in-the-tank', '{"sh","nk"}', '{"I","a","the","no","go","is"}', '{"fish","tank","wish","bag","cup","sad"}', 3, false),
  (1, 'L1.4', 'The Red Socks', 'the-red-socks', '{"c","k","ck","e"}', '{"I","a","the","no","have","happy"}', '{"red","socks","sock","bag","check"}', 4, false),
  (1, 'L1.5', 'Run, Pup, Run!', 'run-pup-run', '{"u","r","h","b"}', '{"I","a","the","have","me","happy"}', '{"run","pup","hug","rub","bus"}', 5, false),
  (1, 'L1.6', 'Fox Fell Off!', 'fox-fell-off', '{"f","l","ff","ll"}', '{"I","a","the","have","oh","happy"}', '{"fox","fell","off","log","hill"}', 6, false),
  (1, 'L1.7', 'The Jam Jug', 'the-jam-jug', '{"j","v","w"}', '{"I","a","the","no","oh"}', '{"jam","jug","van","vet","win"}', 7, false),
  (1, 'L1.8', 'The Yak and the Box', 'the-yak-and-the-box', '{"x","y","z"}', '{"I","a","the"}', '{"yak","box","zip","fix","yes"}', 8, false),
  (1, 'L1.9', 'Chop, Chop, Chop!', 'chop-chop-chop', '{"ch","th"}', '{"I","a","the","have","happy"}', '{"chop","chip","thin","then"}', 9, false),
  (1, 'L1.10', 'Buzz and Sing!', 'buzz-and-sing', '{"ng","qu","ss","zz"}', '{"I","a","the","no"}', '{"buzz","sing","ring","queen","hiss"}', 10, false);

-- Seed: Products
INSERT INTO public.products (name, description, product_type, price_pence, levels_included, sort_order) VALUES
  ('Free Sample', '2 free books from Level 1', 'free_sample', 0, '{1}', 1),
  ('Level 1 Pack', 'All 10 Starting Stories books', 'level_pack', 999, '{1}', 2),
  ('Level 2 Pack', 'All 5 Longer Sounds books', 'level_pack', 999, '{2}', 3),
  ('Level 3 Pack', 'All 5 New Spellings books', 'level_pack', 999, '{3}', 4),
  ('Level 4 Pack', 'All 4 Building Fluency books', 'level_pack', 799, '{4}', 5),
  ('Level 5 Pack', 'All 4 Reading Together books', 'level_pack', 799, '{5}', 6),
  ('Level 6 Pack', 'All 4 Reading Champion books', 'level_pack', 799, '{6}', 7),
  ('Starter Bundle', 'Levels 1 and 2 (15 books)', 'starter_bundle', 1699, '{1,2}', 8),
  ('Full Bundle', 'All 32 books, Levels 1 to 6', 'full_bundle', 3999, '{1,2,3,4,5,6}', 9),
  ('Monthly Subscription', 'Access all books, new releases monthly', 'subscription', 499, '{1,2,3,4,5,6}', 10);

-- Seed: Assessment items
INSERT INTO public.assessment_items (round_type, item_text, target_level, sort_order) VALUES
  ('sound_recognition', 's', 1, 1),
  ('sound_recognition', 'a', 1, 2),
  ('sound_recognition', 't', 1, 3),
  ('sound_recognition', 'sh', 1, 4),
  ('sound_recognition', 'ch', 1, 5),
  ('sound_recognition', 'th', 1, 6),
  ('sound_recognition', 'ay', 2, 7),
  ('sound_recognition', 'ee', 2, 8),
  ('sound_recognition', 'igh', 2, 9),
  ('sound_recognition', 'oo', 2, 10),
  ('sound_recognition', 'ar', 2, 11),
  ('sound_recognition', 'a-e', 3, 12),
  ('sound_recognition', 'i-e', 3, 13),
  ('sound_recognition', 'oi', 3, 14),
  ('sound_recognition', 'ur', 4, 15),
  ('word_reading', 'sat', 1, 1),
  ('word_reading', 'pin', 1, 2),
  ('word_reading', 'shop', 1, 3),
  ('word_reading', 'tank', 1, 4),
  ('word_reading', 'feet', 2, 5),
  ('word_reading', 'moon', 2, 6),
  ('word_reading', 'park', 2, 7),
  ('word_reading', 'cake', 3, 8),
  ('word_reading', 'shine', 3, 9),
  ('word_reading', 'turnip', 4, 10),
  ('word_reading', 'explore', 5, 11),
  ('word_reading', 'famous', 6, 12),
  ('tricky_words', 'the', 1, 1),
  ('tricky_words', 'I', 1, 2),
  ('tricky_words', 'no', 1, 3),
  ('tricky_words', 'go', 1, 4),
  ('tricky_words', 'said', 2, 5),
  ('tricky_words', 'have', 2, 6),
  ('tricky_words', 'like', 3, 7),
  ('tricky_words', 'some', 3, 8),
  ('tricky_words', 'come', 4, 9),
  ('tricky_words', 'were', 5, 10);
