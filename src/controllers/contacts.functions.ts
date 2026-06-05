import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/middleware/auth-middleware";
import { z } from "zod";

export const STATUSES = [
  "not_contacted",
  "contacted",
  "replied",
  "follow_up",
  "nurturing",
] as const;
export type ContactStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<ContactStatus, string> = {
  not_contacted: "Not contacted",
  contacted: "Contacted",
  replied: "Replied",
  follow_up: "Follow-up",
  nurturing: "Nurturing",
};

export const listContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("contacts")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const [contactRes, notesRes, messagesRes] = await Promise.all([
      context.supabase.from("contacts").select("*").eq("id", data.id).eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("notes").select("*").eq("contact_id", data.id).order("created_at", { ascending: false }),
      context.supabase.from("messages").select("*").eq("contact_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (contactRes.error) throw new Error(contactRes.error.message);
    return {
      contact: contactRes.data,
      notes: notesRes.data ?? [],
      messages: messagesRes.data ?? [],
    };
  });

const CreateContactInput = z.object({
  name: z.string().min(1).max(120),
  role: z.string().max(120).optional().nullable(),
  company: z.string().max(120).optional().nullable(),
  how_met: z.string().max(500).optional().nullable(),
  status: z.enum(STATUSES).default("not_contacted"),
  follow_up_at: z.string().nullable().optional(),
});

export const createContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateContactInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("contacts")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const UpdateContactInput = z.object({
  id: z.string().uuid(),
  patch: z.object({
    name: z.string().min(1).max(120).optional(),
    role: z.string().max(120).optional().nullable(),
    company: z.string().max(120).optional().nullable(),
    how_met: z.string().max(500).optional().nullable(),
    status: z.enum(STATUSES).optional(),
    follow_up_at: z.string().nullable().optional(),
    last_touch_at: z.string().nullable().optional(),
  }),
});

export const updateContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateContactInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("contacts")
      .update({ ...data.patch, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("contacts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ contact_id: z.string().uuid(), body: z.string().min(1).max(2000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notes")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const uid = context.userId;
    const todayIso = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [allContactsRes, followUpsRes, repliesRes, recentNotesRes] = await Promise.all([
      sb.from("contacts").select("id,status").eq("user_id", uid),
      sb
        .from("contacts")
        .select("*")
        .eq("user_id", uid)
        .not("follow_up_at", "is", null)
        .lte("follow_up_at", todayIso)
        .order("follow_up_at", { ascending: true })
        .limit(10),
      sb.from("contacts").select("id").eq("user_id", uid).eq("status", "replied").gte("updated_at", weekAgo),
      sb
        .from("notes")
        .select("id,body,created_at,contact_id,contacts(name)")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    const all = allContactsRes.data ?? [];
    return {
      activeConnections: all.filter((c) => c.status !== "not_contacted").length,
      pendingFollowUps: (followUpsRes.data ?? []).length,
      repliesThisWeek: (repliesRes.data ?? []).length,
      followUps: followUpsRes.data ?? [],
      recentNotes: recentNotesRes.data ?? [],
    };
  });
