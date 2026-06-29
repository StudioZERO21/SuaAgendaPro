# Backup Manifest — SuaAgenda.Pro

**Data:** 2026-06-28  
**Branch:** feature/template-system  
**Projeto Supabase:** itqsrpmovqeyhzsertqe

## Status do banco de dados
- **63 migrations aplicadas** (ver `supabase/migrations/`)
- **41 tabelas** em `public`

## Tabelas
| Tabela | Colunas |
|---|---|
| admin_audit_log | 6 |
| app_ratings | 6 |
| appointments | 17 |
| asaas_customers | 3 |
| billing_events | 11 |
| blocked_dates | 5 |
| clients | 15 |
| contact_messages | 5 |
| faq_categories | 9 |
| faq_items | 13 |
| faq_subcategories | 6 |
| faq_view_logs | 5 |
| google_calendar_tokens | 9 |
| mercado_pago_account_secrets | 5 |
| mercado_pago_oauth_attempts | 7 |
| message_templates | 10 |
| notifications | 8 |
| password_reset_requests | 11 |
| payment_transactions | 14 |
| plan_promotions | 10 |
| plans | 10 |
| portfolio_items | 8 |
| professional_payment_settings | 13 |
| profiles | 42 |
| profiles_with_email | 37 |
| push_subscriptions | 6 |
| referral_conversions | 11 |
| referral_links | 9 |
| review_tokens | 5 |
| reviews | 10 |
| schedule_blocks | 7 |
| services | 15 |
| special_access_grants | 6 |
| subscriptions | 14 |
| super_admin_credentials | 7 |
| super_admin_mfa | 5 |
| support_tickets | 17 |
| system_config | 9 |
| system_settings | 4 |
| whatsapp_messages | 9 |
| working_hours | 10 |

## Backup de dados (manual)
O schema está versionado pelas migrations. Para backup completo dos dados:
```
# No Supabase Dashboard: Settings → Database → Backups
# Ou via CLI na VPS:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Variáveis de ambiente necessárias (.env — NÃO commitado)
Ver `.env.production.example` para a lista completa.
Variáveis críticas na VPS:
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` / `VITE_SUPABASE_URL`
- `ASAAS_API_KEY` (produção)
- `RESEND_API_KEY`
- `EVOLUTION_API_KEY`
- `SUPER_ADMINS` (JSON com credenciais — nunca commitado)
- `REDIS_URL`
- `VPS_DATABASE_URL`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `AI_SYNC_TOKEN`
- `MP_WEBHOOK_SECRET`
