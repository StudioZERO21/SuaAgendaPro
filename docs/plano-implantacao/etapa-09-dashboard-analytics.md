# ETAPA 09 — Dashboard e Analytics

**Status:** 🔴 Não iniciado  
**Prioridade:** Média  
**Estimativa:** 2 dias  
**Dependências:** Etapas 01, 02, 04, 06

---

## Contexto

As páginas `/dashboard` e `/app` têm KPIs e gráficos mockados. Esta etapa substitui todos os dados fictícios por consultas reais ao banco, criando um painel de controle que reflete a situação real do negócio do profissional.

---

## Objetivo

Dashboard com KPIs reais, gráficos de faturamento com Recharts, próximos agendamentos do dia, e resumo do mês. Tudo carregado via Supabase com cache React Query.

---

## Checklist de Execução

### Queries de KPI (SQL via Supabase)

- [ ] **Faturamento do mês atual:**
  ```sql
  SELECT SUM(price_cents) FROM appointments
  WHERE professional_id = $1
  AND scheduled_at >= date_trunc('month', now())
  AND status = 'completed'
  ```

- [ ] **Faturamento do mês anterior** (para calcular variação %):
  ```sql
  -- mesmo filtro, mês anterior
  ```

- [ ] **Total de agendamentos do mês:**
  ```sql
  SELECT COUNT(*) FROM appointments
  WHERE professional_id = $1
  AND scheduled_at >= date_trunc('month', now())
  AND status NOT IN ('cancelled')
  ```

- [ ] **Novos clientes do mês:**
  ```sql
  SELECT COUNT(*) FROM clients
  WHERE professional_id = $1
  AND created_at >= date_trunc('month', now())
  ```

- [ ] **Taxa de no-show:**
  ```sql
  SELECT
    COUNT(*) FILTER (WHERE status = 'no_show') * 100.0 / NULLIF(COUNT(*), 0)
  FROM appointments
  WHERE professional_id = $1
  AND scheduled_at >= date_trunc('month', now())
  ```

- [ ] **Agendamentos de hoje:**
  ```sql
  SELECT * FROM appointments
  WHERE professional_id = $1
  AND scheduled_at::date = CURRENT_DATE
  ORDER BY scheduled_at
  ```

- [ ] **Próximos 7 dias:**
  ```sql
  SELECT * FROM appointments
  WHERE professional_id = $1
  AND scheduled_at BETWEEN now() AND now() + interval '7 days'
  AND status NOT IN ('cancelled')
  ORDER BY scheduled_at
  ```

### Hook `useDashboard`
- [ ] `getKPIs()` — retornar todos os KPIs acima
- [ ] `getTodayAppointments()` — agendamentos de hoje
- [ ] `getRevenueChart(period)` — dados para gráfico (últimos 30 dias)
- [ ] `getTopServices()` — serviços mais agendados
- [ ] Cache com `staleTime: 5 * 60 * 1000` (5 minutos)
- [ ] Loading states individuais por KPI

### KPI Cards (substituir mock)
- [ ] **Faturamento do mês** com variação em relação ao mês anterior (↑/↓%)
- [ ] **Agendamentos do mês** com variação
- [ ] **Novos clientes** com variação
- [ ] **Taxa de ocupação** (agendamentos / slots disponíveis × 100%)
- [ ] Skeleton loading em cada card
- [ ] Cores: verde para alta, vermelho para queda

### Gráfico de Faturamento (Recharts)
- [ ] `AreaChart` com faturamento dos últimos 30 dias
- [ ] Eixo X: dias (abreviados: "01/06", "02/06"...)
- [ ] Eixo Y: valores em R$
- [ ] Tooltip customizado com valor formatado
- [ ] Linha de meta (opcional: média dos últimos 3 meses)
- [ ] Responsivo (ResponsiveContainer)
- [ ] Filtros: 7 dias / 30 dias / 3 meses / 6 meses

### Lista de Agendamentos do Dia
- [ ] Substituir mock por dados reais
- [ ] Ordenados por horário
- [ ] Cards com: hora, cliente, serviço, status, ações rápidas
- [ ] Contador: "X agendamentos hoje"
- [ ] Botão "Ver agenda completa" → /app

### Serviços Mais Populares
- [ ] Top 5 serviços com mais agendamentos no período
- [ ] Barra horizontal com contagem
- [ ] Percentual do total

### Métricas Adicionais
- [ ] Horário de pico (hora do dia com mais agendamentos)
- [ ] Dia da semana mais movimentado
- [ ] Cliente mais frequente (top 3)
- [ ] Ticket médio (faturamento / número de agendamentos)

---

## Arquivos a Criar/Editar

```
src/hooks/useDashboard.ts      ← CRIAR
src/routes/dashboard.tsx       ← EDITAR (dados reais)
```

---

## Critério de Conclusão

✅ Etapa concluída quando:
- Todos os KPIs são calculados do banco real
- Gráfico de faturamento exibe dados reais
- Agendamentos do dia são carregados do banco
- Loading states funcionam corretamente
- Sem nenhum dado mockado na dashboard
