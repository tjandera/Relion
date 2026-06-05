import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/views/app-shell";
import { Avatar } from "./home";
import { StatusBadge } from "@/views/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listContacts, createContact, STATUSES, STATUS_LABEL, type ContactStatus } from "@/controllers/contacts.functions";
import { Plus } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => ({
    meta: [
      { title: "Network · Relion" },
      { name: "description", content: "Track every meaningful professional connection in one warm, focused place." },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const fetchContacts = useServerFn(listContacts);
  const { data: contacts = [], isLoading } = useQuery({ queryKey: ["contacts"], queryFn: () => fetchContacts() });

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-12">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Network</h1>
            <p className="text-muted-foreground text-sm mt-1">Everyone you're building a relationship with.</p>
          </div>
          <AddContactDialog />
        </header>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : contacts.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface ring-1 ring-black/5 text-center">
            <p className="font-medium">Your network is a blank canvas.</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Add your first contact to get started.</p>
            <AddContactDialog />
          </div>
        ) : (
          <div className="rounded-2xl bg-surface ring-1 ring-black/5 overflow-hidden">
            {contacts.map((c, i) => (
              <Link
                key={c.id}
                to="/contacts/$id"
                params={{ id: c.id }}
                className={`flex items-center gap-4 p-4 hover:bg-stone-100/50 transition-colors ${
                  i > 0 ? "border-t border-stone-200/60" : ""
                }`}
              >
                <Avatar name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium truncate">{c.name}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {[c.role, c.company].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground hidden sm:block whitespace-nowrap">
                  {formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function AddContactDialog() {
  const qc = useQueryClient();
  const create = useServerFn(createContact);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
    company: "",
    how_met: "",
    status: "not_contacted" as ContactStatus,
    follow_up_at: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await create({
        data: {
          name: form.name,
          role: form.role || null,
          company: form.company || null,
          how_met: form.how_met || null,
          status: form.status,
          follow_up_at: form.follow_up_at || null,
        },
      });
      await qc.invalidateQueries({ queryKey: ["contacts"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Contact added");
      setOpen(false);
      setForm({ name: "", role: "", company: "", how_met: "", status: "not_contacted", follow_up_at: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Add contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Product Manager" />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Stripe" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>How you met</Label>
            <Textarea rows={2} value={form.how_met} onChange={(e) => setForm({ ...form, how_met: e.target.value })} placeholder="Mutual friend introduced us at a fintech meetup." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ContactStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Follow up on</Label>
              <Input type="date" value={form.follow_up_at} onChange={(e) => setForm({ ...form, follow_up_at: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">{saving ? "Saving…" : "Add contact"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
