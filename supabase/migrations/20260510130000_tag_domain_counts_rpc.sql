-- Server-side aggregation helpers used by onboarding/sidebar to avoid
-- streaming all blog_entries rows to the browser just to count tags.

CREATE OR REPLACE FUNCTION public.get_tag_counts(min_count int DEFAULT 1, max_results int DEFAULT 60)
RETURNS TABLE(tag text, n int)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT t.tag, COUNT(*)::int AS n
  FROM public.blog_entries be, UNNEST(be.tags) AS t(tag)
  WHERE COALESCE(NULLIF(TRIM(t.tag), ''), NULL) IS NOT NULL
  GROUP BY t.tag
  HAVING COUNT(*) >= min_count
  ORDER BY n DESC, t.tag ASC
  LIMIT GREATEST(max_results, 0);
$$;

CREATE OR REPLACE FUNCTION public.get_domain_counts()
RETURNS TABLE(domain text, n int)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT be.domain, COUNT(*)::int AS n
  FROM public.blog_entries be
  WHERE be.domain IS NOT NULL AND TRIM(be.domain) <> ''
  GROUP BY be.domain
  ORDER BY n DESC, be.domain ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_tag_counts(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_domain_counts() TO anon, authenticated;
