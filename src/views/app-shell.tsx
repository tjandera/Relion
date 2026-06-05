import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { LayoutDashboard, Users, Sparkles, LogOut } from "lucide-react";
import { supabase } from "@/models/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/controllers/profile.functions";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/home", label: "Home", icon: LayoutDashboard },
  { to: "/contacts", label: "Network", icon: Users },
  { to: "/messages", label: "AI Drafts", icon: Sparkles },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const fetchProfile = useServerFn(getProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-stone-200/60 bg-surface p-6 flex-col gap-8 sticky top-0 h-screen">
          <Link to="/home" className="flex items-center gap-2.5 px-2">
            <div className="size-6 rounded-full bg-brand flex items-center justify-center">
              <div className="size-2 bg-background rounded-full" />
            </div>
            <span className="font-medium tracking-tight text-lg">Relion</span>
          </Link>

          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = path === item.to || (item.to !== "/home" && path.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-stone-200/50 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-stone-100/60",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="p-4 rounded-xl bg-stone-100 ring-1 ring-black/5">
              <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Daily intention</p>
              <p className="text-sm text-pretty leading-relaxed">Reach out to one person who could change your career trajectory this month.</p>
            </div>

            <div className="flex items-center justify-between px-2">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{profile?.full_name || "Welcome"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{profile?.target_role || "Set your goal"}</p>
              </div>
              <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Sign out">
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-surface border-b border-stone-200/60 px-4 h-14 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-brand flex items-center justify-center">
              <div className="size-2 bg-background rounded-full" />
            </div>
            <span className="font-medium tracking-tight">Relion</span>
          </Link>
          <button onClick={signOut} className="text-muted-foreground" aria-label="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>

        <main className="flex-1 min-w-0 pt-14 md:pt-0 pb-20 md:pb-0">
          {children ?? <Outlet />}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-stone-200/60 flex justify-around py-2">
          {NAV.map((item) => {
            const active = path === item.to || (item.to !== "/home" && path.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg text-[10px]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
