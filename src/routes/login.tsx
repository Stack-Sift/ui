import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Newspaper } from "lucide-react";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Stack Sift" },
      { name: "description", content: "Sign in to your Stack Sift account." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: LoginPage,
});

function isUnconfirmedEmailError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === "email_not_confirmed") return true;
  const msg = (err.message ?? "").toLowerCase();
  return msg.includes("email not confirmed") || msg.includes("not confirmed");
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (isUnconfirmedEmailError(error)) {
        navigate({ to: "/check-email", search: { email } });
        return;
      }
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/feed" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
            <Newspaper className="h-5 w-5 text-primary" aria-hidden="true" />
            Stack Sift
          </Link>
          <div className="rounded-lg border border-border bg-card p-6">
            <h1 className="text-xl font-semibold text-card-foreground">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer variant="compact" />
    </div>
  );
}
