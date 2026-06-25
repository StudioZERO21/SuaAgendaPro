import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  DollarSign, Users, Clock, TrendingDown, Plus, Pencil, Trash2,
  ToggleLeft, ToggleRight, Tag, ChevronDown, ChevronUp, Loader2,
  CheckCircle2, EyeOff, Eye, RefreshCw, Calendar, Repeat, Infinity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { withSuperToken } from "@/lib/super-client";
import {
  getPlansOverview, upsertPlan, togglePlanField, upsertPromotion, deletePromotion,
  type Plan, type PlanPromotion, type PlanWithStats, type PlansOverview,
} from "@/lib/super-plans.functions";

export const Route = createFileRoute("/super/_app/planos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Planos — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: PlanosPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}
function cycleLabel(c: string) {
  return { monthly: "Mensal", quarterly: "Trimestral", yearly: "Anual", none: "Único" }[c] ?? c;
}
function promoTypeLabel(t: string) {
  return { duration: "Duração", deadline: "Prazo", permanent: "Permanente" }[t] ?? t;
}
function promoTypeIcon(t: string) {
  if (t === "duration")  return <Repeat className="h-3.5 w-3.5" />;
  if (t === "deadline")  return <Calendar className="h-3.5 w-3.5" />;
  return <Infinity className="h-3.5 w-3.5" />;
}

const EMPTY_PLAN: Omit<Plan, "created_at"> = {
  id: "", display_name: "", price_cents: 0, billing_cycle: "monthly",
  trial_days: 7, is_active: true, is_visible: true, features: [], sort_order: 0,
};
type PromoType = "duration" | "deadline" | "permanent";
type PromoState = {
  id: string | undefined;
  plan_id: string;
  name: string;
  discount_pct: number;
  type: PromoType;
  duration_months: number | null;
  deadline_at: string | null;
  is_active: boolean;
};
const EMPTY_PROMO: PromoState = {
  id: undefined, plan_id: "", name: "", discount_pct: 20,
  type: "duration", duration_months: 3, deadline_at: null, is_active: true,
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function PlanosPage() {
  const [data,    setData]    = useState<PlansOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Plan modal
  const [planModal, setPlanModal] = useState<{ open: boolean; plan: Omit<Plan, "created_at"> }>({
    open: false, plan: { ...EMPTY_PLAN },
  });
  // Promo modal
  const [promoModal, setPromoModal] = useState<{ open: boolean; promo: PromoState }>({
    open: false, promo: { ...EMPTY_PROMO },
  });
  // Expanded plan card
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await getPlansOverview({ data: withSuperToken() });
      setData(d);
    } catch (e: any) {
      toast.error("Erro ao carregar planos: " + e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // ── Toggle is_active / is_visible ─────────────────────────────────────────
  async function handleToggle(id: string, field: "is_active" | "is_visible", value: boolean) {
    try {
      await togglePlanField({ data: { ...withSuperToken(), id, field, value } });
      setData((d) => d ? {
        ...d,
        plans: d.plans.map((p) => p.id === id ? { ...p, [field]: value } : p),
      } : d);
      toast.success(field === "is_active" ? (value ? "Plano ativado" : "Plano desativado") : (value ? "Plano visível" : "Plano oculto"));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  // ── Save Plan ──────────────────────────────────────────────────────────────
  async function handleSavePlan() {
    setSaving(true);
    try {
      await upsertPlan({ data: { ...withSuperToken(), ...planModal.plan } });
      toast.success(planModal.plan.id ? "Plano atualizado!" : "Plano criado!");
      setPlanModal((m) => ({ ...m, open: false }));
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Save Promo ─────────────────────────────────────────────────────────────
  async function handleSavePromo() {
    setSaving(true);
    try {
      await upsertPromotion({ data: { ...withSuperToken(), ...promoModal.promo } });
      toast.success(promoModal.promo.id ? "Promoção atualizada!" : "Promoção criada!");
      setPromoModal((m) => ({ ...m, open: false }));
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete Promo ───────────────────────────────────────────────────────────
  async function handleDeletePromo(id: string, name: string) {
    if (!confirm(`Excluir promoção "${name}"?`)) return;
    try {
      await deletePromotion({ data: { ...withSuperToken(), id } });
      toast.success("Promoção excluída.");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const allPromos = (data?.plans ?? []).flatMap((p) => p.promotions);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Assinaturas</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Planos</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Gerencie planos, preços, features e promoções.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} /> Atualizar
          </Button>
          <Button size="sm" onClick={() => setPlanModal({ open: true, plan: { ...EMPTY_PLAN } })}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo Plano
          </Button>
        </div>
      </header>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: "MRR", icon: DollarSign, color: "text-emerald-600",
            value: loading ? "—" : fmtBRL(data?.mrr_cents ?? 0),
            sub: "receita recorrente mensal",
          },
          {
            label: "Assinantes ativos", icon: Users, color: "text-blue-600",
            value: loading ? "—" : String(data?.total_active ?? 0),
            sub: "com plano pago ativo",
          },
          {
            label: "Em trial", icon: Clock, color: "text-amber-600",
            value: loading ? "—" : String(data?.total_trial ?? 0),
            sub: "testando gratuitamente",
          },
          {
            label: "Churn no mês", icon: TrendingDown, color: "text-rose-600",
            value: loading ? "—" : String(data?.churn_this_month ?? 0),
            sub: "cancelamentos neste mês",
          },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <c.icon className={cn("h-4 w-4", c.color)} />
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{c.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{c.sub}</p>
          </motion.div>
        ))}
      </section>

      {/* ── Plan Cards ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Planos cadastrados</h2>
          <span className="text-xs text-muted-foreground">{data?.plans.length ?? 0} plano(s)</span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {(data?.plans ?? []).map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                expanded={expanded === plan.id}
                onToggleExpand={() => setExpanded(expanded === plan.id ? null : plan.id)}
                onEdit={() => setPlanModal({ open: true, plan: { ...plan } })}
                onToggle={handleToggle}
                onNewPromo={() => setPromoModal({ open: true, promo: { ...EMPTY_PROMO, plan_id: plan.id } })}
                onEditPromo={(p) => setPromoModal({ open: true, promo: { id: p.id, plan_id: p.plan_id, name: p.name, discount_pct: p.discount_pct, type: p.type, duration_months: p.duration_months, deadline_at: p.deadline_at, is_active: p.is_active } })}
                onDeletePromo={handleDeletePromo}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Promotions Table ───────────────────────────────────────────────── */}
      <section className="border border-border bg-card shadow-sm">
        <header className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Promoções</h2>
            <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
              {allPromos.length}
            </span>
          </div>
          <Button size="sm" variant="outline"
            onClick={() => setPromoModal({ open: true, promo: { ...EMPTY_PROMO, plan_id: data?.plans[0]?.id ?? "" } })}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Nova promoção
          </Button>
        </header>

        {allPromos.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma promoção criada. Clique em "Nova promoção" para começar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Nome</th>
                  <th className="px-4 py-3 text-left font-semibold">Plano</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Condição</th>
                  <th className="px-4 py-3 text-center font-semibold">Desconto</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allPromos.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.plan_name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        {promoTypeIcon(p.type)} {promoTypeLabel(p.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.type === "duration" && p.duration_months
                        ? `Primeiros ${p.duration_months} mês${p.duration_months > 1 ? "es" : ""}`
                        : p.type === "deadline" && p.deadline_at
                        ? `Até ${fmtDate(p.deadline_at)}`
                        : "Sempre ativo"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-bold text-emerald-600">{p.discount_pct}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500",
                      )}>
                        {p.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => setPromoModal({ open: true, promo: { ...p, id: p.id } })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600"
                          onClick={() => handleDeletePromo(p.id, p.name)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Plan Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {planModal.open && (
          <Modal title={planModal.plan.id ? "Editar Plano" : "Novo Plano"} onClose={() => setPlanModal((m) => ({ ...m, open: false }))}>
            <PlanForm
              plan={planModal.plan}
              onChange={(p) => setPlanModal((m) => ({ ...m, plan: p }))}
              onSave={handleSavePlan}
              onCancel={() => setPlanModal((m) => ({ ...m, open: false }))}
              saving={saving}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Promotion Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {promoModal.open && (
          <Modal title={promoModal.promo.id ? "Editar Promoção" : "Nova Promoção"} onClose={() => setPromoModal((m) => ({ ...m, open: false }))}>
            <PromoForm
              promo={promoModal.promo}
              plans={data?.plans ?? []}
              onChange={(p) => setPromoModal((m) => ({ ...m, promo: p }))}
              onSave={handleSavePromo}
              onCancel={() => setPromoModal((m) => ({ ...m, open: false }))}
              saving={saving}
            />
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan, expanded, onToggleExpand, onEdit, onToggle, onNewPromo, onEditPromo, onDeletePromo,
}: {
  plan: PlanWithStats;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onToggle: (id: string, field: "is_active" | "is_visible", value: boolean) => void;
  onNewPromo: () => void;
  onEditPromo: (p: PlanPromotion) => void;

  onDeletePromo: (id: string, name: string) => void;
}) {
  const activePromos = plan.promotions.filter((p) => p.is_active);

  return (
    <motion.div
      layout
      className={cn("border border-border bg-card shadow-sm", !plan.is_active && "opacity-60")}
    >
      {/* Card header row */}
      <div className="flex items-center gap-3 p-4">
        {/* Plan name + price */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold">{plan.display_name}</span>
            <span className="font-mono text-xs text-muted-foreground">{plan.id}</span>
            {!plan.is_active && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">INATIVO</span>
            )}
            {!plan.is_visible && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600">OCULTO</span>
            )}
            {activePromos.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                <Tag className="h-2.5 w-2.5" /> {activePromos.length} promoção ativa
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{fmtBRL(plan.price_cents)}</span>
            <span>/{cycleLabel(plan.billing_cycle)}</span>
            {plan.trial_days > 0 && <span className="text-xs">· {plan.trial_days}d trial</span>}
          </div>
        </div>

        {/* Subscriber mini stats */}
        <div className="hidden sm:flex items-center gap-4 text-center">
          <Stat label="Ativos" value={plan.sub_active} color="text-emerald-600" />
          <Stat label="Trial" value={plan.sub_trial} color="text-amber-600" />
          <Stat label="Suspensos" value={plan.sub_suspended} color="text-rose-500" />
          <Stat label="MRR" value={fmtBRL(plan.revenue_cents)} color="text-blue-600" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title={plan.is_visible ? "Ocultar do site" : "Mostrar no site"}
            onClick={() => onToggle(plan.id, "is_visible", !plan.is_visible)}>
            {plan.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title={plan.is_active ? "Desativar" : "Ativar"}
            onClick={() => onToggle(plan.id, "is_active", !plan.is_active)}>
            {plan.is_active
              ? <ToggleRight className="h-5 w-5 text-emerald-600" />
              : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Editar plano" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onToggleExpand}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              {/* Features */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Features</p>
                {plan.features.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma feature cadastrada.</p>
                ) : (
                  <ul className="space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Promotions for this plan */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Promoções</p>
                  <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[11px]" onClick={onNewPromo}>
                    <Plus className="h-3 w-3" /> Adicionar
                  </Button>
                </div>
                {plan.promotions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma promoção.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {plan.promotions.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 rounded border border-border px-2.5 py-1.5">
                        <span className={cn("flex-1 text-xs", !p.is_active && "line-through text-muted-foreground")}>{p.name}</span>
                        <span className="font-mono text-xs font-bold text-emerald-600">{p.discount_pct}%</span>
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => onEditPromo(p)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-rose-400" onClick={() => onDeletePromo(p.id, p.name)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("font-display text-lg font-bold tabular-nums", color)}>{value}</p>
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-card border border-border shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// ─── Plan Form ────────────────────────────────────────────────────────────────

function PlanForm({
  plan, onChange, onSave, onCancel, saving,
}: {
  plan: Omit<Plan, "created_at">;
  onChange: (p: Omit<Plan, "created_at">) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof typeof plan>(k: K, v: (typeof plan)[K]) => onChange({ ...plan, [k]: v });
  const [featInput, setFeatInput] = useState("");

  function addFeature() {
    const f = featInput.trim();
    if (!f) return;
    set("features", [...plan.features, f]);
    setFeatInput("");
  }
  function removeFeature(i: number) {
    set("features", plan.features.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do plano *">
          <Input value={plan.display_name} onChange={(e) => set("display_name", e.target.value)} placeholder="Ex: Premium" />
        </Field>
        <Field label="ID (slug)">
          <Input value={plan.id} onChange={(e) => set("id", e.target.value)} placeholder="premium" disabled={!!plan.id} className="font-mono text-xs" />
        </Field>
        <Field label="Preço (em centavos) *">
          <Input type="number" min={0} value={plan.price_cents}
            onChange={(e) => set("price_cents", parseInt(e.target.value) || 0)}
            placeholder="4990 = R$ 49,90" />
          {plan.price_cents > 0 && <p className="mt-1 text-[11px] text-muted-foreground">{fmtBRL(plan.price_cents)}</p>}
        </Field>
        <Field label="Ciclo de cobrança">
          <select
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            value={plan.billing_cycle}
            onChange={(e) => set("billing_cycle", e.target.value as Plan["billing_cycle"])}
          >
            <option value="monthly">Mensal</option>
            <option value="quarterly">Trimestral</option>
            <option value="yearly">Anual</option>
            <option value="none">Único / Sem ciclo</option>
          </select>
        </Field>
        <Field label="Dias de trial">
          <Input type="number" min={0} value={plan.trial_days} onChange={(e) => set("trial_days", parseInt(e.target.value) || 0)} />
        </Field>
        <Field label="Ordem de exibição">
          <Input type="number" min={0} value={plan.sort_order} onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)} />
        </Field>
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={plan.is_active} onChange={(e) => set("is_active", e.target.checked)} className="rounded" />
          <span className="text-sm font-medium">Ativo</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={plan.is_visible} onChange={(e) => set("is_visible", e.target.checked)} className="rounded" />
          <span className="text-sm font-medium">Visível no site</span>
        </label>
      </div>

      {/* Features */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Features</p>
        <div className="flex gap-2">
          <Input value={featInput} onChange={(e) => setFeatInput(e.target.value)}
            placeholder="Ex: Agenda completa" className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }} />
          <Button type="button" size="sm" variant="outline" onClick={addFeature}><Plus className="h-4 w-4" /></Button>
        </div>
        {plan.features.length > 0 && (
          <ul className="mt-2 space-y-1">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-center justify-between rounded border border-border px-3 py-1.5 text-sm">
                <span>{f}</span>
                <button onClick={() => removeFeature(i)} className="text-rose-400 hover:text-rose-600 text-xs">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button onClick={onSave} disabled={saving || !plan.display_name}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Salvar plano
        </Button>
      </div>
    </div>
  );
}

// ─── Promo Form ───────────────────────────────────────────────────────────────

function PromoForm({
  promo, plans, onChange, onSave, onCancel, saving,
}: {
  promo: PromoState;
  plans: PlanWithStats[];
  onChange: (p: PromoState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof PromoState>(k: K, v: PromoState[K]) => onChange({ ...promo, [k]: v });

  return (
    <div className="space-y-4">
      <Field label="Nome da promoção *">
        <Input value={promo.name} onChange={(e) => set("name", e.target.value)}
          placeholder='Ex: "Assine em junho com 20% off"' />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plano *">
          <select
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            value={promo.plan_id}
            onChange={(e) => set("plan_id", e.target.value)}
          >
            <option value="">Selecione…</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>
        </Field>

        <Field label="Desconto (%) *">
          <Input type="number" min={1} max={100} step={0.5} value={promo.discount_pct}
            onChange={(e) => set("discount_pct", parseFloat(e.target.value) || 0)} />
        </Field>
      </div>

      <Field label="Tipo de promoção *">
        <div className="grid grid-cols-3 gap-2">
          {(["duration", "deadline", "permanent"] as const).map((t) => (
            <button key={t}
              type="button"
              onClick={() => set("type", t)}
              className={cn(
                "flex flex-col items-center gap-1 rounded border p-3 text-xs font-medium transition-colors",
                promo.type === t ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40",
              )}
            >
              {promoTypeIcon(t)}
              {promoTypeLabel(t)}
            </button>
          ))}
        </div>
      </Field>

      {/* Conditional fields */}
      {promo.type === "duration" && (
        <Field label="Duração do desconto (meses) *">
          <Input type="number" min={1} value={promo.duration_months ?? 1}
            onChange={(e) => set("duration_months", parseInt(e.target.value) || 1)} />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Ex: 3 → "Primeiros 3 meses com {promo.discount_pct}% de desconto"
          </p>
        </Field>
      )}
      {promo.type === "deadline" && (
        <Field label="Data limite para assinar *">
          <Input type="date" value={promo.deadline_at ? promo.deadline_at.slice(0, 10) : ""}
            onChange={(e) => set("deadline_at", e.target.value ? e.target.value + "T23:59:59Z" : null)} />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Ex: 30/06 → "Assine até 30/06 com {promo.discount_pct}% de desconto"
          </p>
        </Field>
      )}
      {promo.type === "permanent" && (
        <p className="rounded border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Desconto aplicado permanentemente em todas as renovações deste plano.
        </p>
      )}

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={promo.is_active} onChange={(e) => set("is_active", e.target.checked)} className="rounded" />
        <span className="text-sm font-medium">Promoção ativa</span>
      </label>

      {/* Preview */}
      {promo.name && promo.discount_pct > 0 && (
        <div className="rounded border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700">
          <strong>Preview:</strong>{" "}
          {promo.type === "duration" && promo.duration_months
            ? `${promo.name} — ${promo.discount_pct}% de desconto nos primeiros ${promo.duration_months} meses`
            : promo.type === "deadline" && promo.deadline_at
            ? `${promo.name} — ${promo.discount_pct}% de desconto assinando até ${fmtDate(promo.deadline_at)}`
            : `${promo.name} — ${promo.discount_pct}% de desconto permanente`}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button onClick={onSave} disabled={saving || !promo.name || !promo.plan_id || promo.discount_pct <= 0}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Salvar promoção
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
