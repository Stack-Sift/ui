
# TechPulse — Engineering Blog Aggregator

A Ground News-style aggregator for top engineering blogs (Netflix, Uber, Meta, Google, etc.) with AI-generated role-specific summaries.

## Stack
- **Frontend**: TanStack Start + React + Tailwind (Lovable's stack)
- **Backend**: Lovable Cloud (Supabase: Postgres + Auth + Storage)
- **AI**: Lovable AI Gateway (Gemini) for on-demand summaries
- **Article ingestion**: handled externally by you — we expose a documented `articles` table you can populate however you like

## Visual Style
Clean, neutral Ground News-like dashboard. Light theme with grays, strong typography, card-based articles, subtle accent color. Dark mode toggle included as a bonus.

## Layout
- **Left sidebar**: Sectors (AI/ML, Cloud Infrastructure, Security, Frontend, Backend Systems, DevOps, Data), with "All News" and "My Feed" at top, "Bookmarks" at bottom
- **Top bar**: Search, theme toggle, profile menu
- **Main**: Article cards (title, source logo/name, date, sector tag, snippet, bookmark button)
- **Article detail**: Full extracted content + summary panel with tabs (General / Software Eng / Data Eng / DevOps / Product Manager). Summaries generated on-demand via API and cached in DB.

## Pages / Routes
- `/` — landing/marketing splash with CTA to sign in
- `/login`, `/signup` — email+password, Google OAuth, GitHub OAuth
- `/onboarding` — pick role, department, preferred sectors (first login)
- `/feed` — All News (default) with toggle to My Feed
- `/sector/$slug` — filtered by sector
- `/article/$id` — full article + summary tabs
- `/bookmarks` — saved articles
- `/settings` — profile, role/sector preferences, digest opt-in

## Database Schema
- **profiles**: id (→auth.users), display_name, role (enum), department, created_at
- **user_roles**: separate table for app roles (security best practice)
- **user_preferences**: user_id, sectors[] (text[]), digest_enabled, digest_time
- **sources**: id, name, slug, blog_url, rss_url, logo_url
- **sectors**: id, name, slug, description
- **articles**: id, source_id, title, url (unique), published_at, author, content, excerpt, image_url, sector_ids[], created_at — *you populate this*
- **article_summaries**: id, article_id, audience (general|software_engineer|data_engineer|devops|product_manager), summary, key_points[], created_at — unique on (article_id, audience), generated on-demand and cached
- **bookmarks**: user_id, article_id, created_at
- **digest_subscriptions**: user_id, frequency, last_sent_at

RLS on every table; bookmarks/preferences scoped to owner; articles/summaries/sources/sectors readable by all authenticated users.

## Key Server Functions
- `getFeed({ filter: 'all' | 'mine', sector?, page })` — paginated articles with source + bookmark state
- `getArticle(id)` — full article
- `getSummary({ articleId, audience })` — returns cached summary or calls Lovable AI to generate, then caches
- `toggleBookmark(articleId)`
- `updatePreferences({ role, department, sectors })`
- `searchArticles(query)`

## Auth
- Email + password (Lovable Cloud)
- Google OAuth (Lovable Cloud)
- GitHub OAuth — not natively supported in Lovable Cloud; will use email+password and Google by default and surface a note that GitHub OAuth requires connecting Supabase directly. If you want GitHub now, we can swap to Supabase Integration setup.

## Bonus Features Included
- Bookmarks ✓
- Dark mode toggle ✓
- Source perspective tag (each article shows source as a chip; "perspective" framed as company-of-origin)
- Daily email digest: schema + opt-in UI included; actual email sending stubbed (requires Resend connector to fully send — flag for follow-up)

## Out of Scope (this iteration)
- RSS scraper / scheduled ingestion (you handle externally)
- Actually sending digest emails (UI + schema only; wire Resend later)

## Deliverables
- Full route structure + UI
- Postgres schema with RLS migrations
- Server functions for feed, summary generation (Lovable AI), bookmarks, preferences
- Seed data: ~6 sources, 7 sectors, a handful of placeholder articles so the UI is browsable immediately (you'll replace via your ingestion)
- Onboarding flow + settings page
