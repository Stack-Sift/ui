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

const ROLES = [
  { value: "software_engineer", label: "Software Engineer" },
  { value: "data_engineer", label: "Data Engineer" },
  { value: "devops", label: "DevOps / SRE" },
  { value: "product_manager", label: "Product Manager" },
  { value: "other", label: "Other" },
];

type Sector = { slug: string; name: string };

export function ProfileForm({ mode }: { mode: "onboarding" | "settings" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<string>("software_engineer");
  const [department, setDepartment] = useState("");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("sectors").select("slug, name").order("name").then(({ data }) => setSectors(data ?? []));
    supabase
      .from("profiles")
      .select("display_name, role, department")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setRole(data.role ?? "software_engineer");
          setDepartment(data.department ?? "");
        }
      });
    supabase
      .from("user_preferences")
      .select("sectors, digest_enabled")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSelectedSectors(data.sectors ?? []);
          setDigestEnabled(data.digest_enabled ?? false);
        }
      });
  }, [user]);

  const toggleSector = (slug: string) => {
    setSelectedSectors((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        role: role as never,
        department,
        onboarded: true,
      })
      .eq("id", user.id);
    const { error: prErr } = await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, sectors: selectedSectors, digest_enabled: digestEnabled }, { onConflict: "user_id" });
    setSaving(false);
    if (pErr || prErr) {
      toast.error((pErr ?? prErr)!.message);
      return;
    }
    toast.success("Saved!");
    if (mode === "onboarding") navigate({ to: "/feed" });
  };

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="dn">Display name</Label>
          <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="dept">Department</Label>
          <Input id="dept" placeholder="Backend, Frontend, Infra…" value={department} onChange={(e) => setDepartment(e.target.value)} />
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
        <Label>Preferred sectors</Label>
        <p className="mb-3 text-xs text-muted-foreground">Used to filter your "My Feed".</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {sectors.map((s) => (
            <label key={s.slug} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card p-3 text-sm">
              <Checkbox checked={selectedSectors.includes(s.slug)} onCheckedChange={() => toggleSector(s.slug)} />
              <span>{s.name}</span>
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

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — TechPulse" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center gap-2 font-semibold">
        <Newspaper className="h-5 w-5 text-primary" /> TechPulse
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
