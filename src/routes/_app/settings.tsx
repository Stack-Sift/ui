import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileForm } from "./onboarding";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Stack Sift" },
      { name: "description", content: "Update your Stack Sift profile, preferences, and notifications." },
      { name: "robots", content: "noindex" },
    ],
  }),
  pendingMs: 0,
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);
  if (loading || !user) return <div className="mx-auto max-w-2xl px-6 py-8"><Skeleton className="h-8 w-48" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Profile, preferences, and notifications.</p>
      <div className="mt-8">
        <ProfileForm mode="settings" />
      </div>
    </div>
  );
}
