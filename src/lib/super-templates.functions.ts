import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth } from "@/lib/super-auth.server";
import { getServerEnv } from "@/lib/server-env";

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

const _st = z.string().optional();

export const getTemplates = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ _st }).parse(input ?? {}))
  .handler(async ({ data }): Promise<MessageTemplate[]> => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin: _sa } = await import("@/integrations/supabase/client.server");
    const db = _sa as any;
    const { data: rows, error } = await db
      .from("message_templates")
      .select("*")
      .order("type")
      .order("event");
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({ ...r, variables: Array.isArray(r.variables) ? r.variables : [] })) as MessageTemplate[];
  });

const templateSchema = z.object({
  _st,
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
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin: _sa } = await import("@/integrations/supabase/client.server");
    const db = _sa as any;
    const payload = {
      name:      data.name,
      type:      data.type,
      event:     data.event,
      subject:   data.subject ?? null,
      body:      data.body,
      variables: data.variables,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await db.from("message_templates").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("message_templates").insert(payload);
      if (error) throw new Error(error.message);
    }
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st, id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st ?? null);
    const { supabaseAdmin: _sa } = await import("@/integrations/supabase/client.server");
    const db = _sa as any;
    const { error } = await db.from("message_templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
  });

export type SendTestResult = { ok: boolean; message: string };

export const sendTestEmail = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      _st:       z.string().optional(),
      id:        z.string().uuid(),
      recipient: z.string().email("E-mail inválido"),
    }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<SendTestResult> => {
    await requireSuperAuth(data._st ?? null);

    const apiKey = getServerEnv("RESEND_API_KEY");
    if (!apiKey) return { ok: false, message: "RESEND_API_KEY não configurado no .env" };

    const { supabaseAdmin: _sa } = await import("@/integrations/supabase/client.server");
    const db = _sa as any;
    const { data: row, error } = await db
      .from("message_templates")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) return { ok: false, message: "Template não encontrado" };
    if (row.type !== "email") return { ok: false, message: "Este template não é do tipo e-mail" };

    // Substitui variáveis por valores de exemplo
    const sampleVars: Record<string, string> = {
      nome:            "Profissional Teste",
      dias_restantes:  "3",
      link_pagamento:  "https://suaagenda.pro/plano",
      data_vencimento: new Date(Date.now() + 3 * 86_400_000).toLocaleDateString("pt-BR"),
    };
    let html = row.body as string;
    let subject = (row.subject as string) ?? "Mensagem de teste — SuaAgenda.Pro";
    for (const [k, v] of Object.entries(sampleVars)) {
      html    = html.replaceAll(`{{${k}}}`, v);
      subject = subject.replaceAll(`{{${k}}}`, v);
    }

    const from = getServerEnv("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: data.recipient,
      subject,
      html,
    });

    if (result.error) {
      return { ok: false, message: `Erro Resend: ${result.error.message}` };
    }

    return { ok: true, message: `E-mail enviado para ${data.recipient} (ID: ${result.data?.id ?? "—"})` };
  });

export const previewTemplate = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, body: z.string(), variables: z.record(z.string()) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ html: string }> => {
    await requireSuperAuth(data._st ?? null);
    let html = data.body;
    for (const [key, val] of Object.entries(data.variables)) {
      html = html.replaceAll(`{{${key}}}`, val);
    }
    return { html };
  });
