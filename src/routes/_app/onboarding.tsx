import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ROLES = [
  { value: "developer", label: "Developer" },
  { value: "cto", label: "CTO / Engineering Leader" },
  { value: "pm", label: "Product Manager" },
  { value: "data_scientist", label: "Data Scientist" },
  { value: "founder", label: "Founder" },
  { value: "designer", label: "Designer" },
  { value: "other", label: "Other" },
];

const TECH_TAG_LIMIT = 30;

export function ProfileForm({ mode }: { mode: "onboarding" | "settings" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<string>("developer");
  const [company, setCompany] = useState("");
  const [preferredDomain, setPreferredDomain] = useState("");
  const [domains, setDomains] = useState<string[] | null>(null);
  const [topTags, setTopTags] = useState<string[] | null>(null);
  const [techPreferences, setTechPreferences] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      supabase.rpc("get_domain_counts"),
      supabase.rpc("get_tag_counts", { min_count: 1, max_results: TECH_TAG_LIMIT }),
      supabase
        .from("profiles")
        .select("display_name, role, company, preferred_domain, tech_preferences, interests, digest_enabled")
        .eq("id", user.id)
        .maybeSingle(),
    ]).then(([{ data: domainRows }, { data: tagRows }, { data: profile }]) => {
      if (cancelled) return;
      setDomains((domainRows ?? []).map((row) => row.domain));
      setTopTags((tagRows ?? []).map((row) => row.tag));
      if (profile) {
        setDisplayName(profile.display_name ?? "");
        setRole(profile.role ?? "developer");
        setCompany(profile.company ?? "");
        setPreferredDomain(profile.preferred_domain ?? "");
        setTechPreferences(profile.tech_preferences ?? []);
        setInterests(profile.interests ?? []);
        setDigestEnabled(profile.digest_enabled ?? false);
      }
      setProfileLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleValue = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((selected) => (selected.includes(value) ? selected.filter((x) => x !== value) : [...selected, value]));
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error: pErr } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: displayName,
        role,
        company,
        preferred_domain: preferredDomain || null,
        tech_preferences: techPreferences,
        interests,
        digest_enabled: digestEnabled,
        onboarded: true,
      }, { onConflict: "id" });
    setSaving(false);
    if (pErr) {
      toast.error(pErr.message);
      return;
    }
    toast.success("Saved!");
    if (mode === "onboarding") navigate({ to: "/feed" });
  };

  if (!profileLoaded || domains === null || topTags === null) {
    return <ProfileFormSkeleton />;
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="dn">Display name</Label>
          <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" placeholder="Acme, Inc." value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Preferred domain</Label>
        <p className="mb-3 text-xs text-muted-foreground">Used with tags and trend score to rank your feed.</p>
        <Select value={preferredDomain} onValueChange={setPreferredDomain}>
          <SelectTrigger><SelectValue placeholder="Pick a domain" /></SelectTrigger>
          <SelectContent>
            {domains.map((domain) => (
              <SelectItem key={domain} value={domain}>{domain}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tech preferences</Label>
        <p className="mb-3 text-xs text-muted-foreground">Specific technologies tagged across the catalog. Showing the most common.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {topTags.map((tag) => (
            <label key={`tech-${tag}`} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card p-3 text-sm">
              <Checkbox checked={techPreferences.includes(tag)} onCheckedChange={() => toggleValue(tag, setTechPreferences)} />
              <span className="capitalize">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Interests</Label>
        <p className="mb-3 text-xs text-muted-foreground">Broad domains we cover. Pick any that should weigh into your feed.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {domains.map((domain) => (
            <label key={`interest-${domain}`} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card p-3 text-sm">
              <Checkbox checked={interests.includes(domain)} onCheckedChange={() => toggleValue(domain, setInterests)} />
              <span>{domain}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border p-4">
        <div>
          <Label className="cursor-pointer">Daily email digest</Label>
          <p className="text-xs text-muted-foreground">Get a daily roundup. (Email delivery coming soon.)</p>
        </div>
        <Switch checked={digestEnabled} onCheckedChange={setDigestEnabled} />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : mode === "onboarding" ? "Get started" : "Save changes"}
      </Button>
    </form>
  );
}

function ProfileFormSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — Stack Sift" },
      { name: "description", content: "Set up your Stack Sift profile and pick the topics you care about." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center gap-2 font-semibold">
        <Newspaper className="h-5 w-5 text-primary" /> Stack Sift
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome! Let's personalize your feed.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tell us a bit about you. You can change this anytime in Settings.
      </p>
      <div className="mt-8">
        <ProfileForm mode="onboarding" />
      </div>
    </div>
  );
}
