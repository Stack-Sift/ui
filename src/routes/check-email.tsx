import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MailCheck, Newspaper } from "lucide-react";
import { Footer } from "@/components/footer";

const RESEND_COOLDOWN_SECONDS = 30;

export const Route = createFileRoute("/check-email")({
  validateSearch: (s: Record<string, unknown>): { email?: string } =>
    typeof s.email === "string" && s.email.length > 0 ? { email: s.email } : {},
  head: () => ({
    meta: [
      { title: "Check your email — Stack Sift" },
      { name: "description", content: "Confirm your email to finish setting up your Stack Sift account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  const navigate = useNavigate();
  const { email: emailFromUrl } = Route.useSearch();
  const [email, setEmail] = useState(emailFromUrl ?? "");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-route into the app the moment the user confirms their email in another tab.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        toast.success("Email confirmed!");
        navigate({ to: "/onboarding" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const onResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter the email you signed up with.");
      return;
    }
    if (cooldown > 0) return;

    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    setResending(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Confirmation email sent to ${email}`);
    startCooldown();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
            <Newspaper className="h-5 w-5 text-primary" aria-hidden="true" />
            Stack Sift
          </Link>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-center text-xl font-semibold text-card-foreground">
              Check your email
            </h1>
            {emailFromUrl ? (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                We sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{emailFromUrl}</span>. Click it to
                activate your account, then come back to sign in.
              </p>
            ) : (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                We sent a confirmation link to your email. Click it to activate your account, then
                come back to sign in.
              </p>
            )}

            <ol className="mt-6 list-decimal space-y-2 rounded-md bg-muted/50 p-4 pl-8 text-sm text-muted-foreground">
              <li>Open the email from Stack Sift.</li>
              <li>Click the confirmation link.</li>
              <li>You'll be brought back here automatically.</li>
            </ol>

            <div className="mt-6 border-t border-border pt-4">
              <p className="text-sm font-medium text-card-foreground">Didn't get the email?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check your spam folder, or resend the confirmation email below.
              </p>
              <form onSubmit={onResend} className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="resend-email" className="sr-only">
                    Email
                  </Label>
                  <Input
                    id="resend-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={resending || cooldown > 0}
                >
                  {resending
                    ? "Sending…"
                    : cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : "Resend confirmation email"}
                </Button>
              </form>
            </div>

            <div className="mt-6 flex justify-center gap-3 border-t border-border pt-4 text-sm">
              <Link to="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link to="/signup" className="text-muted-foreground hover:text-primary hover:underline">
                Use a different email
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer variant="compact" />
    </div>
  );
}
