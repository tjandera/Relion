import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/middleware/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  contact_id: z.string().uuid(),
  context: z.string().max(1000).optional(),
  tone: z.enum(["warm", "professional", "casual"]).default("warm"),
});

export const generateOutreach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const [profileRes, contactRes] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase
        .from("contacts")
        .select("*")
        .eq("id", data.contact_id)
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    if (contactRes.error || !contactRes.data) throw new Error("Contact not found");

    const profile = profileRes.data;
    const contact = contactRes.data;

    const prompt = `You are an expert networking coach helping an early-career professional write a short outreach message.

ABOUT THE SENDER:
- Name: ${profile?.full_name || "(unknown)"}
- Career goal: ${profile?.career_goal || "(not specified)"}
- Target industry: ${profile?.target_industry || "(not specified)"}
- Target role: ${profile?.target_role || "(not specified)"}

ABOUT THE RECIPIENT:
- Name: ${contact.name}
- Role: ${contact.role || "(unknown)"}
- Company: ${contact.company || "(unknown)"}
- How they met: ${contact.how_met || "(not specified)"}
- Current relationship status: ${contact.status}

EXTRA CONTEXT FROM SENDER: ${data.context || "(none)"}

TONE: ${data.tone}

Write ONE concise outreach message (90-130 words). No subject line. No placeholders like [Your Name]. Reference something specific about the recipient. End with a small, low-friction ask (a 15-min chat, a question, or feedback). Return only the message text.`;

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });

    return { text: text.trim() };
  });

export const saveMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        contact_id: z.string().uuid(),
        context_input: z.string().max(1000).optional().nullable(),
        generated_body: z.string().min(1).max(5000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("messages")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    // Bump contact to "contacted"
    await context.supabase
      .from("contacts")
      .update({ status: "contacted", last_touch_at: new Date().toISOString() })
      .eq("id", data.contact_id)
      .eq("user_id", context.userId);
    return { ok: true };
  });
