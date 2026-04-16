import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Newspaper,
  Globe2,
  User,
  Bookmark,
  Settings,
  Search,
  Moon,
  Sun,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Sector = { slug: string; name: string };

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("sectors")
      .select("slug, name")
      .order("name")
      .then(({ data }) => setSectors(data ?? []));
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate({ to: "/feed", search: { q: search.trim() } as never });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4 font-semibold text-sidebar-foreground">
          <Newspaper className="h-5 w-5 text-primary" />
          TechPulse
        </div>
        <nav className="flex-1 overflow-y-auto p-3 text-sm">
          <NavItem to="/feed" icon={Globe2} label="All News" active={isActive("/feed")} />
          <NavItem to="/feed/mine" icon={User} label="My Feed" active={isActive("/feed/mine")} />

          <div className="mt-6 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sectors
          </div>
          <div className="mt-2">
            {sectors.map((s) => (
              <NavItem
                key={s.slug}
                to="/sector/$slug"
                params={{ slug: s.slug }}
                icon={Sparkles}
                label={s.name}
                active={location.pathname === `/sector/${s.slug}`}
              />
            ))}
          </div>

          <div className="mt-6 border-t border-sidebar-border pt-3">
            <NavItem to="/bookmarks" icon={Bookmark} label="Bookmarks" active={isActive("/bookmarks")} />
            <NavItem to="/settings" icon={Settings} label="Settings" active={isActive("/settings")} />
          </div>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="truncate px-2 text-xs text-muted-foreground">{user?.email}</div>
          <Button variant="ghost" size="sm" className="mt-1 w-full justify-start" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
          <form onSubmit={onSearch} className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              className="pl-9"
            />
          </form>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  params,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  params?: Record<string, string>;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to as never}
      params={params as never}
      className={cn(
        "mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-sidebar-foreground hover:bg-sidebar-accent",
        active && "bg-sidebar-accent font-medium",
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
