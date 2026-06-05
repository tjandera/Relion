import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/views/app-shell";
import { Avatar } from "./home";
import { StatusBadge } from "@/views/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getContact, updateContact, deleteContact, addNote, STATUSES, STATUS_LABEL, type ContactStatus } from "@/controllers/contacts.functions";
import { generateOutreach, saveMessage } from "@/controllers/ai.functions";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Copy, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contacts/$id")({
  component: ContactDetailPage,
});

function ContactDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchContact = useServerFn(getContact);
  const update = useServerFn(updateContact);
  const remove = useServerFn(deleteContact);
  const addNoteFn = useServerFn(addNote);

  const { data, isLoading } = useQuery({
    queryKey: ["contact", id],
    queryFn: () => fetchContact({ data: { id } }),
  });

  const [noteBody, setNoteBody] = useState("");

  if (isLoading) return <AppShell><div className="p-12 text-muted-foreground">Loading…</div></AppShell>;
  if (!data?.contact) return <AppShell><div className="p-12">Not found.</div></AppShell>;

  const c = data.contact;

  async function setStatus(status: ContactStatus) {
    await update({ data: { id, patch: { status, last_touch_at: new Date().toISOString() } } });
    await qc.invalidateQueries({ queryKey: ["contact", id] });
    await qc.invalidateQueries({ queryKey: ["dashboard"] });
    await qc.invalidateQueries({ queryKey: ["contacts"] });
  }

  async function setFollowUp(dateStr: string) {
    await update({ data: { id, patch: { follow_up_at: dateStr || null } } });
    await qc.invalidateQueries({ queryKey: ["contact", id] });
    await qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function onAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    await addNoteFn({ data: { contact_id: id, body: noteBody.trim() } });
    setNoteBody("");
    await qc.invalidateQueries({ queryKey: ["contact", id] });
    await qc.invalidateQueries({ queryKey: ["dashboard"] });
    toast.success("Note saved");
  }

  async function onDelete() {
    if (!confirm("Delete this contact and all notes? This can't be undone.")) return;
    await remove({ data: { id } });
    toast.success("Contact deleted");
    navigate({ to: "/contacts" });
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-12">
        <Link to="/contacts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Back to network
        </Link>

        <header className="flex items-start gap-5 mb-10">
          <div className="size-16 rounded-full bg-stone-100 ring-1 ring-black/5 flex items-center justify-center text-xl font-medium text-stone-500">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-medium tracking-tight">{c.name}</h1>
            <p className="text-muted-foreground mt-1">{[c.role, c.company].filter(Boolean).join(" · ") || "—"}</p>
            {c.how_met && <p className="text-sm text-muted-foreground mt-2 max-w-prose">{c.how_met}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-muted-foreground">
            <Trash2 className="size-4" />
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
          <section className="lg:col-span-7 space-y-8">
            <div className="p-6 rounded-2xl bg-surface ring-1 ring-black/5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <Label>Status</Label>
                  <Select value={c.status} onValueChange={(v) => setStatus(v as ContactStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 flex-1">
                  <Label>Follow up</Label>
                  <Input type="date" defaultValue={c.follow_up_at ?? ""} onBlur={(e) => setFollowUp(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.status} />
                {c.last_touch_at && <span className="text-xs text-muted-foreground">Last touch {format(parseISO(c.last_touch_at), "MMM d")}</span>}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-3">Notes</h2>
              <form onSubmit={onAddNote} className="space-y-2 mb-4">
                <Textarea
                  rows={3}
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="What did you talk about? What should you remember?"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!noteBody.trim()}>Add note</Button>
                </div>
              </form>
              <div className="space-y-3">
                {data.notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                ) : (
                  data.notes.map((n) => (
                    <div key={n.id} className="p-5 rounded-2xl bg-surface ring-1 ring-black/5">
                      <p className="text-xs text-muted-foreground mb-2">{format(parseISO(n.created_at), "MMM d, yyyy · h:mm a")}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{n.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="lg:col-span-5">
            <AIGenerator contactId={id} contactName={c.name} />
            {data.messages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Saved drafts</h3>
                <div className="space-y-3">
                  {data.messages.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl bg-surface ring-1 ring-black/5">
                      <p className="text-xs text-muted-foreground mb-2">{format(parseISO(m.created_at), "MMM d")}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.generated_body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function AIGenerator({ contactId, contactName }: { contactId: string; contactName: string }) {
  const qc = useQueryClient();
  const gen = useServerFn(generateOutreach);
  const save = useServerFn(saveMessage);
  const [ctx, setCtx] = useState("");
  const [tone, setTone] = useState<"warm" | "professional" | "casual">("warm");
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    setLoading(true);
    try {
      const { text } = await gen({ data: { contact_id: contactId, context: ctx || undefined, tone } });
      setDraft(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      if (msg.includes("429")) toast.error("Rate limit hit — try again in a minute.");
      else if (msg.includes("402")) toast.error("AI credits exhausted. Add credits in workspace settings.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    if (!draft) return;
    await save({ data: { contact_id: contactId, context_input: ctx || null, generated_body: draft } });
    await qc.invalidateQueries({ queryKey: ["contact", contactId] });
    await qc.invalidateQueries({ queryKey: ["dashboard"] });
    await qc.invalidateQueries({ queryKey: ["contacts"] });
    toast.success("Saved & marked as contacted");
  }

  function onCopy() {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    toast.success("Copied");
  }

  return (
    <div className="sticky top-6 p-6 rounded-2xl bg-surface ring-1 ring-black/5 space-y-4">
      <div>
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="size-4 text-brand" /> AI outreach generator
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Drafting a message to {contactName}</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Context (optional)</Label>
        <Textarea rows={3} value={ctx} onChange={(e) => setCtx(e.target.value)} placeholder="They just got promoted, or you saw their recent post about…" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Tone</Label>
        <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onGenerate} disabled={loading} className="w-full">
        {loading ? "Drafting…" : draft ? "Regenerate" : "Generate draft"}
      </Button>

      {draft && (
        <div className="space-y-2 pt-2">
          <div className="p-4 rounded-xl bg-background ring-1 ring-black/5 text-sm leading-relaxed whitespace-pre-wrap">
            {draft}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCopy} className="flex-1">
              <Copy className="size-4" /> Copy
            </Button>
            <Button onClick={onSave} className="flex-1">Save & mark sent</Button>
          </div>
        </div>
      )}
    </div>
  );
}
