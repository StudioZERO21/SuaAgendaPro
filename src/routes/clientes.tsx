import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Phone, MessageCircle, Cake, Calendar, Crown, X, Pencil,
  Mail, MapPin, StickyNote, Check, ChevronLeft, ChevronRight, CalendarCheck,
  Heart, Loader2, Lock, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import { useClientes, useCreateCliente, useUpdateCliente, type UIClient } from "@/hooks/useClientes";
import { formatPrice } from "@/hooks/useServicos";
import { cn } from "@/lib/utils";
import { PhoneInputBR } from "@/components/ui/phone-input";
import { toast } from "sonner";

import mulheresIconUrl from "@/assets/mulheres-icon.svg";

function WomanIcon({ className }: { className?: string }) {
  return <img src={mulheresIconUrl} alt="" aria-hidden="true" className={cn("object-contain", className)} />;
}

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — SuaAgenda.Pro" },
      { name: "description", content: "Gerencie sua base de clientes." },
    ],
  }),
  component: ClientesPage,
});

type Tab = "todas" | "vip" | "novas";

type VipType = "auto" | "manual" | "both" | null;

type EnrichedClient = UIClient & {
  vip: boolean;
  vipType: VipType;
  birthdayThisMonth: boolean;
  hasApptThisMonth: boolean;
};

function vipBadgeCls(type: VipType, size: "sm" | "lg" = "sm") {
  const base = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  if (type === "manual" || type === "both")
    return `${base} absolute -right-1 -top-1 flex items-center justify-center rounded-full gradient-primary text-white shadow-glow`;
  if (type === "auto")
    return `${base} absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-amber-400 text-amber-900`;
  return "";
}

function VipBlock({
  vipType, manualVip, editing, onChange,
}: {
  vipType: VipType;
  manualVip: boolean;
  editing: boolean;
  onChange?: (v: boolean) => void;
}) {
  const isAuto   = vipType === "auto" || vipType === "both";
  const isManual = vipType === "manual" || vipType === "both";
  const isAny    = vipType !== null;

  const iconCls = isManual
    ? "gradient-primary text-white shadow-glow"
    : isAuto
    ? "bg-amber-400 text-amber-900"
    : "bg-secondary text-muted-foreground";

  const subtitle = isAuto && isManual
    ? "Top 5% da base e seleção manual"
    : isAuto
    ? "Top 5% em gastos ou frequência"
    : isManual
    ? "Selecionado manualmente"
    : "Marcar como VIP manualmente";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-all", iconCls)}>
        <Crown className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold leading-tight">Cliente VIP</p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      {editing ? (
        <Switch checked={manualVip} onCheckedChange={onChange} />
      ) : (
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wide",
          isManual ? "text-primary" : isAuto ? "text-amber-500" : "text-muted-foreground/50",
        )}>
          {isAny ? "VIP" : "—"}
        </span>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

