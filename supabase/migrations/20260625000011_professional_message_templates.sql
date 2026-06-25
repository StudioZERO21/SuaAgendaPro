-- Migração: templates profissionais de e-mail e WhatsApp
-- Substitui todos os templates existentes por versões profissionais

DELETE FROM message_templates;

-- ─────────────────────────────────────────────────────────────────
-- E-MAIL: Boas-vindas ao trial
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Boas-vindas ao trial — E-mail',
  'email',
  'welcome_trial',
  'Bem-vinda ao SuaAgenda.Pro, {{nome}}! Seu acesso começa agora 🎉',
  $BODY$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" style="max-width:600px;width:100%"><tr><td style="background:linear-gradient(135deg,#6d28d9 0%,#9333ea 100%);border-radius:16px 16px 0 0;padding:28px 40px;text-align:center"><p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase">Plataforma de Agendamento</p><p style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.03em">SuaAgenda<span style="opacity:0.55">.Pro</span></p></td></tr><tr><td style="background:#fff;border:1px solid #e4e4e7;border-top:none;padding:40px"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#7c3aed;letter-spacing:0.12em;text-transform:uppercase">Boas-vindas! 🎉</p><h2 style="margin:0 0 16px;font-size:23px;font-weight:800;color:#18181b;line-height:1.3">Olá, {{nome}}!<br/>Seu acesso gratuito de 7 dias começa agora.</h2><p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.75">Seja muito bem-vinda ao <strong>SuaAgenda.Pro</strong>! Você tem acesso completo à plataforma durante os próximos 7 dias — sem cartão de crédito, sem compromisso.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border:1px solid #ede9fe;border-radius:12px;margin-bottom:24px"><tr><td style="padding:20px 24px"><p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#6d28d9;letter-spacing:0.1em;text-transform:uppercase">Por onde começar</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:5px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:10px">1️⃣</span>Configure seus serviços e valores</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:10px">2️⃣</span>Defina sua disponibilidade de horários</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:10px">3️⃣</span>Compartilhe seu link com as clientes</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:10px">4️⃣</span>Aguarde os agendamentos chegarem!</td></tr></table></td></tr></table><p style="margin:0 0 8px;font-size:14px;color:#52525b;font-weight:600">Seu link público de agendamento:</p><div style="background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:10px 16px;margin-bottom:28px;font-family:monospace;font-size:13px;color:#7c3aed;word-break:break-all">https://suaagenda.pro/agendar/{{slug}}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://app.suaagenda.pro" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;text-decoration:none;padding:15px 40px;border-radius:10px;font-size:15px;font-weight:700">Acessar minha agenda →</a></td></tr></table></td></tr><tr><td style="background:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center"><p style="margin:0 0 4px;color:#71717a;font-size:12px;line-height:1.5">Você recebeu este e-mail por criar uma conta no <strong style="color:#52525b">SuaAgenda.Pro</strong>. Dúvidas? <a href="mailto:oi@suaagenda.pro" style="color:#7c3aed;text-decoration:none">oi@suaagenda.pro</a></p><p style="margin:8px 0 0;color:#a1a1aa;font-size:11px">© 2026 SuaAgenda.Pro &nbsp;·&nbsp; <a href="https://suaagenda.pro" style="color:#a1a1aa">suaagenda.pro</a></p></td></tr></table></td></tr></table></body></html>$BODY$,
  ARRAY['nome','slug'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- E-MAIL: Trial expirando em 3 dias
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Trial expirando em 3 dias — E-mail',
  'email',
  'trial_expiring_3d',
  '{{nome}}, seu acesso gratuito termina em {{dias_restantes}} dias ⏰',
  $BODY$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" style="max-width:600px;width:100%"><tr><td style="background:linear-gradient(135deg,#6d28d9 0%,#9333ea 100%);border-radius:16px 16px 0 0;padding:28px 40px;text-align:center"><p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase">Plataforma de Agendamento</p><p style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.03em">SuaAgenda<span style="opacity:0.55">.Pro</span></p></td></tr><tr><td style="background:#fff;border:1px solid #e4e4e7;border-top:none;padding:40px"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#d97706;letter-spacing:0.12em;text-transform:uppercase">Aviso importante ⏰</p><h2 style="margin:0 0 16px;font-size:23px;font-weight:800;color:#18181b;line-height:1.3">Seu acesso gratuito termina<br/>em <span style="color:#d97706">{{dias_restantes}} dias</span>, {{nome}}.</h2><p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.75">Você está aproveitando o SuaAgenda.Pro há algum tempo — não deixe sua agenda parar! Assine o plano <strong>Premium</strong> por apenas <strong>R$49,90/mês</strong> e continue com acesso completo.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px"><tr><td style="padding:16px 24px"><p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.08em">O que você mantém ao assinar</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:4px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:8px">✅</span>Todo seu histórico de clientes e agendamentos</td></tr><tr><td style="padding:4px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:8px">✅</span>Seus serviços, preços e horários configurados</td></tr><tr><td style="padding:4px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:8px">✅</span>Lembretes automáticos para as clientes</td></tr><tr><td style="padding:4px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:8px">✅</span>Portfólio, avaliações e relatórios completos</td></tr></table></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px"><tr><td align="center"><a href="https://app.suaagenda.pro/plano" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;text-decoration:none;padding:15px 40px;border-radius:10px;font-size:15px;font-weight:700">Assinar Premium — R$49,90/mês →</a></td></tr></table><p style="margin:0;font-size:13px;color:#71717a;text-align:center">Cancele quando quiser. Sem fidelidade.</p></td></tr><tr><td style="background:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center"><p style="margin:0 0 4px;color:#71717a;font-size:12px;line-height:1.5">Você recebeu este e-mail por possuir uma conta no <strong style="color:#52525b">SuaAgenda.Pro</strong>. Dúvidas? <a href="mailto:oi@suaagenda.pro" style="color:#7c3aed;text-decoration:none">oi@suaagenda.pro</a></p><p style="margin:8px 0 0;color:#a1a1aa;font-size:11px">© 2026 SuaAgenda.Pro &nbsp;·&nbsp; <a href="https://suaagenda.pro" style="color:#a1a1aa">suaagenda.pro</a></p></td></tr></table></td></tr></table></body></html>$BODY$,
  ARRAY['nome','dias_restantes'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- E-MAIL: Trial expirando amanhã
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Trial expirando amanhã — E-mail',
  'email',
  'trial_expiring_1d',
  '{{nome}}, última chance — seu acesso gratuito termina amanhã 🚨',
  $BODY$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" style="max-width:600px;width:100%"><tr><td style="background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%);border-radius:16px 16px 0 0;padding:28px 40px;text-align:center"><p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase">Plataforma de Agendamento</p><p style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.03em">SuaAgenda<span style="opacity:0.6">.Pro</span></p></td></tr><tr><td style="background:#fff;border:1px solid #e4e4e7;border-top:none;padding:40px"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#dc2626;letter-spacing:0.12em;text-transform:uppercase">Último aviso 🚨</p><h2 style="margin:0 0 16px;font-size:23px;font-weight:800;color:#18181b;line-height:1.3">{{nome}}, seu trial termina<br/><span style="color:#dc2626">amanhã!</span></h2><p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.75">Após o encerramento do período gratuito, sua conta será <strong>suspensa automaticamente</strong>. Para manter tudo funcionando sem interrupção, assine agora.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:2px solid #fca5a5;border-radius:12px;margin-bottom:24px"><tr><td style="padding:16px 24px;text-align:center"><p style="margin:0 0 6px;font-size:28px">⚠️</p><p style="margin:0;font-size:15px;font-weight:700;color:#991b1b">Seu acesso será suspenso amanhã se você não assinar.</p></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px"><tr><td align="center"><a href="https://app.suaagenda.pro/plano" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;text-decoration:none;padding:15px 40px;border-radius:10px;font-size:16px;font-weight:700">Assinar agora — R$49,90/mês →</a></td></tr></table><p style="margin:0;font-size:13px;color:#71717a;text-align:center">Ativação imediata. Cancele quando quiser.</p></td></tr><tr><td style="background:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center"><p style="margin:0 0 4px;color:#71717a;font-size:12px;line-height:1.5">Você recebeu este e-mail por possuir uma conta no <strong style="color:#52525b">SuaAgenda.Pro</strong>. Dúvidas? <a href="mailto:oi@suaagenda.pro" style="color:#7c3aed;text-decoration:none">oi@suaagenda.pro</a></p><p style="margin:8px 0 0;color:#a1a1aa;font-size:11px">© 2026 SuaAgenda.Pro &nbsp;·&nbsp; <a href="https://suaagenda.pro" style="color:#a1a1aa">suaagenda.pro</a></p></td></tr></table></td></tr></table></body></html>$BODY$,
  ARRAY['nome'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- E-MAIL: Trial expirado / Conta suspensa
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Trial expirado — E-mail',
  'email',
  'trial_expired',
  'Sua conta foi suspensa — reative em instantes, {{nome}}',
  $BODY$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" style="max-width:600px;width:100%"><tr><td style="background:linear-gradient(135deg,#18181b 0%,#3f3f46 100%);border-radius:16px 16px 0 0;padding:28px 40px;text-align:center"><p style="margin:0 0 4px;color:rgba(255,255,255,0.5);font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase">Plataforma de Agendamento</p><p style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.03em">SuaAgenda<span style="opacity:0.5">.Pro</span></p></td></tr><tr><td style="background:#fff;border:1px solid #e4e4e7;border-top:none;padding:40px"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#71717a;letter-spacing:0.12em;text-transform:uppercase">Conta suspensa 🔒</p><h2 style="margin:0 0 16px;font-size:23px;font-weight:800;color:#18181b;line-height:1.3">{{nome}}, seu período<br/>gratuito terminou.</h2><p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.75">Seu trial de 7 dias chegou ao fim e sua conta foi suspensa. A boa notícia: <strong>todos os seus dados estão preservados</strong>. É só assinar para continuar de onde parou.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:12px;margin-bottom:24px"><tr><td style="padding:20px 24px"><p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:0.08em">O que está guardado para você</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:4px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:8px">📋</span>Todas as suas clientes e histórico</td></tr><tr><td style="padding:4px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:8px">📅</span>Agenda, serviços e configurações</td></tr><tr><td style="padding:4px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:8px">🔗</span>Seu link público de agendamento</td></tr></table></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px"><tr><td align="center"><a href="https://app.suaagenda.pro/plano" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;text-decoration:none;padding:15px 40px;border-radius:10px;font-size:15px;font-weight:700">Reativar minha conta →</a></td></tr></table><p style="margin:0;font-size:13px;color:#71717a;text-align:center">R$49,90/mês · Cancele quando quiser · Sem fidelidade.</p></td></tr><tr><td style="background:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center"><p style="margin:0 0 4px;color:#71717a;font-size:12px;line-height:1.5">Você recebeu este e-mail por possuir uma conta no <strong style="color:#52525b">SuaAgenda.Pro</strong>. Dúvidas? <a href="mailto:oi@suaagenda.pro" style="color:#7c3aed;text-decoration:none">oi@suaagenda.pro</a></p><p style="margin:8px 0 0;color:#a1a1aa;font-size:11px">© 2026 SuaAgenda.Pro &nbsp;·&nbsp; <a href="https://suaagenda.pro" style="color:#a1a1aa">suaagenda.pro</a></p></td></tr></table></td></tr></table></body></html>$BODY$,
  ARRAY['nome'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- E-MAIL: Pagamento vencendo em 3 dias
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Pagamento vencendo em 3 dias — E-mail',
  'email',
  'payment_overdue_3d',
  '{{nome}}, seu pagamento vence em {{dias_restantes}} dias — ação necessária',
  $BODY$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" style="max-width:600px;width:100%"><tr><td style="background:linear-gradient(135deg,#6d28d9 0%,#9333ea 100%);border-radius:16px 16px 0 0;padding:28px 40px;text-align:center"><p style="margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase">Plataforma de Agendamento</p><p style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.03em">SuaAgenda<span style="opacity:0.55">.Pro</span></p></td></tr><tr><td style="background:#fff;border:1px solid #e4e4e7;border-top:none;padding:40px"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#d97706;letter-spacing:0.12em;text-transform:uppercase">Pagamento pendente</p><h2 style="margin:0 0 16px;font-size:23px;font-weight:800;color:#18181b;line-height:1.3">Olá, {{nome}}!<br/>Seu pagamento vence em <span style="color:#d97706">{{dias_restantes}} dias</span>.</h2><p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.75">Para evitar a interrupção do seu acesso, regularize o pagamento antes do vencimento em <strong>{{data_vencimento}}</strong>.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:28px"><tr><td style="padding:16px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:5px 0;font-size:14px;color:#78350f"><span style="margin-right:8px">📅</span><strong>Vencimento:</strong> {{data_vencimento}}</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#78350f"><span style="margin-right:8px">💰</span><strong>Plano:</strong> Premium — R$49,90</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#78350f"><span style="margin-right:8px">⚡</span><strong>Formas de pagamento:</strong> PIX ou cartão de crédito</td></tr></table></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px"><tr><td align="center"><a href="{{link_pagamento}}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;text-decoration:none;padding:15px 40px;border-radius:10px;font-size:15px;font-weight:700">Pagar agora →</a></td></tr></table><p style="margin:0;font-size:13px;color:#71717a;text-align:center">Aprovação instantânea via PIX.</p></td></tr><tr><td style="background:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center"><p style="margin:0 0 4px;color:#71717a;font-size:12px;line-height:1.5">Você recebeu este e-mail por possuir uma conta no <strong style="color:#52525b">SuaAgenda.Pro</strong>. Dúvidas? <a href="mailto:oi@suaagenda.pro" style="color:#7c3aed;text-decoration:none">oi@suaagenda.pro</a></p><p style="margin:8px 0 0;color:#a1a1aa;font-size:11px">© 2026 SuaAgenda.Pro &nbsp;·&nbsp; <a href="https://suaagenda.pro" style="color:#a1a1aa">suaagenda.pro</a></p></td></tr></table></td></tr></table></body></html>$BODY$,
  ARRAY['nome','dias_restantes','link_pagamento','data_vencimento'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- E-MAIL: Pagamento vencendo amanhã
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Pagamento vencendo amanhã — E-mail',
  'email',
  'payment_overdue_1d',
  '⚠️ {{nome}}, pagamento urgente — vence amanhã!',
  $BODY$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" style="max-width:600px;width:100%"><tr><td style="background:linear-gradient(135deg,#dc2626 0%,#f97316 100%);border-radius:16px 16px 0 0;padding:28px 40px;text-align:center"><p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase">Plataforma de Agendamento</p><p style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.03em">SuaAgenda<span style="opacity:0.6">.Pro</span></p></td></tr><tr><td style="background:#fff;border:1px solid #e4e4e7;border-top:none;padding:40px"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#dc2626;letter-spacing:0.12em;text-transform:uppercase">Urgente ⚠️</p><h2 style="margin:0 0 16px;font-size:23px;font-weight:800;color:#18181b;line-height:1.3">{{nome}}, seu pagamento<br/>vence <span style="color:#dc2626">amanhã!</span></h2><p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.75">Se o pagamento não for realizado até amanhã, sua conta será <strong>suspensa automaticamente</strong> e suas clientes não conseguirão agendar pelo seu link.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px"><tr><td align="center"><a href="{{link_pagamento}}" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#f97316);color:#fff;text-decoration:none;padding:16px 44px;border-radius:10px;font-size:16px;font-weight:700">Pagar agora — evitar suspensão →</a></td></tr></table><p style="margin:0 0 16px;font-size:13px;color:#71717a;text-align:center">Aprovação via PIX em segundos.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px"><tr><td style="padding:14px 20px;font-size:13px;color:#991b1b;text-align:center"><strong>Vencimento: {{data_vencimento}} &nbsp;·&nbsp; Valor: R$49,90</strong></td></tr></table></td></tr><tr><td style="background:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center"><p style="margin:0 0 4px;color:#71717a;font-size:12px;line-height:1.5">Você recebeu este e-mail por possuir uma conta no <strong style="color:#52525b">SuaAgenda.Pro</strong>. Dúvidas? <a href="mailto:oi@suaagenda.pro" style="color:#7c3aed;text-decoration:none">oi@suaagenda.pro</a></p><p style="margin:8px 0 0;color:#a1a1aa;font-size:11px">© 2026 SuaAgenda.Pro &nbsp;·&nbsp; <a href="https://suaagenda.pro" style="color:#a1a1aa">suaagenda.pro</a></p></td></tr></table></td></tr></table></body></html>$BODY$,
  ARRAY['nome','link_pagamento','data_vencimento'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- E-MAIL: Conta suspensa por inadimplência
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Conta suspensa por inadimplência — E-mail',
  'email',
  'subscription_suspended',
  'Sua conta SuaAgenda.Pro foi suspensa — regularize agora',
  $BODY$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" style="max-width:600px;width:100%"><tr><td style="background:linear-gradient(135deg,#18181b 0%,#3f3f46 100%);border-radius:16px 16px 0 0;padding:28px 40px;text-align:center"><p style="margin:0 0 4px;color:rgba(255,255,255,0.5);font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase">Plataforma de Agendamento</p><p style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.03em">SuaAgenda<span style="opacity:0.5">.Pro</span></p></td></tr><tr><td style="background:#fff;border:1px solid #e4e4e7;border-top:none;padding:40px"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#71717a;letter-spacing:0.12em;text-transform:uppercase">Conta suspensa 🔒</p><h2 style="margin:0 0 16px;font-size:23px;font-weight:800;color:#18181b;line-height:1.3">{{nome}}, sua conta foi<br/>suspensa por falta de pagamento.</h2><p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.75">Seu acesso ao SuaAgenda.Pro foi suspenso porque o pagamento não foi identificado. <strong>Todos os seus dados estão seguros</strong> — basta regularizar para voltar imediatamente.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:12px;margin-bottom:24px"><tr><td style="padding:16px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:4px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:8px">🔒</span>Agendamentos de novas clientes bloqueados</td></tr><tr><td style="padding:4px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:8px">📋</span>Histórico e dados preservados com segurança</td></tr><tr><td style="padding:4px 0;font-size:14px;color:#3f3f46;line-height:1.5"><span style="margin-right:8px">⚡</span>Reativação imediata ao pagar</td></tr></table></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px"><tr><td align="center"><a href="{{link_pagamento}}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;text-decoration:none;padding:15px 40px;border-radius:10px;font-size:15px;font-weight:700">Regularizar e reativar conta →</a></td></tr></table><p style="margin:0;font-size:13px;color:#71717a;text-align:center">R$49,90/mês · Reativação imediata · Sem multa ou juros.</p></td></tr><tr><td style="background:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center"><p style="margin:0 0 4px;color:#71717a;font-size:12px;line-height:1.5">Você recebeu este e-mail por possuir uma conta no <strong style="color:#52525b">SuaAgenda.Pro</strong>. Dúvidas? <a href="mailto:oi@suaagenda.pro" style="color:#7c3aed;text-decoration:none">oi@suaagenda.pro</a></p><p style="margin:8px 0 0;color:#a1a1aa;font-size:11px">© 2026 SuaAgenda.Pro &nbsp;·&nbsp; <a href="https://suaagenda.pro" style="color:#a1a1aa">suaagenda.pro</a></p></td></tr></table></td></tr></table></body></html>$BODY$,
  ARRAY['nome','link_pagamento'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- E-MAIL: Pagamento confirmado
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Pagamento confirmado — E-mail',
  'email',
  'payment_confirmed',
  '✅ Pagamento confirmado — obrigada, {{nome}}!',
  $BODY$<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" style="max-width:600px;width:100%"><tr><td style="background:linear-gradient(135deg,#047857 0%,#059669 100%);border-radius:16px 16px 0 0;padding:28px 40px;text-align:center"><p style="margin:0 0 4px;color:rgba(255,255,255,0.65);font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase">Plataforma de Agendamento</p><p style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.03em">SuaAgenda<span style="opacity:0.55">.Pro</span></p></td></tr><tr><td style="background:#fff;border:1px solid #e4e4e7;border-top:none;padding:40px"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#059669;letter-spacing:0.12em;text-transform:uppercase">Pagamento confirmado ✅</p><h2 style="margin:0 0 16px;font-size:23px;font-weight:800;color:#18181b;line-height:1.3">Obrigada, {{nome}}!<br/>Seu acesso está ativo e garantido.</h2><p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.75">Seu pagamento foi confirmado e seu acesso ao <strong>SuaAgenda.Pro</strong> está renovado. Continue gerenciando sua agenda com tranquilidade!</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:28px"><tr><td style="padding:16px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:5px 0;font-size:14px;color:#14532d;line-height:1.5"><span style="margin-right:8px">✅</span><strong>Status:</strong> Ativo — acesso completo</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#14532d;line-height:1.5"><span style="margin-right:8px">📅</span><strong>Próximo vencimento:</strong> {{data_vencimento}}</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#14532d;line-height:1.5"><span style="margin-right:8px">💳</span><strong>Valor pago:</strong> R$49,90</td></tr></table></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px"><tr><td align="center"><a href="https://app.suaagenda.pro" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;text-decoration:none;padding:15px 40px;border-radius:10px;font-size:15px;font-weight:700">Acessar minha agenda →</a></td></tr></table></td></tr><tr><td style="background:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center"><p style="margin:0 0 4px;color:#71717a;font-size:12px;line-height:1.5">Você recebeu este e-mail por possuir uma conta no <strong style="color:#52525b">SuaAgenda.Pro</strong>. Dúvidas? <a href="mailto:oi@suaagenda.pro" style="color:#7c3aed;text-decoration:none">oi@suaagenda.pro</a></p><p style="margin:8px 0 0;color:#a1a1aa;font-size:11px">© 2026 SuaAgenda.Pro &nbsp;·&nbsp; <a href="https://suaagenda.pro" style="color:#a1a1aa">suaagenda.pro</a></p></td></tr></table></td></tr></table></body></html>$BODY$,
  ARRAY['nome','data_vencimento'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- WHATSAPP: Boas-vindas ao trial
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Boas-vindas ao trial — WhatsApp',
  'whatsapp',
  'welcome_trial',
  null,
  E'🎉 Olá, *{{nome}}!* Seja bem-vinda ao *SuaAgenda.Pro!*\n\nSeu acesso gratuito de *7 dias* está ativo. Configure sua agenda agora e comece a receber agendamentos online!\n\n📲 *Acesse aqui:* https://app.suaagenda.pro\n\n🔗 *Seu link de agendamento:*\nhttps://suaagenda.pro/agendar/{{slug}}\n\nQualquer dúvida é só responder essa mensagem. 💜\n\n_Equipe SuaAgenda.Pro_',
  ARRAY['nome','slug'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- WHATSAPP: Trial expirando em 3 dias
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Trial expirando em 3 dias — WhatsApp',
  'whatsapp',
  'trial_expiring_3d',
  null,
  E'⏰ *{{nome}}*, seu período gratuito termina em *{{dias_restantes}} dias!*\n\nNão perca tudo que você já configurou — seu histórico de clientes, serviços e agenda.\n\n👉 Assine o *Premium por R$49,90/mês* e continue sem interrupção:\nhttps://app.suaagenda.pro/plano\n\n✨ Sem fidelidade. Cancele quando quiser.\n\n_Equipe SuaAgenda.Pro_',
  ARRAY['nome','dias_restantes'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- WHATSAPP: Trial expirando amanhã
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Trial expirando amanhã — WhatsApp',
  'whatsapp',
  'trial_expiring_1d',
  null,
  E'🚨 *{{nome}}*, seu trial termina *AMANHÃ!*\n\nSe não assinar hoje, sua conta será suspensa automaticamente e suas clientes não conseguirão agendar pelo seu link.\n\n⚡ *Assine agora em 2 minutos:*\nhttps://app.suaagenda.pro/plano\n\n💳 R$49,90/mês · PIX ou cartão · Ativação imediata.\n\n_Equipe SuaAgenda.Pro_',
  ARRAY['nome'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- WHATSAPP: Trial expirado
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Trial expirado — WhatsApp',
  'whatsapp',
  'trial_expired',
  null,
  E'🔒 *{{nome}}*, seu trial terminou e sua conta foi *suspensa.*\n\nFique tranquila — *todos os seus dados estão guardados.* É só assinar para voltar de onde parou!\n\n👇 *Reativar minha conta:*\nhttps://app.suaagenda.pro/plano\n\nR$49,90/mês · Reativação imediata · Sem multa.\n\n_Equipe SuaAgenda.Pro_',
  ARRAY['nome'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- WHATSAPP: Pagamento vencendo em 3 dias
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Pagamento vencendo em 3 dias — WhatsApp',
  'whatsapp',
  'payment_overdue_3d',
  null,
  E'💳 *{{nome}}*, lembrete: seu pagamento vence em *{{dias_restantes}} dias* ({{data_vencimento}}).\n\nPague agora para não ter sua conta suspensa:\n🔗 {{link_pagamento}}\n\n⚡ Aprovação via PIX em segundos.\n\n_Equipe SuaAgenda.Pro_',
  ARRAY['nome','dias_restantes','link_pagamento','data_vencimento'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- WHATSAPP: Pagamento vencendo amanhã
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Pagamento vencendo amanhã — WhatsApp',
  'whatsapp',
  'payment_overdue_1d',
  null,
  E'⚠️ *{{nome}}*, URGENTE — seu pagamento vence *amanhã!*\n\nSe não pagar, sua conta será suspensa e suas clientes não conseguirão agendar.\n\n💳 *Pagar agora:*\n{{link_pagamento}}\n\nAprovação imediata via PIX.\n\n_Equipe SuaAgenda.Pro_',
  ARRAY['nome','link_pagamento'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- WHATSAPP: Conta suspensa por inadimplência
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Conta suspensa por inadimplência — WhatsApp',
  'whatsapp',
  'subscription_suspended',
  null,
  E'🚫 *{{nome}}*, sua conta foi *suspensa* por falta de pagamento.\n\nSeus dados estão seguros. Regularize agora para reativar imediatamente:\n\n👉 {{link_pagamento}}\n\nR$49,90/mês · Reativação na hora · Sem juros.\n\n_Equipe SuaAgenda.Pro_',
  ARRAY['nome','link_pagamento'],
  true
);

-- ─────────────────────────────────────────────────────────────────
-- WHATSAPP: Pagamento confirmado
-- ─────────────────────────────────────────────────────────────────
INSERT INTO message_templates (name, type, event, subject, body, variables, is_active) VALUES (
  'Pagamento confirmado — WhatsApp',
  'whatsapp',
  'payment_confirmed',
  null,
  E'✅ *{{nome}}*, pagamento confirmado!\n\nSeu acesso ao *SuaAgenda.Pro* está renovado até *{{data_vencimento}}*. Continue arrasando na sua agenda! 💜\n\n📲 https://app.suaagenda.pro\n\n_Equipe SuaAgenda.Pro_',
  ARRAY['nome','data_vencimento'],
  true
);
