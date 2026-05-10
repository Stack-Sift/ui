import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Newspaper, Sparkles, Bookmark, Layers } from "lucide-react";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";

const LANDING_TITLE = "Stack Sift — Curated tech signals ranked for your interests";
const LANDING_DESCRIPTION =
  "Read blog entries matched to your company context, preferred domain, tech interests, tags, and trend score.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: LANDING_TITLE },
      { name: "description", content: LANDING_DESCRIPTION },
      { property: "og:title", content: LANDING_TITLE },
      { property: "og:description", content: LANDING_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: LANDING_TITLE },
      { name: "twitter:description", content: LANDING_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Newspaper className="h-5 w-5 text-primary" />
            <span>Stack Sift</span>
          </Link>
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Ranked by tags and trend score
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Stack Sift
            <br />
            <span className="text-primary">filters the signal.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A personalized reading feed built from live blog entries. Tell us your company,
            domain, tech preferences, and interests, then get articles ranked around what matters.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/feed">
              <Button size="lg">Start reading free</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-3">
          {[
            {
              icon: Layers,
              title: "Live blog entries",
              body: "Read from the Supabase blog_entries database with source, domain, tags, and read time.",
            },
            {
              icon: Sparkles,
              title: "Interest ranking",
              body: "Your feed weighs tags, preferred domain, tech choices, and trend score.",
            },
            {
              icon: Bookmark,
              title: "Role summaries",
              body: "Switch between developer, CTO, PM, data, founder, and designer summaries.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-lg border border-border bg-card p-6">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold text-card-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
