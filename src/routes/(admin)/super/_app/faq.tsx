import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HelpCircle, Plus, Pencil, Trash2, Search, RefreshCw,
  ChevronDown, ChevronRight, ToggleLeft, ToggleRight,
  BarChart2, TrendingUp, Eye, Bot, Tag, Folder, FolderOpen,
  AlertTriangle, CheckCircle2, XCircle, X, Save, Layers,
  MessageSquare, ArrowUpDown,
} from "lucide-react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn }      from "@/lib/utils";
import { toast }   from "sonner";
import { withSuperToken } from "@/lib/super-client";
import {
  getFaqCategories, saveFaqCategory, deleteFaqCategory, toggleFaqCategory,
  getFaqSubcategories, saveFaqSubcategory, deleteFaqSubcategory,
  getFaqItems, saveFaqItem, deleteFaqItem, toggleFaqItem,
  getFaqMetrics,
  type FaqCategory, type FaqSubcategory, type FaqItem, type FaqMetrics,
} from "@/lib/super-faq.functions";

export const Route = createFileRoute("/(admin)/super/_app/faq")({
  ssr:       false,
  head: () => ({ meta: [{ title: "FAQ — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: FaqPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const SOURCE_LABEL: Record<string, string> = { ai: "IA / N8N", admin: "Admin", public: "Público" };
const COLORS = ["#6366f1","#8b5cf6","#a78bfa","#c4b5fd","#ddd6fe"];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub?: string;
  icon: React.FC<any>; color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange, loading }: { enabled: boolean; onChange: (v: boolean) => void; loading?: boolean }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      disabled={loading}
      className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none disabled:opacity-50",
        enabled ? "bg-emerald-500" : "bg-input",
      )}
    >
      <span className={cn("pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform",
        enabled ? "translate-x-4" : "translate-x-0",
      )} />
    </button>
  );
}

// ─── FAQ Page ─────────────────────────────────────────────────────────────────

type Tab = "visao-geral" | "categorias" | "itens";

function FaqPage() {
  const [tab, setTab] = useState<Tab>("visao-geral");

  const [cats,    setCats]    = useState<FaqCategory[]>([]);
  const [subs,    setSubs]    = useState<FaqSubcategory[]>([]);
  const [items,   setItems]   = useState<FaqItem[]>([]);
  const [metrics, setMetrics] = useState<FaqMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [c, s, i, m] = await Promise.all([
        getFaqCategories({ data: withSuperToken() }),
        getFaqSubcategories({ data: withSuperToken() }),
        getFaqItems({ data: withSuperToken() }),
        getFaqMetrics({ data: withSuperToken() }),
      ]);
      setCats(c); setSubs(s); setItems(i); setMetrics(m);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar FAQ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const TABS: { key: Tab; label: string; icon: React.FC<any> }[] = [
    { key: "visao-geral", label: "Visão Geral",  icon: BarChart2     },
    { key: "categorias",  label: "Categorias",    icon: Folder        },
    { key: "itens",       label: "Itens",         icon: HelpCircle    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FAQ</h1>
          <p className="text-sm text-muted-foreground">Base de conhecimento para IA e usuários</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              tab === t.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {tab === "visao-geral" && metrics && (
            <VisaoGeral metrics={metrics} cats={cats} />
          )}
          {tab === "categorias" && (
            <Categorias
              cats={cats} subs={subs} items={items}
              onRefresh={load}
            />
          )}
          {tab === "itens" && (
            <Itens
              cats={cats} subs={subs} items={items}
              onRefresh={load}
            />
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: VISÃO GERAL
// ══════════════════════════════════════════════════════════════════════════════

function VisaoGeral({ metrics, cats }: { metrics: FaqMetrics; cats: FaqCategory[] }) {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total de itens"   value={metrics.totalItems}    icon={HelpCircle}   color="bg-indigo-500" />
        <StatCard label="Habilitados"      value={metrics.enabledItems}  icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard label="Desabilitados"    value={metrics.disabledItems} icon={XCircle}      color="bg-zinc-400"   />
        <StatCard label="Categorias"       value={metrics.totalCategories} icon={Folder}     color="bg-violet-500" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Consultas totais" value={metrics.totalViews + metrics.aiViews}
          sub="todas as fontes" icon={Eye}    color="bg-sky-500"    />
        <StatCard label="Consultas IA"     value={metrics.aiViews}
          sub="N8N / automações" icon={Bot}  color="bg-purple-500" />
        <StatCard label="Consultas este mês" value={metrics.viewsThisMonth + metrics.aiViewsThisMonth}
          sub="mês atual"       icon={TrendingUp} color="bg-amber-500" />
        <StatCard label="IA este mês"      value={metrics.aiViewsThisMonth}
          sub="N8N este mês"    icon={MessageSquare} color="bg-rose-500" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Views por dia */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Consultas — últimos 14 dias</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.viewsByDay} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }}
                formatter={(v, name) => [v, name === "views" ? "Geral" : "IA"]}
              />
              <Bar dataKey="views"   fill="#6366f1" radius={[4,4,0,0]} name="views" />
              <Bar dataKey="aiViews" fill="#8b5cf6" radius={[4,4,0,0]} name="aiViews" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 mais consultados */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Top 10 mais consultados</h2>
          {metrics.topItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma consulta registrada ainda</p>
          ) : (
            <div className="space-y-2">
              {metrics.topItems.map((item, idx) => {
                const total = item.viewCount + item.aiViewCount;
                const max   = (metrics.topItems[0].viewCount + metrics.topItems[0].aiViewCount) || 1;
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-right text-xs font-bold text-muted-foreground">{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-foreground">{item.question}</p>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${(total / max) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-bold text-foreground">{total}</span>
                      {item.aiViewCount > 0 && (
                        <span className="ml-1 text-[10px] text-purple-500">({item.aiViewCount} IA)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Views por categoria + por fonte */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Consultas por categoria</h2>
          {metrics.viewsByCategory.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sem dados ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={metrics.viewsByCategory} layout="vertical" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="views" radius={[0,4,4,0]}>
                  {metrics.viewsByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Consultas por fonte (mês atual)</h2>
          {metrics.viewsBySource.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sem dados ainda</p>
          ) : (
            <div className="space-y-3 pt-2">
              {metrics.viewsBySource.map((s, i) => {
                const total = metrics.viewsBySource.reduce((a, b) => a + b.count, 0) || 1;
                return (
                  <div key={s.source} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 text-sm text-foreground">{SOURCE_LABEL[s.source] ?? s.source}</span>
                    <span className="text-sm font-bold text-foreground">{s.count}</span>
                    <span className="w-12 text-right text-xs text-muted-foreground">{Math.round((s.count / total) * 100)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Endpoint N8N */}
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 h-5 w-5 shrink-0 text-purple-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Endpoint para N8N / IA</p>
            <p className="mt-1 text-xs text-muted-foreground mb-2">
              Configure o N8N para fazer uma requisição GET ou POST neste endpoint. Os resultados são registrados automaticamente.
            </p>
            <div className="rounded-lg bg-background px-3 py-2 font-mono text-xs text-foreground border border-border">
              GET /api/faq/search?q=<span className="text-indigo-500">sua_pergunta</span>&limit=5&source=ai
            </div>
            <div className="mt-2 rounded-lg bg-background px-3 py-2 font-mono text-xs text-foreground border border-border">
              POST /api/faq/search {"{"} "query": "...", "limit": 5, "source": "ai" {"}"}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Retorna: <code className="rounded bg-muted px-1">{"{ results: [{ id, category, subcategory, question, answer, keywords }], total, query }"}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: CATEGORIAS (tree view com subcategorias inline)
// ══════════════════════════════════════════════════════════════════════════════

function Categorias({ cats, subs, items, onRefresh }: {
  cats: FaqCategory[]; subs: FaqSubcategory[]; items: FaqItem[]; onRefresh: () => void;
}) {
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [catModal,  setCatModal]    = useState<Partial<FaqCategory> | null>(null);
  const [subModal,  setSubModal]    = useState<Partial<FaqSubcategory> & { categoryId?: string } | null>(null);
  const [saving,    setSaving]      = useState(false);
  const [toggling,  setToggling]    = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  async function handleSaveCat() {
    if (!catModal) return;
    setSaving(true);
    try {
      await saveFaqCategory({ data: withSuperToken({
        id:          catModal.id,
        name:        catModal.name!,
        slug:        catModal.slug || slugify(catModal.name ?? ""),
        description: catModal.description ?? "",
        icon:        catModal.icon ?? "❓",
        sortOrder:   catModal.sortOrder ?? 0,
        enabled:     catModal.enabled ?? true,
      }) });
      toast.success("Categoria salva!");
      setCatModal(null);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCat(id: string) {
    if (!confirm("Excluir esta categoria? Esta ação não pode ser desfeita.")) return;
    try {
      await deleteFaqCategory({ data: withSuperToken({ id }) });
      toast.success("Categoria excluída!");
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir categoria");
    }
  }

  async function handleToggleCat(id: string, enabled: boolean) {
    setToggling(id);
    try {
      await toggleFaqCategory({ data: withSuperToken({ id, enabled }) });
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setToggling(null);
    }
  }

  async function handleSaveSub() {
    if (!subModal?.categoryId) return;
    setSaving(true);
    try {
      await saveFaqSubcategory({ data: withSuperToken({
        id:         subModal.id,
        categoryId: subModal.categoryId,
        name:       subModal.name!,
        sortOrder:  subModal.sortOrder ?? 0,
        enabled:    subModal.enabled ?? true,
      }) });
      toast.success("Subcategoria salva!");
      setSubModal(null);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar subcategoria");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSub(id: string) {
    if (!confirm("Excluir esta subcategoria?")) return;
    try {
      await deleteFaqSubcategory({ data: withSuperToken({ id }) });
      toast.success("Subcategoria excluída!");
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir subcategoria");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{cats.length} categoria(s) cadastrada(s)</p>
        <Button size="sm" onClick={() => setCatModal({ enabled: true, icon: "❓", sortOrder: cats.length })}>
          <Plus className="mr-2 h-4 w-4" /> Nova categoria
        </Button>
      </div>

      {cats.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <Folder className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhuma categoria criada ainda.</p>
          <Button size="sm" onClick={() => setCatModal({ enabled: true, icon: "❓" })}>
            <Plus className="mr-1 h-4 w-4" /> Criar categoria
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {cats.map(cat => {
          const catSubs  = subs.filter(s => s.categoryId === cat.id);
          const catItems = items.filter(i => i.categoryId === cat.id && !i.subcategoryId);
          const isOpen   = expanded.has(cat.id);

          return (
            <div key={cat.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Category row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => toggleExpand(cat.id)} className="shrink-0 text-muted-foreground">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <span className="text-lg">{cat.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground">{cat.name}</p>
                  {cat.description && <p className="truncate text-xs text-muted-foreground">{cat.description}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {cat.itemCount} itens
                  </span>
                  <Toggle
                    enabled={cat.enabled}
                    onChange={v => handleToggleCat(cat.id, v)}
                    loading={toggling === cat.id}
                  />
                  <button onClick={() => setCatModal(cat)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDeleteCat(cat.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded: subcategories + direct items */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
                      {/* Subcategories */}
                      {catSubs.map(sub => {
                        const subItems = items.filter(i => i.subcategoryId === sub.id);
                        return (
                          <div key={sub.id} className="rounded-xl border border-border bg-card px-3 py-2.5 flex items-center gap-3">
                            <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{sub.name}</p>
                            </div>
                            <span className="text-[11px] text-muted-foreground">{subItems.length} itens</span>
                            <Toggle enabled={sub.enabled} onChange={() => {}} />
                            <button onClick={() => setSubModal({ ...sub, categoryId: sub.categoryId })} className="rounded p-1 text-muted-foreground hover:bg-muted">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button onClick={() => handleDeleteSub(sub.id)} className="rounded p-1 text-muted-foreground hover:text-rose-600">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Add subcategory */}
                      <button
                        onClick={() => setSubModal({ categoryId: cat.id, enabled: true, sortOrder: catSubs.length })}
                        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Adicionar subcategoria
                      </button>

                      {/* Direct items count */}
                      {catItems.length > 0 && (
                        <p className="text-xs text-muted-foreground px-1">
                          + {catItems.length} item(s) diretamente na categoria (sem subcategoria)
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Modal: Categoria */}
      <Dialog open={!!catModal} onOpenChange={o => !o && setCatModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{catModal?.id ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          {catModal && (
            <div className="space-y-4 py-2">
              <div className="flex gap-3">
                <div className="w-20">
                  <label className="text-xs font-medium text-muted-foreground">Ícone</label>
                  <Input
                    value={catModal.icon ?? "❓"}
                    onChange={e => setCatModal(p => ({ ...p, icon: e.target.value }))}
                    className="mt-1 text-center text-xl"
                    maxLength={4}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                  <Input
                    value={catModal.name ?? ""}
                    onChange={e => setCatModal(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))}
                    placeholder="Ex: Agendamento"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Slug (URL)</label>
                <Input
                  value={catModal.slug ?? ""}
                  onChange={e => setCatModal(p => ({ ...p, slug: e.target.value }))}
                  placeholder="agendamento"
                  className="mt-1 font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                <Input
                  value={catModal.description ?? ""}
                  onChange={e => setCatModal(p => ({ ...p, description: e.target.value }))}
                  placeholder="Descreva o tema desta categoria..."
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <Toggle enabled={catModal.enabled ?? true} onChange={v => setCatModal(p => ({ ...p, enabled: v }))} />
                <span className="text-sm text-foreground">{catModal.enabled ? "Habilitada" : "Desabilitada"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatModal(null)}>Cancelar</Button>
            <Button onClick={handleSaveCat} disabled={saving || !catModal?.name?.trim()}>
              {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Subcategoria */}
      <Dialog open={!!subModal} onOpenChange={o => !o && setSubModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{subModal?.id ? "Editar subcategoria" : "Nova subcategoria"}</DialogTitle>
          </DialogHeader>
          {subModal && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                <Input
                  value={subModal.name ?? ""}
                  onChange={e => setSubModal(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Cancelamentos"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <Toggle enabled={subModal.enabled ?? true} onChange={v => setSubModal(p => ({ ...p, enabled: v }))} />
                <span className="text-sm text-foreground">{subModal.enabled ? "Habilitada" : "Desabilitada"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubModal(null)}>Cancelar</Button>
            <Button onClick={handleSaveSub} disabled={saving || !subModal?.name?.trim()}>
              {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: ITENS
// ══════════════════════════════════════════════════════════════════════════════

function Itens({ cats, subs, items, onRefresh }: {
  cats: FaqCategory[]; subs: FaqSubcategory[]; items: FaqItem[]; onRefresh: () => void;
}) {
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy,    setSortBy]    = useState<"question" | "viewCount" | "createdAt">("createdAt");
  const [modal,     setModal]     = useState<Partial<FaqItem> | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [toggling,  setToggling]  = useState<string | null>(null);
  const [kwInput,   setKwInput]   = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (catFilter !== "all") list = list.filter(i => i.categoryId === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.question.toLowerCase().includes(q) ||
        i.answer.toLowerCase().includes(q) ||
        i.keywords.some(k => k.toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === "viewCount")  return (b.viewCount + b.aiViewCount) - (a.viewCount + a.aiViewCount);
      if (sortBy === "question")   return a.question.localeCompare(b.question);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [items, catFilter, search, sortBy]);

  async function handleSave() {
    if (!modal?.categoryId || !modal?.question?.trim() || !modal?.answer?.trim()) return;
    setSaving(true);
    try {
      await saveFaqItem({ data: withSuperToken({
        id:            modal.id,
        categoryId:    modal.categoryId,
        subcategoryId: modal.subcategoryId ?? null,
        question:      modal.question,
        answer:        modal.answer,
        keywords:      modal.keywords ?? [],
        sortOrder:     modal.sortOrder ?? 0,
        enabled:       modal.enabled ?? true,
      }) });
      toast.success("Item salvo!");
      setModal(null);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este item do FAQ? Esta ação não pode ser desfeita.")) return;
    try {
      await deleteFaqItem({ data: withSuperToken({ id }) });
      toast.success("Item excluído!");
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir item");
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    setToggling(id);
    try {
      await toggleFaqItem({ data: withSuperToken({ id, enabled }) });
      onRefresh();
    } catch {
      toast.error("Erro ao atualizar");
    } finally {
      setToggling(null);
    }
  }

  const modalSubs = subs.filter(s => s.categoryId === modal?.categoryId);

  function addKeyword() {
    const kw = kwInput.trim();
    if (!kw || modal?.keywords?.includes(kw)) return;
    setModal(p => ({ ...p, keywords: [...(p?.keywords ?? []), kw] }));
    setKwInput("");
  }

  function removeKeyword(kw: string) {
    setModal(p => ({ ...p, keywords: (p?.keywords ?? []).filter(k => k !== kw) }));
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar pergunta, resposta, palavra-chave..."
            className="pl-9"
          />
        </div>
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="all">Todas as categorias</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="createdAt">Mais recentes</option>
          <option value="viewCount">Mais consultados</option>
          <option value="question">Alfabética</option>
        </select>
        <Button size="sm" onClick={() => setModal({ enabled: true, keywords: [], sortOrder: items.length })}>
          <Plus className="mr-2 h-4 w-4" /> Novo item
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} item(s) encontrado(s)</p>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <HelpCircle className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
          <Button size="sm" onClick={() => setModal({ enabled: true, keywords: [], sortOrder: 0 })}>
            <Plus className="mr-1 h-4 w-4" /> Criar primeiro item
          </Button>
        </div>
      )}

      {/* Items table */}
      {filtered.length > 0 && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pergunta</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Categoria</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Consultas</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {filtered.map(item => (
                <tr key={item.id} className="group hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground line-clamp-2 max-w-xs">{item.question}</p>
                    {item.keywords.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.keywords.slice(0, 3).map(kw => (
                          <span key={kw} className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                            {kw}
                          </span>
                        ))}
                        {item.keywords.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{item.keywords.length - 3}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div>
                      <span className="text-xs font-medium text-foreground">{item.categoryName}</span>
                      {item.subcategoryName && (
                        <p className="text-[11px] text-muted-foreground">{item.subcategoryName}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.viewCount + item.aiViewCount}</p>
                      {item.aiViewCount > 0 && (
                        <p className="text-[10px] text-purple-500">{item.aiViewCount} IA</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      enabled={item.enabled}
                      onChange={v => handleToggle(item.id, v)}
                      loading={toggling === item.id}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setModal({ ...item })}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Item */}
      <Dialog open={!!modal} onOpenChange={o => !o && setModal(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modal?.id ? "Editar item FAQ" : "Novo item FAQ"}</DialogTitle>
          </DialogHeader>
          {modal && (
            <div className="space-y-4 py-2">
              {/* Categoria + Subcategoria */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Categoria *</label>
                  <select
                    value={modal.categoryId ?? ""}
                    onChange={e => setModal(p => ({ ...p, categoryId: e.target.value, subcategoryId: null }))}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Subcategoria</label>
                  <select
                    value={modal.subcategoryId ?? ""}
                    onChange={e => setModal(p => ({ ...p, subcategoryId: e.target.value || null }))}
                    disabled={!modal.categoryId || modalSubs.length === 0}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50"
                  >
                    <option value="">Sem subcategoria</option>
                    {modalSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Pergunta */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Pergunta *</label>
                <Input
                  value={modal.question ?? ""}
                  onChange={e => setModal(p => ({ ...p, question: e.target.value }))}
                  placeholder="Ex: Como cancelo um agendamento?"
                  className="mt-1"
                />
              </div>

              {/* Resposta */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Resposta *</label>
                <Textarea
                  value={modal.answer ?? ""}
                  onChange={e => setModal(p => ({ ...p, answer: e.target.value }))}
                  placeholder="Resposta detalhada para a IA utilizar..."
                  className="mt-1 min-h-32 resize-y"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {modal.answer?.length ?? 0}/5000 caracteres
                </p>
              </div>

              {/* Keywords */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Palavras-chave (para busca IA)</label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={kwInput}
                    onChange={e => setKwInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    placeholder="Digite e pressione Enter..."
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {(modal.keywords ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {modal.keywords!.map(kw => (
                      <span key={kw} className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {kw}
                        <button onClick={() => removeKeyword(kw)} className="hover:text-rose-600">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Habilitado */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <Toggle enabled={modal.enabled ?? true} onChange={v => setModal(p => ({ ...p, enabled: v }))} />
                <div>
                  <p className="text-sm font-medium text-foreground">{modal.enabled ? "Habilitado" : "Desabilitado"}</p>
                  <p className="text-xs text-muted-foreground">
                    {modal.enabled ? "Visível na busca da IA e pública" : "Oculto de todas as buscas"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !modal?.categoryId || !modal?.question?.trim() || !modal?.answer?.trim()}
            >
              {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
