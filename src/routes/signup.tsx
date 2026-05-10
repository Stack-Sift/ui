import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Newspaper } from "lucide-react";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Stack Sift" },
      { name: "description", content: "Create a Stack Sift account to read curated tech blog entries ranked for your role and interests." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Supabase user-enumeration mitigation: if the email already exists,
    // signUp succeeds with empty identities. Tell the user clearly.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("An account with this email already exists. Try signing in.");
      navigate({ to: "/login" });
      return;
    }

    // Session present → email confirmation is disabled on the project, user is logged in.
    if (data.session) {
      toast.success("Account created!");
      navigate({ to: "/onboarding" });
      return;
    }

    // No session → confirmation required. Send to the dedicated UI.
    navigate({ to: "/check-email", search: { email } });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ThemeToggle className="fixed right-4 top-4 z-50" />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
            <Newspaper className="h-5 w-5 text-primary" aria-hidden="true" /> Stack Sift
          </Link>
          <div className="rounded-lg border border-border bg-card p-6">
            <h1 className="text-xl font-semibold text-card-foreground">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Start reading in 30 seconds.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
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
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">At least 6 characters.</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating…" : "Create account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer variant="compact" />
    </div>
  );
}
