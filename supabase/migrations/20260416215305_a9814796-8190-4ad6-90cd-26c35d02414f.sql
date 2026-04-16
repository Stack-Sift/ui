
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.user_job_role AS ENUM ('software_engineer', 'data_engineer', 'devops', 'product_manager', 'other');
CREATE TYPE public.summary_audience AS ENUM ('general', 'software_engineer', 'data_engineer', 'devops', 'product_manager');

-- ============ UTILITY: updated_at trigger ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role public.user_job_role,
  department TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ USER PREFERENCES ============
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sectors TEXT[] NOT NULL DEFAULT '{}',
  digest_enabled BOOLEAN NOT NULL DEFAULT false,
  digest_time TIME DEFAULT '08:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SECTORS ============
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sectors readable by all authenticated" ON public.sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage sectors" ON public.sectors FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ SOURCES ============
CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  blog_url TEXT,
  rss_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sources readable by all authenticated" ON public.sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage sources" ON public.sources FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ ARTICLES ============
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  author TEXT,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  sector_slugs TEXT[] NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX idx_articles_sector_slugs ON public.articles USING GIN(sector_slugs);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Articles readable by all authenticated" ON public.articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage articles" ON public.articles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ ARTICLE SUMMARIES ============
CREATE TABLE public.article_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  audience public.summary_audience NOT NULL,
  summary TEXT NOT NULL,
  key_points TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id, audience)
);
ALTER TABLE public.article_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Summaries readable by all authenticated" ON public.article_summaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage summaries" ON public.article_summaries FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ BOOKMARKS ============
CREATE TABLE public.bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, article_id)
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ DIGEST SUBSCRIPTIONS ============
CREATE TABLE public.digest_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'daily',
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.digest_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own digest" ON public.digest_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED DATA ============
INSERT INTO public.sectors (slug, name, description) VALUES
  ('ai-ml', 'AI / ML', 'Machine learning, LLMs, and applied AI'),
  ('cloud', 'Cloud Infrastructure', 'Cloud platforms, distributed systems, infra'),
  ('security', 'Security', 'AppSec, infra security, cryptography'),
  ('frontend', 'Frontend', 'Web UI, performance, frameworks'),
  ('backend', 'Backend Systems', 'APIs, databases, scaling backends'),
  ('devops', 'DevOps', 'CI/CD, observability, SRE'),
  ('data', 'Data', 'Data engineering, analytics, pipelines');

INSERT INTO public.sources (slug, name, blog_url, rss_url) VALUES
  ('netflix', 'Netflix Tech Blog', 'https://netflixtechblog.com', 'https://netflixtechblog.com/feed'),
  ('uber', 'Uber Engineering', 'https://www.uber.com/blog/engineering/', 'https://www.uber.com/blog/engineering/rss/'),
  ('meta', 'Meta Engineering', 'https://engineering.fb.com', 'https://engineering.fb.com/feed/'),
  ('google', 'Google Developers Blog', 'https://developers.googleblog.com', 'https://developers.googleblog.com/feeds/posts/default'),
  ('airbnb', 'Airbnb Engineering', 'https://medium.com/airbnb-engineering', 'https://medium.com/feed/airbnb-engineering'),
  ('stripe', 'Stripe Engineering', 'https://stripe.com/blog/engineering', 'https://stripe.com/blog/engineering.rss');

INSERT INTO public.articles (source_id, title, url, author, excerpt, content, sector_slugs, published_at) VALUES
  ((SELECT id FROM public.sources WHERE slug='netflix'), 'How Netflix Scales Its Recommendation Engine', 'https://netflixtechblog.com/sample-1', 'Jane Doe',
   'A look inside the personalization stack powering 250M+ subscribers.',
   'Netflix has long been at the forefront of personalization. In this post we explore the architecture, the model serving infrastructure, and the A/B testing framework used to deliver recommendations at massive scale. We cover feature stores, real-time inference, and how we balance exploration vs exploitation.',
   ARRAY['ai-ml','backend'], now() - interval '2 days'),
  ((SELECT id FROM public.sources WHERE slug='uber'), 'Migrating Uber''s Trip Storage to a New Sharded Architecture', 'https://www.uber.com/blog/sample-2', 'John Smith',
   'How we re-architected our trip storage layer to support 10x growth.',
   'Uber processes millions of trips daily. As volume grew, our existing storage layer became a bottleneck. This post details our migration to a sharded architecture, the consistency tradeoffs, and the dual-write strategy used during cutover.',
   ARRAY['backend','data'], now() - interval '3 days'),
  ((SELECT id FROM public.sources WHERE slug='meta'), 'Building Privacy-Preserving Machine Learning at Meta', 'https://engineering.fb.com/sample-3', 'Alice Chen',
   'Differential privacy and federated learning in production.',
   'Privacy is a first-class concern at Meta. This post walks through how we apply differential privacy to model training pipelines and how federated learning enables on-device personalization without centralizing raw data.',
   ARRAY['ai-ml','security'], now() - interval '5 days'),
  ((SELECT id FROM public.sources WHERE slug='google'), 'Optimizing Cold Starts in Cloud Run', 'https://developers.googleblog.com/sample-4', 'Bob Lee',
   'Practical tips for cutting serverless cold start latency.',
   'Cold starts remain one of the biggest pain points of serverless. We share concrete techniques — minimum instances, container image slimming, lazy initialization — to bring p99 cold start under 200ms.',
   ARRAY['cloud','devops'], now() - interval '6 days'),
  ((SELECT id FROM public.sources WHERE slug='airbnb'), 'A New Era of Visual Search at Airbnb', 'https://medium.com/airbnb-engineering/sample-5', 'Maya Patel',
   'How we built embedding-based visual search for listings.',
   'Travelers often know what a place should look like but not how to describe it. We trained a vision-language model on listing photos and integrated it into search, lifting booking conversion by double digits.',
   ARRAY['ai-ml','frontend'], now() - interval '8 days'),
  ((SELECT id FROM public.sources WHERE slug='stripe'), 'How Stripe Handles Idempotency at Scale', 'https://stripe.com/blog/sample-6', 'Carlos Ruiz',
   'A deep dive into idempotency keys and the storage that backs them.',
   'Idempotency is foundational for payment APIs. This post covers Stripe''s idempotency design, the key-value store powering it, and edge cases like long-running async operations and partial failures.',
   ARRAY['backend','security'], now() - interval '10 days'),
  ((SELECT id FROM public.sources WHERE slug='netflix'), 'Observability at Netflix: From Logs to Distributed Traces', 'https://netflixtechblog.com/sample-7', 'Diana Kim',
   'Our journey from log aggregation to a unified telemetry platform.',
   'As microservices proliferated, debugging became impossible without proper observability. We invested in OpenTelemetry, built a unified trace pipeline, and reduced MTTR by 60%.',
   ARRAY['devops','backend'], now() - interval '12 days'),
  ((SELECT id FROM public.sources WHERE slug='meta'), 'Reimagining the React Compiler', 'https://engineering.fb.com/sample-8', 'Eric Tan',
   'Auto-memoization and the future of React performance.',
   'The React Compiler automatically memoizes components and hooks, eliminating the need for useMemo and useCallback in most cases. This post explains how it works and what it means for app performance.',
   ARRAY['frontend'], now() - interval '14 days');
