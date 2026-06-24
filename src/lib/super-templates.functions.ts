import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";

export type MessageTemplate = {
  id: string;
  name: string;
  type: "email" | "whatsapp";
  event: string;
  subject: string | null;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const getTemplates = createServerFn({ method: "GET" }).handler(
  async (): Promise<MessageTemplate[]> => {
    await requireSuperAuth();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("message_templates")
      .select("*")
      .order("type")
      .order("event");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ ...r, variables: Array.isArray(r.variables) ? r.variables : [] })) as MessageTemplate[];
  },
);

const templateSchema = z.object({
  id:         z.string().uuid().optional(),
  name:       z.string().min(1),
  type:       z.enum(["email", "whatsapp"]),
  event:      z.string().min(1),
  subject:    z.string().nullable().optional(),
  body:       z.string().min(1),
  variables:  z.array(z.string()),
  is_active:  z.boolean(),
});

export const upsertTemplate = createServerFn({ method: "POST" })
  .validator((input: unknown) => templateSchema.parse(input))
  .handler(async ({ data }) => {
    await requireSuperAuth();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: Record<string, unknown> = {
      name:      data.name,
      type:      data.type,
      event:     data.event,
      subject:   data.subject ?? null,
      body:      data.body,
      variables: data.variables,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("message_templates")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("message_templates")
        .insert(payload);
      if (error) throw new Error(error.message);
    }
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await requireSuperAuth();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("message_templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
  });

export const previewTemplate = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ body: z.string(), variables: z.record(z.string()) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ html: string }> => {
    await requireSuperAuth();
    let html = data.body;
    for (const [key, val] of Object.entries(data.variables)) {
      html = html.replaceAll(`{{${key}}}`, val);
    }
    return { html };
  });
