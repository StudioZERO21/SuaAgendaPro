import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  Users,
  MousePointerClick,
  Gift,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Ban,
  Play,
  Settings2,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getSuperReferralMetrics,
  getSuperReferralLinks,
  getSuperReferralConversions,
  adminToggleReferralLink,
  adminSetReferralExpiry,
  adminGrantReferralReward,
  type ReferralMetrics,
  type ReferralLink,
  type ReferralConversion,
} from "@/lib/super-referral.functions";
import { withSuperToken } from "@/lib/super-client";

export const Route = createFileRoute("/(admin)/super/_app/indicacoes")({
  head: () => ({
    meta: [{ title: "Indicações — Super Admin" }],
  }),
  component: IndicacoesPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  clicked:    { label: "Clicou",    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  registered: { label: "Cadastrou", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  paid:       { label: "Pagou",     color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  rewarded:   { label: "Recompensado", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: "bg-secondary text-secondary-foreground" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.color}`}>{s.label}</span>;
}

function fmt(d: string | null) {
  if (!d) return "—";
  return format(new Date(d), "dd/MM/yy HH:mm", { locale: ptBR });
}

function timeLeft(d: string | null) {
  if (!d) return "—";
  if (isPast(new Date(d))) return <span className="text-destructive">Expirado</span>;
  return <span className="text-emerald-600">{formatDistanceToNow(new Date(d), { locale: ptBR, addSuffix: true })}</span>;
}


// ─── Page ─────────────────────────────────────────────────────────────────────

function IndicacoesPage() {
  const [metrics,     setMetrics]     = useState<ReferralMetrics | null>(null);
  const [links,       setLinks]       = useState<ReferralLink[]>([]);
  const [conversions, setConversions] = useState<ReferralConversion[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");

  const [editLink,  setEditLink]  = useState<ReferralLink | null>(null);
  const [editOpen,  setEditOpen]  = useState(false);
  const [editExpiry, setEditExpiry] = useState("");
  const [editMaxUses, setEditMaxUses] = useState("");
  const [saving,    setSaving]    = useState(false);

  const [searchConv, setSearchConv] = useState("");
  const [searchLink, setSearchLink] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, l, c] = await Promise.all([
        getSuperReferralMetrics({ data: withSuperToken() }),
        getSuperReferralLinks({ data: withSuperToken() }),
        getSuperReferralConversions({ data: withSuperToken({ status: filterStatus }) }),
      ]);
      setMetrics(m);
      setLinks(l);
      setConversions(c);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function toggleLink(link: ReferralLink) {
    try {
      await adminToggleReferralLink({ data: withSuperToken({ linkId: link.id, isActive: !link.isActive }) });
      toast.success(link.isActive ? "Link desativado" : "Link ativado");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  }

  function openEdit(link: ReferralLink) {
    setEditLink(link);
    setEditExpiry(link.expiresAt ? link.expiresAt.slice(0, 10) : "");
    setEditMaxUses(link.maxUses !== null ? String(link.maxUses) : "");
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editLink) return;
    setSaving(true);
    try {
      await adminSetReferralExpiry({
        data: withSuperToken({
          linkId:    editLink.id,
          expiresAt: editExpiry ? new Date(editExpiry).toISOString() : null,
          maxUses:   editMaxUses ? Number(editMaxUses) : null,
        }),
      });
      toast.success("Link atualizado");
      setEditOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function grantReward(convId: string) {
    try {
      await adminGrantReferralReward({ data: withSuperToken({ conversionId: convId }) });
      toast.success("Recompensa concedida! +1 mês adicionado ao referrer.");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  }

  const filteredConversions = conversions.filter((c) => {
    if (!searchConv) return true;
    const q = searchConv.toLowerCase();
    return (
      c.referrerName.toLowerCase().includes(q) ||
      c.referrerEmail.toLowerCase().includes(q) ||
      (c.refereeEmail ?? "").toLowerCase().includes(q) ||
      (c.refereeName ?? "").toLowerCase().includes(q)
    );
  });

  const filteredLinks = links.filter((l) => {
    if (!searchLink) return true;
    const q = searchLink.toLowerCase();
    return (
      l.referrerName.toLowerCase().includes(q) ||
      l.referrerEmail.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const CARDS = [
    {
      label: "Links ativos",
      value: metrics?.activeLinks ?? null,
      sub:   metrics ? `de ${metrics.totalLinks} total` : null,
      icon:  Link2,
      tone:  "text-primary",
    },
    {
      label: "Total cliques",
      value: metrics?.totalClicks ?? null,
      sub:   null,
      icon:  MousePointerClick,
      tone:  "text-violet-600",
    },
    {
      label: "Cadastros",
      value: metrics?.totalRegistered ?? null,
      sub:   metrics ? `${metrics.pendingReward} aguardando pagamento` : null,
      icon:  Users,
      tone:  "text-amber-600",
    },
    {
      label: "Meses concedidos",
      value: metrics?.monthsGranted ?? null,
      sub:   metrics ? `${metrics.totalRewarded} recompensas` : null,
      icon:  Gift,
      tone:  "text-emerald-600",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Crescimento
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Indicações
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Programa de referência — gestão completa
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </header>

      {/* Métricas */}
      <section className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border xl:grid-cols-4">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="flex flex-col gap-4 bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {c.label}
              </p>
              <c.icon className={cn("h-4 w-4", c.tone)} />
            </div>
            <div>
              <p className="font-display text-3xl font-bold tabular-nums">
                {c.value !== null ? String(c.value) : (
                  <span className="animate-pulse text-muted-foreground">—</span>
                )}
              </p>
              {c.sub && (
                <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
              )}
            </div>
          </motion.div>
        ))}
      </section>

      <Tabs defaultValue="conversoes">
        <TabsList className="rounded-xl">
          <TabsTrigger value="conversoes">Conversões</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        {/* ── Tab Conversões ── */}
        <TabsContent value="conversoes" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Buscar por nome ou email…"
              value={searchConv}
              onChange={(e) => setSearchConv(e.target.value)}
              className="h-9 max-w-xs rounded-xl"
            />
            <div className="flex gap-2">
              {["todos","clicked","registered","paid","rewarded"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setFilterStatus(s); }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterStatus === s ? "gradient-primary text-white shadow-glow" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"}`}
                >
                  {s === "todos" ? "Todos" : STATUS_LABELS[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-3 text-left">Referrer</th>
                    <th className="px-4 py-3 text-left">Indicado</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Clicou</th>
                    <th className="px-4 py-3 text-left">Cadastrou</th>
                    <th className="px-4 py-3 text-left">Pagou</th>
                    <th className="px-4 py-3 text-left">Recompensa</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Carregando…</td></tr>
                  ) : filteredConversions.length === 0 ? (
                    <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Nenhuma conversão encontrada.</td></tr>
                  ) : filteredConversions.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{c.referrerName}</p>
                        <p className="text-xs text-muted-foreground">{c.referrerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        {c.refereeName ? (
                          <>
                            <p className="font-semibold">{c.refereeName}</p>
                            <p className="text-xs text-muted-foreground">{c.refereeEmail ?? "—"}</p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">{c.refereeEmail ?? "—"}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(c.clickedAt)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(c.registeredAt)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(c.firstPaidAt)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(c.rewardGrantedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {c.status === "registered" && !c.rewardGrantedAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => grantReward(c.id)}
                            className="h-7 rounded-lg px-2 text-xs"
                          >
                            <Award className="mr-1 h-3 w-3" />
                            Conceder
                          </Button>
                        )}
                        {c.status === "rewarded" && (
                          <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab Links ── */}
        <TabsContent value="links" className="space-y-4">
          <Input
            placeholder="Buscar por nome, email ou código…"
            value={searchLink}
            onChange={(e) => setSearchLink(e.target.value)}
            className="h-9 max-w-xs rounded-xl"
          />

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-3 text-left">Profissional</th>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Cliques</th>
                    <th className="px-4 py-3 text-center">Cadastros</th>
                    <th className="px-4 py-3 text-center">Recompensas</th>
                    <th className="px-4 py-3 text-left">Expira</th>
                    <th className="px-4 py-3 text-left">Limite usos</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="py-10 text-center text-muted-foreground">Carregando…</td></tr>
                  ) : filteredLinks.length === 0 ? (
                    <tr><td colSpan={9} className="py-10 text-center text-muted-foreground">Nenhum link encontrado.</td></tr>
                  ) : filteredLinks.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{l.referrerName}</p>
                        <p className="text-xs text-muted-foreground">{l.referrerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{l.code}</code>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {l.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                            <XCircle className="h-3 w-3" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{l.totalClicks}</td>
                      <td className="px-4 py-3 text-center font-semibold">{l.totalConverted}</td>
                      <td className="px-4 py-3 text-center font-semibold">{l.totalRewarded}</td>
                      <td className="px-4 py-3 text-xs">
                        {l.expiresAt ? (
                          <div>
                            <p>{fmt(l.expiresAt)}</p>
                            <p className="mt-0.5">{timeLeft(l.expiresAt)}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sem limite</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {l.maxUses !== null ? (
                          <span>{l.totalClicks}/{l.maxUses}</span>
                        ) : (
                          <span className="text-muted-foreground">Ilimitado</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(l)}
                            className="h-7 rounded-lg px-2 text-xs"
                          >
                            <Settings2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={l.isActive ? "destructive" : "outline"}
                            onClick={() => toggleLink(l)}
                            className="h-7 rounded-lg px-2 text-xs"
                          >
                            {l.isActive ? <Ban className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog editar link */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Configurar link — {editLink?.referrerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="expiry">Data de expiração</Label>
              <Input
                id="expiry"
                type="date"
                value={editExpiry}
                onChange={(e) => setEditExpiry(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">Deixe vazio para nunca expirar</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxuses">Limite de usos</Label>
              <Input
                id="maxuses"
                type="number"
                min={1}
                placeholder="Ex: 10"
                value={editMaxUses}
                onChange={(e) => setEditMaxUses(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">Deixe vazio para ilimitado</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving} className="gradient-primary text-white shadow-glow">
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
