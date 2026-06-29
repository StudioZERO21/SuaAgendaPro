import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAuth, getSuperAuthEmail } from "@/lib/super-auth.server";

const _st = z.string();

export type SuperAdminProfile = {
  email: string;
  name: string;
  mfaEnabled: boolean;
  mustChangePassword: boolean;
};

// ─── Perfil do admin logado ───────────────────────────────────────────────────

export const getMyProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st }).parse(input))
  .handler(async ({ data }): Promise<SuperAdminProfile> => {
    await requireSuperAuth(data._st);
    const email = await getSuperAuthEmail(data._st);
    if (!email) throw new Error("Unauthorized");
    const { getDbSuperAdmin, isMfaEnabled } = await import("./super-totp.server");
    const dbAdmin = await getDbSuperAdmin(email);
    const [mfaEnabled] = await Promise.all([isMfaEnabled(email)]);
    return {
      email,
      name:               dbAdmin?.name ?? email.split("@")[0],
      mfaEnabled,
      mustChangePassword: dbAdmin?.must_change_password ?? false,
    };
  });

export const updateMyName = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st, name: z.string().min(2).max(80) }).parse(input))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st);
    const email = await getSuperAuthEmail(data._st);
    if (!email) throw new Error("Unauthorized");
    const { getDbSuperAdmin, updateDbSuperAdminName, getSuperAdmins, upsertDbSuperAdmin, hashPassword } =
      await import("./super-totp.server");
    const dbAdmin = await getDbSuperAdmin(email);
    if (dbAdmin) {
      await updateDbSuperAdminName(email, data.name.trim());
    } else {
      // Primeiro acesso — cria o registro migrando credenciais do env var
      const envAdmin = getSuperAdmins().find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (!envAdmin) throw new Error("Admin não encontrado nas credenciais do servidor.");
      await upsertDbSuperAdmin({
        email:                email.toLowerCase(),
        name:                 data.name.trim(),
        password_hash:        hashPassword(envAdmin.password),
        must_change_password: envAdmin.must_change_password ?? false,
      });
    }
    return { ok: true };
  });

export const changeMyPassword = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, currentPassword: z.string().min(1), newPassword: z.string().min(8) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st);
    const email = await getSuperAuthEmail(data._st);
    if (!email) throw new Error("Unauthorized");
    const { getDbSuperAdmin, verifyPassword, hashPassword, updateDbSuperAdminPassword, getSuperAdmins } =
      await import("./super-totp.server");
    const { timingSafeEqual } = await import("node:crypto");

    const dbAdmin = await getDbSuperAdmin(email);
    if (dbAdmin) {
      if (!verifyPassword(data.currentPassword, dbAdmin.password_hash)) {
        await new Promise((r) => setTimeout(r, 500));
        throw new Error("Senha atual incorreta.");
      }
      await updateDbSuperAdminPassword(email, hashPassword(data.newPassword));
      return { ok: true };
    }

    // Fallback: check env var admin
    const admins = getSuperAdmins();
    const envAdmin = admins.find((a) => {
      try {
        const ab = Buffer.from(a.email.toLowerCase());
        const eb = Buffer.from(email.toLowerCase());
        return ab.length === eb.length && timingSafeEqual(ab, eb);
      } catch { return false; }
    });
    if (!envAdmin) throw new Error("Admin não encontrado.");
    const pBuf = Buffer.from(data.currentPassword);
    const eP   = Buffer.from(envAdmin.password);
    const ok   = pBuf.length === eP.length && timingSafeEqual(pBuf, eP);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 500));
      throw new Error("Senha atual incorreta.");
    }

    // Migrate to DB with new password
    const { upsertDbSuperAdmin } = await import("./super-totp.server");
    await upsertDbSuperAdmin({
      email,
      name:                 envAdmin.name ?? email.split("@")[0],
      password_hash:        hashPassword(data.newPassword),
      must_change_password: false,
    });
    return { ok: true };
  });

// ─── Gestão de outros admins ──────────────────────────────────────────────────

export type SuperAdminListItem = {
  email: string;
  name: string;
  mustChangePassword: boolean;
  createdAt: string;
  createdBy: string | null;
};

export const listSuperAdmins = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st }).parse(input))
  .handler(async ({ data }): Promise<SuperAdminListItem[]> => {
    await requireSuperAuth(data._st);
    const { getAllDbSuperAdmins } = await import("./super-totp.server");
    const rows = await getAllDbSuperAdmins();
    return rows.map((r) => ({
      email:              r.email,
      name:               r.name,
      mustChangePassword: r.must_change_password,
      createdAt:          (r as Record<string, unknown>).created_at as string ?? "",
      createdBy:          (r as Record<string, unknown>).created_by as string | null ?? null,
    }));
  });

