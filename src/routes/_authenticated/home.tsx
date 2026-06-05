import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/views/app-shell";
import { getProfile, updateProfile } from "@/controllers/profile.functions";
import { getDashboard } from "@/controllers/contacts.functions";
import { StatusBadge } from "@/views/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@tanstack/react-router";
import { format, isPast, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home · Relion" },
      { name: "description", content: "Your networking dashboard: follow-ups, recent notes, and outreach activity." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const fetchDashboard = useServerFn(getDashboard);
  const saveProfile = useServerFn(updateProfile);

  const { data: profile, isLoading: profileLoading } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard(), enabled: !!profile?.onboarded });

  const [form, setForm] = useState({ full_name: "", career_goal: "", target_industry: "", target_role: "" });

  useEffect(() => {
    if (profile && !profile.onboarded) {
      setForm({
        full_name: profile.full_name ?? "",
        career_goal: profile.career_goal ?? "",
        target_industry: profile.target_industry ?? "",
        target_role: profile.target_role ?? "",
      });
    }
  }, [profile]);

  if (profileLoading) {
    return (
      <AppShell>
        <div className="p-12 text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  if (profile && !profile.onboarded) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-6 md:px-10 py-12">
          <h1 className="text-3xl font-medium tracking-tight mb-2">Let's set you up</h1>
          <p className="text-muted-foreground mb-8 text-pretty">
            A few details so Relion can help you network with intention. You can change these any time.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await saveProfile({ data: form });
                await qc.invalidateQueries({ queryKey: ["profile"] });
                toast.success("You're all set");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            }}
            className="space-y-5 p-8 rounded-2xl bg-surface ring-1 ring-black/5"
          >
            <Field label="Your full name">
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </Field>
            <Field label="Career goal" hint="One sentence — what are you working toward?">
              <Textarea
                rows={2}
                value={form.career_goal}
                onChange={(e) => setForm({ ...form, career_goal: e.target.value })}
                placeholder="Break into product management at an early-stage fintech in the next 6 months."
                required
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Target industry">
                <Input value={form.target_industry} onChange={(e) => setForm({ ...form, target_industry: e.target.value })} placeholder="Fintech" required />
              </Field>
              <Field label="Target role">
                <Input value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })} placeholder="Associate Product Manager" required />
              </Field>
            </div>
            <Button type="submit" className="w-full">Continue</Button>
          </form>
        </div>
      </AppShell>
    );
  }

  const followUps = dash?.followUps ?? [];
  const recentNotes = dash?.recentNotes ?? [];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-medium tracking-tight text-balance mb-2">
            Good {greeting()}, {profile?.full_name?.split(" ")[0] || "there"}.
          </h1>
          <p className="text-muted-foreground text-pretty max-w-[60ch]">
            {followUps.length > 0
              ? `You have ${followUps.length} ${followUps.length === 1 ? "person" : "people"} to follow up with today. Focus on quality, not volume.`
              : "Your network is quiet today. A great moment to reach out to someone new."}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10">
          <Metric label="Active connections" value={dash?.activeConnections ?? 0} />
          <Metric label="Pending follow-ups" value={dash?.pendingFollowUps ?? 0} />
          <Metric label="Replies this week" value={dash?.repliesThisWeek ?? 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
          <section className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Follow up today</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/contacts" })}>
                View all
              </Button>
            </div>
            {followUps.length === 0 ? (
              <Empty title="Nothing to follow up on" subtitle="Add a contact with a follow-up date to see it here." />
            ) : (
              <div className="space-y-3">
                {followUps.map((c) => (
                  <Link
                    key={c.id}
                    to="/contacts/$id"
                    params={{ id: c.id }}
                    className="block p-4 rounded-2xl bg-surface ring-1 ring-black/5 hover:ring-brand/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar name={c.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 justify-between">
                          <h3 className="text-sm font-medium truncate">{c.name}</h3>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {[c.role, c.company].filter(Boolean).join(" · ") || "—"}
                        </p>
                        {c.follow_up_at && (
                          <p
                            className={`text-[11px] mt-1 ${
                              isPast(parseISO(c.follow_up_at)) ? "text-amber-700" : "text-muted-foreground"
                            }`}
                          >
                            Follow up {format(parseISO(c.follow_up_at), "MMM d")}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="lg:col-span-5 space-y-4">
            <h2 className="text-lg font-medium">Recent notes</h2>
            {recentNotes.length === 0 ? (
              <Empty title="No notes yet" subtitle="Add a note after every meaningful conversation." />
            ) : (
              <div className="space-y-3">
                {recentNotes.map((n: any) => (
                  <div key={n.id} className="p-5 rounded-2xl bg-surface ring-1 ring-black/5">
                    <p className="text-xs text-muted-foreground mb-2">
                      {format(parseISO(n.created_at), "MMM d, yyyy")} · {n.contacts?.name ?? "Contact"}
                    </p>
                    <p className="text-sm text-pretty leading-relaxed line-clamp-4">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-6 rounded-2xl bg-surface ring-1 ring-black/5">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-medium tabular-nums">{value}</p>
    </div>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="p-8 rounded-2xl bg-surface ring-1 ring-black/5 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="size-10 rounded-full bg-stone-100 ring-1 ring-black/5 flex items-center justify-center text-sm font-medium text-stone-500 shrink-0">
      {initial}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
