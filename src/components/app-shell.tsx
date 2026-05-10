import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Newspaper,
  Globe2,
  User,
  Bookmark,
  Settings,
  Search,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Sector = { slug: string; name: string };

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tags, setTags] = useState<Sector[] | null>(null);
  const [search, setSearch] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc("get_tag_counts", { min_count: 2, max_results: 18 })
      .then(({ data }) => {
        if (cancelled) return;
        setTags((data ?? []).map((row) => ({ slug: row.tag, name: row.tag })));
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name ?? null));
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate({ to: "/feed", search: { q: search.trim() } as never });
  };

  const initials = getInitials(displayName, user?.email);
  const name = displayName ?? user?.email?.split("@")[0] ?? "User";

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Full-width top bar — theme + avatar always at extreme right */}
      <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        <Link to="/feed" className="flex items-center gap-2 font-semibold text-foreground">
          <Newspaper className="h-5 w-5 text-primary" />
          <span className="hidden md:inline">Stack Sift</span>
        </Link>
        <form onSubmit={onSearch} className="relative mx-2 max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="pl-9"
          />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-offset-background hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Profile menu"
                >
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" sideOffset={8} className="w-52">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate font-medium">{name}</span>
                  {user.email && (
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex cursor-pointer items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                  onSelect={async () => { await signOut(); navigate({ to: "/" }); }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
          <nav className="flex-1 overflow-y-auto p-3 text-sm">
            <NavItem to="/feed" icon={Globe2} label="All News" active={isActive("/feed")} />
            {user && <NavItem to="/feed/mine" icon={User} label="My Feed" active={isActive("/feed/mine")} />}

            <div className="mt-6 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tags
            </div>
            <div className="mt-2">
              {tags === null
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="mb-1 h-7 w-full rounded-md" />
                  ))
                : tags.map((s) => (
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
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <main>{children}</main>
          <Footer variant="compact" className="mt-8" />
        </div>
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
