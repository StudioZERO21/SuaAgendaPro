# Playbook de Resposta a Incidentes de Segurança (LGPD Art. 48)

## 1. Detecção e contenção (0–4h)

- Identificar origem (logs, alertas, reporte de usuário)
- Isolar sistema afetado (revogar tokens, bloquear IP, desativar endpoint)
- Preservar evidências (logs, snapshots)

## 2. Avaliação de risco (4–24h)

- Quais dados pessoais foram expostos?
- Quantos titulares afetados?
- Há risco relevante aos direitos e liberdades?

## 3. Notificação

- **ANPD:** em até 72h se houver risco ou dano relevante
- **Titulares:** comunicação clara sobre natureza dos dados e medidas adotadas
- **Profissionais (controladores):** se dados de clientes finais foram afetados

## 4. Remediação

- Corrigir vulnerabilidade
- Rotacionar credenciais
- Revisar RLS e auditoria
- Documentar lições aprendidas

## Contatos

- DPO: privacidade@suaagenda.pro
- Infra: equipe técnica via canal interno
