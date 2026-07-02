import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PREREG_TTL = 4 * 60 * 60; // 4 horas em segundos

const preregKey = (token: string) => `prereg:${token}`;
const emailKey  = (email: string) => `prereg_email:${email.toLowerCase()}`;

type PreregData = { email: string; name: string; phone: string; refCode: string | null };

// ─── Pré-cadastro: armazena dados no Redis e envia e-mail de ativação ─────────

export const preRegister = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      name:    z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
      email:   z.string().email("E-mail inválido"),
      phone:   z.string().min(10, "Telefone inválido"),
      refCode: z.string().nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { cacheGet, cacheSet } = await import("@/lib/redis.server");
    const { randomBytes } = await import("node:crypto");

    const email  = data.email.toLowerCase().trim();
    const eKey   = emailKey(email);
    const prereg: PreregData = {
      email,
      name:    data.name.trim(),
      phone:   data.phone.trim(),
      refCode: data.refCode ?? null,
    };

    // Reutiliza token existente (idempotente — permite reenvio)
    let token = await cacheGet<string>(eKey);
    if (!token) {
      token = randomBytes(32).toString("hex");
    }

    await Promise.all([
      cacheSet(preregKey(token), prereg, PREREG_TTL),
      cacheSet(eKey, token, PREREG_TTL),
    ]);

    await sendActivationEmail(token, prereg);
    return { ok: true };
  });

// ─── Lê dados do pré-cadastro pelo token (para SSR do loader) ────────────────

export const getPreregData = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ token: z.string().min(1) }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { cacheGet } = await import("@/lib/redis.server");
    const prereg = await cacheGet<PreregData>(preregKey(data.token));
    if (!prereg) return null;
    return {
      email:     prereg.email,
      firstName: prereg.name.split(" ")[0],
      refCode:   prereg.refCode,
    };
  });

// ─── Ativa conta: cria usuário no Supabase e limpa Redis ─────────────────────

export const activateAccount = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      token:    z.string().min(1),
      password: z.string().min(8, "Mínimo de 8 caracteres"),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { cacheGet, cacheDel } = await import("@/lib/redis.server");
    const prereg = await cacheGet<PreregData>(preregKey(data.token));
    if (!prereg) throw new Error("Link expirado. Faça o cadastro novamente.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email:         prereg.email,
      password:      data.password,
      email_confirm: true,
      user_metadata: { full_name: prereg.name, phone: prereg.phone },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        throw new Error("Este e-mail já está cadastrado. Faça login.");
      }
      throw new Error("Não foi possível criar a conta. Tente novamente.");
    }

    await cacheDel(preregKey(data.token), emailKey(prereg.email));

    return {
      ok:      true,
      email:   prereg.email,
      userId:  newUser.user?.id ?? null,
      refCode: prereg.refCode,
    };
  });

// ─── Helpers privados ─────────────────────────────────────────────────────────

async function sendActivationEmail(token: string, prereg: PreregData) {
  const siteBase = (process.env.VITE_SITE_URL ?? "https://suaagenda.pro").replace(/\/+$/, "");
  const activationUrl = `${siteBase}/ativar?t=${token}`;
  const firstName = prereg.name.split(" ")[0];

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from   = process.env.RESEND_FROM_EMAIL ?? "SuaAgenda.Pro <noreply@suaagenda.pro>";

  await resend.emails.send({
    from,
    to:      prereg.email,
    subject: `${firstName}, ative sua conta — SuaAgenda.Pro`,
    replyTo: "suporte@suaagenda.pro",
    headers: {
      "List-Unsubscribe": "<mailto:noreply@suaagenda.pro?subject=unsubscribe>",
      "X-Priority": "1",
    },
    html: buildHtml({ firstName, email: prereg.email, activationUrl }),
    text: buildText({ firstName, email: prereg.email, activationUrl }),
  });
}

function buildHtml({ firstName, email, activationUrl }: { firstName: string; email: string; activationUrl: string }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Ative sua conta — SuaAgenda.Pro</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f1f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f1f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9 0%,#7c3aed 45%,#a855f7 75%,#ec4899 100%);border-radius:16px 16px 0 0;padding:36px 40px 32px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                SuaAgenda<span style="opacity:0.80;">.Pro</span>
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.78);font-weight:500;letter-spacing:0.4px;">
                Sua agenda profissional online
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px 28px;">
              <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#18181b;line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Olá, ${firstName}! 👋
              </h1>
              <p style="margin:0 0 26px;font-size:15px;color:#52525b;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Estamos felizes em ter você no <strong>SuaAgenda.Pro</strong>! Para ativar sua conta e começar a organizar sua agenda profissional, clique no botão abaixo e crie sua senha.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${activationUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#a855f7);color:#ffffff;text-decoration:none;
                              padding:16px 40px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.3px;
                              font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      ✅&nbsp; Ativar minha conta
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry warning -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.55;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      ⏰ <strong>Este link expira em 4 horas.</strong> Após esse prazo, seus dados são removidos automaticamente e você precisará preencher o cadastro novamente.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#166534;line-height:1.55;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      🔒 <strong>Não foi você?</strong> Ignore este e-mail com segurança. Nenhuma conta é criada sem que você clique no link e defina uma senha. Seus dados serão excluídos automaticamente em 4 horas.
                    </p>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 20px;" />

              <!-- Fallback link -->
              <p style="margin:0;font-size:12px;color:#71717a;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Botão não funcionou? Copie e cole no navegador:<br />
                <a href="${activationUrl}" style="color:#7c3aed;word-break:break-all;font-size:11px;">${activationUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9fb;border-top:1px solid #e4e4e7;border-radius:0 0 16px 16px;padding:18px 40px;text-align:center;">
              <p style="margin:0 0 3px;font-size:12px;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Este e-mail foi enviado para <strong>${email}</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                © ${year} SuaAgenda.Pro · Todos os direitos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildText({ firstName, email, activationUrl }: { firstName: string; email: string; activationUrl: string }) {
  const year = new Date().getFullYear();
  return `Olá, ${firstName}!

Obrigado por se cadastrar no SuaAgenda.Pro!

Para ativar sua conta, acesse o link abaixo e crie sua senha:
${activationUrl}

⏰ Este link expira em 4 horas. Após esse prazo, seus dados são removidos automaticamente e você precisará preencher o cadastro novamente.

🔒 Não foi você? Ignore este e-mail. Nenhuma conta será criada sem que você clique no link.

---
Este e-mail foi enviado para ${email}
© ${year} SuaAgenda.Pro · Todos os direitos reservados`;
}