function ClientesPage() {
  const [query, setQuery]           = useState("");
  const [tab, setTab]               = useState<Tab>("todas");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [editing, setEditing]       = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage]             = useState(1);
  const pageSize = 8;

  const { data: clients = [], isLoading } = useClientes();

  const currentMonth = new Date().getMonth() + 1; // 1–12

  const enriched: EnrichedClient[] = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const active = clients.filter(
      (c) => c.lastAppointmentAt && new Date(c.lastAppointmentAt) >= sixMonthsAgo,
    );
    const topN = Math.max(1, Math.ceil(active.length * 0.05));

    const topSpendIds = new Set(
      [...active].sort((a, b) => b.totalSpentCents - a.totalSpentCents).slice(0, topN).map((c) => c.id),
    );
    const topVisitIds = new Set(
      [...active].sort((a, b) => b.totalAppointments - a.totalAppointments).slice(0, topN).map((c) => c.id),
    );

    return clients.map((c) => {
      const hasApptThisMonth = c.lastAppointmentAt
        ? new Date(c.lastAppointmentAt).getMonth() + 1 === currentMonth
        : false;
      let birthdayThisMonth = false;
      if (c.birthDate) {
        const month = parseInt(c.birthDate.split("-")[1], 10);
        birthdayThisMonth = month === currentMonth;
      }
      const autoVip   = topSpendIds.has(c.id) || topVisitIds.has(c.id);
      const manualVip = c.isVip;
      const vipType: VipType = autoVip && manualVip ? "both" : autoVip ? "auto" : manualVip ? "manual" : null;
      return {
        ...c,
        vip: vipType !== null,
        vipType,
        birthdayThisMonth,
        hasApptThisMonth,
      };
    });
  }, [clients, currentMonth]);

  const filtered = enriched.filter((c) => {
    if (tab === "vip"   && !c.vip)          return false;
    if (tab === "novas" && c.totalAppointments > 1) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.phone.includes(query)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = {
    total:     enriched.length,
    vip:       enriched.filter((c) => c.vip).length,
    birthdays: enriched.filter((c) => c.birthdayThisMonth).length,
  };

  const selected = enriched.find((c) => c.id === selectedId) ?? null;

  function openClient(id: string) {
    setSelectedId(id);
    setShowFullDetails(false);
    setEditing(false);
  }
  function closeModal() {
    setSelectedId(null);
    setShowFullDetails(false);
    setEditing(false);
  }

  return (
    <MobileShell withNav>
      <header className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sua base</p>
            <h1 className="font-display text-3xl font-bold leading-tight">Clientes</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-11 rounded-2xl gradient-primary px-4 text-sm font-semibold shadow-glow"
            >
              <Plus className="mr-1 h-4 w-4" /> Nova
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatCard label="Total"        value={String(stats.total)}     icon={Heart}   />
          <StatCard label="VIP"          value={String(stats.vip)}       icon={Crown}   highlight />
          <StatCard label="Niver. do Mês" value={String(stats.birthdays)} icon={Cake}    />
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Buscar cliente..."
            className="h-12 rounded-2xl border-border bg-card pl-11 text-sm shadow-card focus-visible:ring-primary"
          />
        </div>

        <div className="mt-4 inline-flex w-full rounded-2xl border border-border bg-card p-1 shadow-card">
          {(["todas", "vip", "novas"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(1); }}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2 text-xs font-semibold capitalize transition-all",
                  active ? "gradient-primary text-white shadow-glow" : "text-muted-foreground",
                )}
              >
                {t === "todas" ? "Todas" : t === "vip" ? "VIP" : "Novas"}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mt-5 flex-1 px-5 pb-6">
        {isLoading && (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl gradient-soft text-primary">
              <WomanIcon className="h-6 w-6" />
            </div>
            <p className="font-display text-lg font-semibold">Nenhuma cliente</p>
            <p className="text-sm text-muted-foreground">Tente outro filtro ou cadastre uma nova.</p>
            <Button onClick={() => setCreateOpen(true)} className="mt-1 h-10 rounded-2xl gradient-primary px-4 shadow-glow">
              <Plus className="mr-1 h-4 w-4" /> Nova cliente
            </Button>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border bg-secondary/40 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Cliente</span>
                <span className="text-right">Visitas</span>
                <span className="w-16 text-center">Mês</span>
              </div>

              {paginated.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => openClient(c.id)}
                  className={cn(
                    "grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 text-left transition active:bg-secondary/60",
                    i !== paginated.length - 1 && "border-b border-border/60",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-soft"
                      style={{ background: `linear-gradient(135deg, ${c.color}, var(--primary))` }}
                    >
                      {c.initials}
                      {c.vipType && (
                        <span className={vipBadgeCls(c.vipType, "sm")}>
                          <Crown className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold leading-tight text-foreground truncate">{c.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.phone}</p>
                    </div>
                  </div>
                  <span className="text-right text-xs font-semibold text-muted-foreground">{c.totalAppointments}</span>
                  <span className="flex w-16 items-center justify-center">
                    {c.hasApptThisMonth ? (
                      <span title="Tem agendamento no mês" className="flex h-7 w-7 items-center justify-center rounded-full gradient-primary text-white shadow-glow">
                        <CalendarCheck className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground/60">—</span>
                    )}
                  </span>
                </motion.button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                  className="flex h-9 items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-card transition active:scale-95 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const n = idx + 1;
                    const active = n === safePage;
                    return (
                      <button key={n} onClick={() => setPage(n)}
                        className={cn("h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition", active ? "gradient-primary text-white shadow-glow" : "bg-card text-muted-foreground border border-border")}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  className="flex h-9 items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-card transition active:scale-95 disabled:opacity-40"
                >
                  Próxima <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />

      <AnimatePresence>
        {selected && (
          <ClientModal
            client={selected}
            showFullDetails={showFullDetails}
            editing={editing}
            onToggleDetails={() => setShowFullDetails((v) => !v)}
            onEdit={() => setEditing(true)}
            onCancelEdit={() => setEditing(false)}
            onClose={closeModal}
            onSaved={closeModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createOpen && (
          <CreateClientModal
            onClose={() => setCreateOpen(false)}
            onCreated={() => setCreateOpen(false)}
          />
        )}
      </AnimatePresence>
    </MobileShell>
  );
}

// ── Stat Card ─────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, highlight,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  highlight?: boolean;
}) {
  return (
    <div className={cn("relative flex flex-col justify-between overflow-hidden rounded-lg border px-3 pt-2 pb-1 shadow-card h-[88px]", highlight ? "gradient-primary border-transparent text-white shadow-glow" : "border-border bg-card")}>
      <Icon className={cn("pointer-events-none absolute -bottom-4 -right-4 h-20 w-20", highlight ? "text-white/25" : "text-primary/15")} strokeWidth={1.5} />
      <div className="relative flex items-start justify-center pt-1">
        <p className={cn("text-center font-display text-5xl font-extrabold leading-none", highlight ? "text-white" : "text-foreground")}>{value}</p>
      </div>
      <p className={cn("relative text-center text-[9px] font-semibold uppercase tracking-wider", highlight ? "text-white/90" : "text-zinc-500")}>{label}</p>
    </div>
  );
}

// ── Client Modal ──────────────────────────────────────────────

type LocalExtras = { birthday: string; address: string };

function ClientModal({
  client, showFullDetails, editing, onToggleDetails, onEdit, onCancelEdit, onClose, onSaved,
}: {
  client: EnrichedClient;
  showFullDetails: boolean;
  editing: boolean;
  onToggleDetails: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const updateCliente = useUpdateCliente();

  // birth_date stored as YYYY-MM-DD; display as DD/MM
  function toDisplay(iso: string | null | undefined) {
    if (!iso) return "";
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  }
  function toIso(ddmm: string): string | null {
    const clean = ddmm.replace(/\D/g, "");
    if (clean.length !== 4) return null;
    return `2000-${clean.slice(2, 4)}-${clean.slice(0, 2)}`;
  }

  const [form, setForm] = useState({
    name:          client.name,
    phone:         client.phone,
    email:         client.email ?? "",
    notes:         client.notes ?? "",
    internalNotes: client.internalNotes ?? "",
    birthday:      toDisplay(client.birthDate),
    address:       "" as string,
    isVip:         client.isVip,
  });
  const [showAddress, setShowAddress] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    try {
      await updateCliente.mutateAsync({
        id:            client.id,
        name:          form.name,
        phone:         form.phone,
        email:         form.email || null,
        notes:         form.notes || null,
        internalNotes: form.internalNotes || null,
        birthDate:     toIso(form.birthday),
        isVip:         form.isVip,
      });
      toast.success("Cliente atualizada");
      onSaved();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  }

  const phone = client.phone.replace(/\D/g, "");
  const waUrl = phone ? `https://wa.me/${phone}` : "#";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl border border-border bg-card shadow-card sm:rounded-3xl"
      >
        <div className="relative px-5 pb-4 pt-5">
          <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:bg-secondary/80">
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-soft"
              style={{ background: `linear-gradient(135deg, ${client.color}, var(--primary))` }}
            >
              {client.initials}
              {client.vipType && (
                <span className={cn(
                  "absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full",
                  client.vipType === "auto"
                    ? "bg-amber-400 text-amber-900"
                    : "gradient-primary text-white shadow-glow",
                )}>
                  <Crown className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 pr-8">
              {editing ? (
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} className="h-9 rounded-xl border-border bg-secondary/50 text-base font-bold" />
              ) : (
                <p className="font-display text-xl font-bold leading-tight">{client.name}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {client.totalAppointments} visita{client.totalAppointments === 1 ? "" : "s"} ·{" "}
                <span className="font-semibold text-primary">{formatPrice(client.totalSpentCents)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-border px-5 py-4">
          <Field label="Telefone"  icon={Phone} value={editing ? form.phone  : client.phone} editing={editing} onChange={(v) => update("phone", v)} phone />
          <Field label="E-mail"    icon={Mail}  value={editing ? form.email  : client.email ?? ""} editing={editing} onChange={(v) => update("email", v)} />

          <VipBlock
            vipType={editing
              ? (client.vipType === "auto" || client.vipType === "both"
                  ? (form.isVip ? "both" : "auto")
                  : form.isVip ? "manual" : null)
              : client.vipType}
            manualVip={form.isVip}
            editing={editing}
            onChange={(v) => update("isVip", v)}
          />
        </div>

        {!editing && (
          <div className="flex items-center gap-2 px-5 pb-3">
            <a href={`tel:${phone}`} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold text-primary transition active:scale-95">
              <Phone className="h-4 w-4" /> Ligar
            </a>
            <a href={waUrl} target="_blank" rel="noreferrer" className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-soft transition active:scale-95">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <button onClick={onToggleDetails}
              className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all", showFullDetails ? "gradient-primary border-transparent text-white shadow-glow rotate-45" : "border-border bg-secondary text-foreground")}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {showFullDetails && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="space-y-3 border-t border-border px-5 py-4">
                <Field label="Aniversário" icon={Cake} value={form.birthday} editing={editing}
                  onChange={(v) => {
                    // enforce DD/MM mask
                    const digits = v.replace(/\D/g, "").slice(0, 4);
                    const masked = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                    update("birthday", masked);
                  }}
                  placeholder="DD/MM"
                />
                {editing && (
                  <button type="button" onClick={() => setShowAddress((s) => { const next = !s; if (!next) update("address", ""); return next; })}
                    className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition", showAddress ? "gradient-primary border-transparent text-white shadow-glow" : "border-border bg-secondary/40 text-foreground")}
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", showAddress ? "bg-white/20 text-white" : "bg-secondary text-primary")}><MapPin className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-tight">Cadastrar endereço</p>
                      <p className={cn("text-[11px] font-medium", showAddress ? "text-white/80" : "text-muted-foreground")}>{showAddress ? "Habilitado" : "Clique para habilitar"}</p>
                    </div>
                    <div className={cn("flex h-5 w-5 items-center justify-center rounded border transition", showAddress ? "border-white/60 bg-white/20" : "border-border bg-card")}>
                      {showAddress && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                )}
                {(showAddress || !editing) && (
                  <Field label="Endereço"     icon={MapPin}     value={form.address}        editing={editing} onChange={(v) => update("address", v)} />
                )}
                <Field label="Observações" icon={StickyNote} value={editing ? form.notes : client.notes ?? ""} editing={editing} onChange={(v) => update("notes", v)} multiline placeholder="Ex: alergia a determinado produto..." />
                <Field
                  label="Anotações internas"
                  icon={Lock}
                  value={editing ? form.internalNotes : client.internalNotes ?? ""}
                  editing={editing}
                  onChange={(v) => update("internalNotes", v)}
                  multiline
                  placeholder="Ex: não gosta de café, prefere atendimento mais rápido..."
                  subtitle={
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                      <EyeOff className="h-2.5 w-2.5" /> Privado
                    </span>
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
                {editing ? (
                  <>
                    <Button variant="ghost" onClick={onCancelEdit} className="h-10 rounded-xl px-4 text-sm font-semibold">Cancelar</Button>
                    <Button onClick={handleSave} disabled={updateCliente.isPending} className="h-10 rounded-xl gradient-primary px-4 text-sm font-bold shadow-glow">
                      {updateCliente.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-4 w-4" /> Salvar</>}
                    </Button>
                  </>
                ) : (
                  <Button onClick={onEdit} className="h-10 rounded-xl gradient-primary px-4 text-sm font-bold shadow-glow">
                    <Pencil className="mr-1 h-4 w-4" /> Editar
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Field ─────────────────────────────────────────────────────

function Field({
  label, icon: Icon, value, editing, onChange, multiline, phone, placeholder, subtitle,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  multiline?: boolean;
  phone?: boolean;
  placeholder?: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          {subtitle && <span>{subtitle}</span>}
        </div>
        {editing ? (
          phone ? (
            <PhoneInputBR value={value} onChange={onChange} className="mt-1 h-9 text-sm [&>span]:text-xs [&>span]:px-2" />
          ) : multiline ? (
            <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder}
              className="mt-1 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 h-9 rounded-xl border-border bg-secondary/50 text-sm" />
          )
        ) : (
          <p className="mt-0.5 break-words text-sm font-semibold text-foreground">{value || <span className="text-muted-foreground">—</span>}</p>
        )}
      </div>
    </div>
  );
}

// ── Create Client Modal ───────────────────────────────────────

function CreateClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const createCliente = useCreateCliente();
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", internalNotes: "", birthday: "", address: "", isVip: false });
  const [showAddress, setShowAddress] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toIso(ddmm: string): string | null {
    const clean = ddmm.replace(/\D/g, "");
    if (clean.length !== 4) return null;
    return `2000-${clean.slice(2, 4)}-${clean.slice(0, 2)}`;
  }

  async function submit() {
    if (!form.name.trim())  return toast.error("Informe o nome");
    if (!form.phone.trim()) return toast.error("Informe o WhatsApp");
    try {
      await createCliente.mutateAsync({
        name:          form.name.trim(),
        phone:         form.phone.trim(),
        email:         form.email.trim() || null,
        notes:         form.notes.trim() || null,
        internalNotes: form.internalNotes.trim() || null,
        birthDate:     toIso(form.birthday),
        isVip:         form.isVip,
      });
      toast.success("Cliente cadastrada ✨");
      onCreated();
    } catch {
      toast.error("Erro ao cadastrar. Tente novamente.");
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl border border-border bg-card shadow-card sm:rounded-3xl max-h-[92vh] overflow-y-auto"
      >
        <div className="relative px-5 pb-3 pt-5">
          <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:bg-secondary/80">
            <X className="h-4 w-4" />
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nova cliente</p>
          <h2 className="font-display text-xl font-bold leading-tight">Cadastrar cliente</h2>
        </div>

        <div className="space-y-3 px-5 pb-3">
          <FormField label="Nome *"        value={form.name}     onChange={(v) => update("name", v)}     placeholder="Nome da cliente" />
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">WhatsApp *</p>
            <PhoneInputBR value={form.phone} onChange={(v) => update("phone", v)} />
          </div>
          <FormField label="E-mail"        value={form.email}    onChange={(v) => update("email", v)}    placeholder="email@exemplo.com" />
          <FormField
            label="Aniversário"
            value={form.birthday}
            placeholder="DD/MM"
            onChange={(v) => {
              const digits = v.replace(/\D/g, "").slice(0, 4);
              const masked = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
              update("birthday", masked);
            }}
          />

          <button type="button" onClick={() => { setShowAddress((s) => { const next = !s; if (!next) update("address", ""); return next; }); }}
            className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition", showAddress ? "gradient-primary border-transparent text-white shadow-glow" : "border-border bg-secondary/40 text-foreground")}
          >
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", showAddress ? "bg-white/20 text-white" : "bg-secondary text-primary")}><MapPin className="h-4 w-4" /></div>
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight">Cadastrar endereço</p>
              <p className={cn("text-[11px] font-medium", showAddress ? "text-white/80" : "text-muted-foreground")}>{showAddress ? "Habilitado" : "Clique para habilitar"}</p>
            </div>
            <div className={cn("flex h-5 w-5 items-center justify-center rounded border transition", showAddress ? "border-white/60 bg-white/20" : "border-border bg-card")}>
              {showAddress && <Check className="h-3.5 w-3.5" />}
            </div>
          </button>

          {showAddress && <FormField label="Endereço" value={form.address} onChange={(v) => update("address", v)} placeholder="Cidade, UF" />}

          <FormField label="Observações" value={form.notes} onChange={(v) => update("notes", v)} multiline placeholder="Ex: alergia a determinado produto..." />
          <FormField
            label="Anotações internas"
            value={form.internalNotes}
            onChange={(v) => update("internalNotes", v)}
            multiline
            placeholder="Ex: não gosta de café, prefere atendimento mais rápido..."
            subtitle={
              <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                <EyeOff className="h-2.5 w-2.5" /> Privado
              </span>
            }
          />

          <VipBlock
            vipType={form.isVip ? "manual" : null}
            manualVip={form.isVip}
            editing={true}
            onChange={(v) => update("isVip", v)}
          />
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-3">
          <Button variant="ghost" onClick={onClose} className="h-10 rounded-xl px-4 text-sm font-semibold">Cancelar</Button>
          <Button onClick={submit} disabled={createCliente.isPending} className="h-10 rounded-xl gradient-primary px-4 text-sm font-bold shadow-glow disabled:opacity-50">
            {createCliente.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-4 w-4" /> Cadastrar</>}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Form Field ────────────────────────────────────────────────

function FormField({
  label, value, onChange, placeholder, multiline, subtitle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  subtitle?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="h-10 rounded-xl border-border bg-secondary/50 text-sm"
        />
      )}
    </div>
  );
}