export const createSuperAdmin = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      _st,
      email:    z.string().email(),
      name:     z.string().min(2).max(80),
      password: z.string().min(8),
      sendWelcomeEmail: z.boolean().default(true),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st);
    const createdBy = await getSuperAuthEmail(data._st);
    const { hashPassword, upsertDbSuperAdmin, getDbSuperAdmin } = await import("./super-totp.server");

    const existing = await getDbSuperAdmin(data.email);
    if (existing) throw new Error("Já existe um admin com este e-mail.");

    await upsertDbSuperAdmin({
      email:                data.email.toLowerCase(),
      name:                 data.name.trim(),
      password_hash:        hashPassword(data.password),
      must_change_password: true,
      created_by:           createdBy ?? undefined,
    });

    if (data.sendWelcomeEmail) {
      await _sendWelcomeEmail(data.email, data.name, data.password);
    }

    return { ok: true };
  });

export const removeSuperAdmin = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ _st, email: z.string().email() }).parse(input))
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st);
    const myEmail = await getSuperAuthEmail(data._st);
    if (myEmail?.toLowerCase() === data.email.toLowerCase()) {
      throw new Error("Você não pode remover sua própria conta.");
    }
    const { deleteDbSuperAdmin } = await import("./super-totp.server");
    await deleteDbSuperAdmin(data.email);
    return { ok: true };
  });

export const resetSuperAdminPassword = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ _st, email: z.string().email(), newPassword: z.string().min(8) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAuth(data._st);
    const { hashPassword, getDbSuperAdmin } = await import("./super-totp.server");
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(
      process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      { auth: { persistSession: false } },
    );
    const existing = await getDbSuperAdmin(data.email);
    await db
      .from("super_admin_credentials")
      .update({ password_hash: hashPassword(data.newPassword), must_change_password: true, updated_at: new Date().toISOString() })
      .eq("email", data.email.toLowerCase());
    await _sendWelcomeEmail(data.email, existing?.name ?? data.email.split("@")[0], data.newPassword);
    return { ok: true };
  });

// ─── Helper: welcome email ────────────────────────────────────────────────────

async function _sendWelcomeEmail(email: string, name: string, password: string) {
  const { getServerEnv } = await import("@/lib/server-env");
  const apiKey = getServerEnv("RESEND_API_KEY");
  if (!apiKey) return;
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const from   = getServerEnv("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
  const loginUrl = `${process.env.VITE_APP_URL ?? "https://super.suaagenda.pro"}/super/login`;

  await resend.emails.send({
    from,
    to:      email,
    subject: "Acesso ao painel Super Admin — SuaAgenda.Pro",
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#fff">
  <div style="background:linear-gradient(135deg,#1f1230,#312e81);border-radius:16px;padding:32px 28px;margin-bottom:28px;text-align:center">
    <p style="color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">Super Admin</p>
    <h1 style="color:#fff;font-size:26px;font-weight:700;margin:0">SuaAgenda.Pro</h1>
  </div>
  <h2 style="color:#1f1230;font-size:20px;margin:0 0 12px">Olá, ${name}!</h2>
  <p style="color:#4b5563;line-height:1.7;margin:0 0 20px">
    Você recebeu acesso ao <strong>painel de Super Administrador</strong> do SuaAgenda.Pro.
    Use as credenciais abaixo para fazer seu primeiro login.
  </p>
  <div style="background:#f8f7f9;border:1px solid #e4e0ed;border-radius:12px;padding:20px 24px;margin:0 0 24px">
    <p style="margin:0 0 8px;color:#6b5b73;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Suas credenciais</p>
    <p style="margin:0 0 6px;color:#1f1230"><strong>E-mail:</strong> ${email}</p>
    <p style="margin:0;color:#1f1230"><strong>Senha provisória:</strong> <code style="background:#ede9fe;padding:2px 8px;border-radius:6px;font-size:14px">${password}</code></p>
  </div>
  <p style="color:#ef4444;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:0 0 24px">
    ⚠️ Você será obrigado a <strong>trocar a senha</strong> no primeiro acesso.
  </p>
  <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#1f1230,#312e81);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">
    Acessar o painel →
  </a>
  <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;line-height:1.6">
    Por segurança, não compartilhe este e-mail. Se você não esperava este acesso, entre em contato imediatamente.
  </p>
</div>`,
  });
}
