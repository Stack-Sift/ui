import { createFileRoute } from "@tanstack/react-router";
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
