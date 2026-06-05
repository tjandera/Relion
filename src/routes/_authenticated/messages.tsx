import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/views/app-shell";
import { listContacts } from "@/controllers/contacts.functions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "./home";
import { Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "AI Drafts · Relion" },
      { name: "description", content: "Generate thoughtful outreach messages for any contact in your network." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const fetchContacts = useServerFn(listContacts);
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: () => fetchContacts() });
  const [picked, setPicked] = useState<string>("");

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 md:py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-medium tracking-tight flex items-center gap-3">
            <Sparkles className="size-6 text-brand" /> AI Drafts
          </h1>
          <p className="text-muted-foreground text-pretty mt-2 max-w-[60ch]">
            Pick a contact and Relion will draft a personalized outreach message tuned to your career goal.
          </p>
        </header>

        {contacts.length === 0 ? (
          <div className="p-10 rounded-2xl bg-surface ring-1 ring-black/5 text-center">
            <p className="font-medium">Add a contact first.</p>
            <p className="text-sm text-muted-foreground mt-1">
              <Link to="/contacts" className="underline">Go to Network</Link> to add one.
            </p>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-surface ring-1 ring-black/5 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                Who do you want to reach out to?
              </label>
              <Select value={picked} onValueChange={setPicked}>
                <SelectTrigger><SelectValue placeholder="Choose a contact" /></SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.role || c.company ? `· ${[c.role, c.company].filter(Boolean).join(", ")}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {picked && (
              <Link
                to="/contacts/$id"
                params={{ id: picked }}
                className="block p-4 rounded-xl bg-background ring-1 ring-black/5 hover:ring-brand/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={contacts.find((c) => c.id === picked)?.name ?? "?"} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Open generator on contact</p>
                    <p className="text-xs text-muted-foreground">Add context and draft the message</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            )}
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Personalized", body: "Drafts use your goal, role, industry, and the relationship context." },
            { title: "Low-friction asks", body: "Every draft ends with a small ask that's easy to say yes to." },
            { title: "Tone control", body: "Warm, professional, or casual — match the relationship." },
          ].map((f) => (
            <div key={f.title} className="p-5 rounded-2xl bg-surface ring-1 ring-black/5">
              <p className="text-sm font-medium">{f.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
