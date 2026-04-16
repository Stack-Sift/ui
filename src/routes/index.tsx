import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Newspaper, Sparkles, Bookmark, Layers } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TechPulse — Engineering blogs, AI-summarized for your role" },
      {
        name: "description",
        content:
          "Aggregate Netflix, Uber, Meta, Google and more. Get AI summaries tailored to engineers, data, devops, and PMs.",
      },
    ],
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
            <span>TechPulse</span>
          </Link>
          <nav className="flex items-center gap-3">
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
            <Sparkles className="h-3 w-3" /> AI summaries tailored to your role
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Engineering blogs,
            <br />
            <span className="text-primary">summarized for you.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            One feed for Netflix, Uber, Meta, Google, Airbnb, Stripe and more.
            Get the gist in 30 seconds — written for your role.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/signup">
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
              title: "All the best blogs",
              body: "Netflix, Uber, Meta, Google, Airbnb, Stripe — one feed.",
            },
            {
              icon: Sparkles,
              title: "Role-based summaries",
              body: "Software, Data, DevOps, PM — pick your lens.",
            },
            {
              icon: Bookmark,
              title: "Save & organize",
              body: "Bookmark articles, follow sectors, get a daily digest.",
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

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © TechPulse — built on Lovable.
      </footer>
    </div>
  );
}
