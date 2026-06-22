import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Phone,
  MessageCircle,
  Cake,
  Calendar,
  Crown,
  X,
  Pencil,
  Mail,
  MapPin,
  StickyNote,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Heart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import {
  clients as seedClients,
  appointments,
  services,
  type Client,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import mulheresIcon from "@/assets/mulheres-icon.svg.asset.json";

function WomanIcon({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <img
      src={mulheresIcon.url}
      alt=""
      aria-hidden="true"
      className={cn("object-contain", className)}
    />
  );
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

type ClientExtras = {
  email?: string;
  birthday?: string;
  address?: string;
  notes?: string;
  vip?: boolean;
};


type EnrichedClient = Client & {
  visits: number;
  spent: number;
  vip: boolean;
  last: string | null;
  birthdayThisMonth: boolean;
  hasApptThisMonth: boolean;
} & ClientExtras;


function ClientesPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("todas");
  const [list, setList] = useState<(Client & ClientExtras)[]>(() =>
    seedClients.map((c, i) => ({
      ...c,
      email: `${c.name.split(" ")[0].toLowerCase()}@email.com`,
      birthday: ["12/03", "07/06", "22/09", "14/11", "01/02"][i % 5],
      address: "São Paulo, SP",
      notes: i === 0 ? "Cliente alérgica a fragrâncias fortes." : "",
    })),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [editing, setEditing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<Partial<Client & ClientExtras> | null>(null);


  const [page, setPage] = useState(1);
  const pageSize = 8;

  const currentMonth = new Date().getMonth() + 1; // 1-12

  const enriched: EnrichedClient[] = useMemo(() => {
    return list.map((c, idx) => {
      const apps = appointments.filter((a) => a.clientId === c.id);
      const total = apps.reduce((sum, a) => {
        const s = services.find((sv) => sv.id === a.serviceId);
        return sum + (s?.price ?? 0);
      }, 0);
      const bMonth = c.birthday ? parseInt(c.birthday.split("/")[1] ?? "0", 10) : 0;
      return {
        ...c,
        visits: apps.length,
        spent: total,
        vip: c.vip ?? total >= 150,
        last: apps[0]?.start ?? null,
        birthdayThisMonth: bMonth === currentMonth,
        // mock: assume even-index clients with appointments have one this month
        hasApptThisMonth: apps.length > 0 && idx % 2 === 0,
      };
    });
  }, [list, currentMonth]);


  const filtered = enriched.filter((c) => {
    if (tab === "vip" && !c.vip) return false;
    if (tab === "novas" && c.visits > 1) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = {
    total: enriched.length,
    vip: enriched.filter((c) => c.vip).length,
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

  function saveClient(updated: Client & ClientExtras) {
    setList((l) => l.map((c) => (c.id === updated.id ? updated : c)));
    setEditing(false);
    toast.success("Cliente atualizada");
  }

  function createClient(data: Client & ClientExtras) {
    setList((l) => [...l, data]);
    setCreateOpen(false);
    setCreatePrefill(null);
    toast.success("Cliente cadastrada");
  }

  function openCreateManual() {
    setCreatePrefill(null);
    setCreateOpen(true);
  }

  function openCreateFromSite() {
    // Simulação: dados que viriam do agendamento online
    setCreatePrefill({
      name: "Beatriz Almeida",
      phone: "+55 11 98765-4321",
      email: "beatriz.almeida@email.com",
    });
    setCreateOpen(true);
  }

  return (
    <MobileShell withNav>
      <header className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Sua base
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight">Clientes</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreateFromSite}
              title="Simular cliente vindo do site"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-card transition active:scale-95"
            >
              <WomanIcon className="h-10 w-10" />
            </button>
            <Button
              onClick={openCreateManual}
              className="h-11 rounded-2xl gradient-primary px-4 text-sm font-semibold shadow-glow"
            >
              <Plus className="mr-1 h-4 w-4" /> Nova
            </Button>
          </div>
        </div>


        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatCard label="Total" value={stats.total.toString()} icon={Heart} />
          <StatCard label="VIP" value={stats.vip.toString()} icon={Crown} highlight />
          <StatCard
            label="Niver. do Mês"
            value={stats.birthdays.toString()}
            icon={Cake}
          />
        </div>


        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente..."
            className="h-12 rounded-2xl border-border bg-card pl-11 text-sm shadow-card focus-visible:ring-primary"
          />
        </div>

        <div className="mt-4 inline-flex w-full rounded-2xl border border-border bg-card p-1 shadow-card">
          {(
            [
              { id: "todas", label: "Todas" },
              { id: "vip", label: "VIP" },
              { id: "novas", label: "Novas" },
            ] as const
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                  active ? "gradient-primary text-white shadow-glow" : "text-muted-foreground",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Table */}
      <main className="mt-5 flex-1 px-5 pb-6">
        {filtered.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl gradient-soft text-primary">
              <WomanIcon className="h-6 w-6" />
            </div>
            <p className="font-display text-lg font-semibold">Nenhuma cliente</p>
            <p className="text-sm text-muted-foreground">Tente outro filtro.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              {/* table header */}
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
                      style={{
                        background: `linear-gradient(135deg, ${c.color}, var(--primary))`,
                      }}
                    >
                      {c.initials}
                      {c.vip && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full gradient-primary text-white shadow-glow">
                          <Crown className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold leading-tight text-foreground truncate">
                        {c.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {c.phone}
                      </p>
                    </div>
                  </div>
                  <span className="text-right text-xs font-semibold text-muted-foreground">
                    {c.visits}
                  </span>
                  <span className="flex w-16 items-center justify-center">
                    {c.hasApptThisMonth ? (
                      <span
                        title="Tem agendamento no mês"
                        className="flex h-7 w-7 items-center justify-center rounded-full gradient-primary text-white shadow-glow"
                      >
                        <CalendarCheck className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground/60">
                        —
                      </span>
                    )}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex h-9 items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-card transition active:scale-95 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const n = idx + 1;
                    const active = n === safePage;
                    return (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={cn(
                          "h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition",
                          active
                            ? "gradient-primary text-white shadow-glow"
                            : "bg-card text-muted-foreground border border-border",
                        )}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
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

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <ClientModal
            client={selected}
            showFullDetails={showFullDetails}
            editing={editing}
            onToggleDetails={() => setShowFullDetails((v) => !v)}
            onEdit={() => setEditing(true)}
            onCancelEdit={() => setEditing(false)}
            onSave={saveClient}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createOpen && (
          <CreateClientModal
            prefill={createPrefill}
            existingIds={list.map((c) => c.id)}
            onCreate={createClient}
            onClose={() => {
              setCreateOpen(false);
              setCreatePrefill(null);
            }}
          />
        )}
      </AnimatePresence>
    </MobileShell>

  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;

  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-lg border px-3 pt-2 pb-1 shadow-card h-[88px]",
        highlight
          ? "gradient-primary border-transparent text-white shadow-glow"
          : "border-border bg-card",
      )}
    >
      {/* Background icon — large, bottom-right, partially outside */}
      <Icon
        className={cn(
          "pointer-events-none absolute -bottom-4 -right-4 h-20 w-20",
          highlight ? "text-white/25" : "text-primary/15",
        )}
        strokeWidth={1.5}
      />

      <div className="relative flex items-start justify-center pt-1">
        <p
          className={cn(
            "text-center font-display text-5xl font-extrabold leading-none",
            highlight ? "text-white" : "text-foreground",
          )}
        >
          {value}
        </p>
      </div>
      <p
        className={cn(
          "relative text-center text-[9px] font-semibold uppercase tracking-wider",
          highlight ? "text-white/90" : "text-zinc-500",
        )}
      >
        {label}
      </p>
    </div>
  );
}


/* ---------------- Modal ---------------- */

function ClientModal({
  client,
  showFullDetails,
  editing,
  onToggleDetails,
  onEdit,
  onCancelEdit,
  onSave,
  onClose,
}: {
  client: EnrichedClient;
  showFullDetails: boolean;
  editing: boolean;
  onToggleDetails: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (c: Client & ClientExtras) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Client & ClientExtras>({
    id: client.id,
    name: client.name,
    phone: client.phone,
    initials: client.initials,
    color: client.color,
    email: client.email,
    birthday: client.birthday,
    address: client.address,
    notes: client.notes,
    vip: client.vip,
  });
  const [showAddress, setShowAddress] = useState(!!client.address);


  function update<K extends keyof (Client & ClientExtras)>(
    k: K,
    v: (Client & ClientExtras)[K],
  ) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const waNumber = client.phone.replace(/\D/g, "");
  const waUrl = `https://wa.me/${waNumber}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl border border-border bg-card shadow-card sm:rounded-3xl"
      >
        {/* Header */}
        <div className="relative px-5 pb-4 pt-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:bg-secondary/80"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-4">
            <div
              className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-soft"
              style={{ background: `linear-gradient(135deg, ${client.color}, var(--primary))` }}
            >
              {client.initials}
              {client.vip && (
                <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full gradient-primary text-white shadow-glow">
                  <Crown className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 pr-8">
              {editing ? (
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="h-9 rounded-xl border-border bg-secondary/50 text-base font-bold"
                />
              ) : (
                <p className="font-display text-xl font-bold leading-tight">
                  {client.name}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {client.visits} visita{client.visits === 1 ? "" : "s"} ·{" "}
                <span className="font-semibold text-primary">
                  R$ {client.spent.toFixed(0)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="space-y-3 border-t border-border px-5 py-4">
          <Field
            label="Telefone"
            icon={Phone}
            value={form.phone}
            editing={editing}
            onChange={(v) => update("phone", v)}
          />
          <Field
            label="E-mail"
            icon={Mail}
            value={form.email ?? ""}
            editing={editing}
            onChange={(v) => update("email", v)}
          />
        </div>

        {/* Actions row */}
        {!editing && (
          <div className="flex items-center gap-2 px-5 pb-3">
            <a
              href={`tel:${waNumber}`}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold text-primary transition active:scale-95"
            >
              <Phone className="h-4 w-4" /> Ligar
            </a>
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-soft transition active:scale-95"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <button
              onClick={onToggleDetails}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all",
                showFullDetails
                  ? "gradient-primary border-transparent text-white shadow-glow rotate-45"
                  : "border-border bg-secondary text-foreground",
              )}
              aria-label="Mais detalhes"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Expanded details */}
        <AnimatePresence initial={false}>
          {showFullDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t border-border px-5 py-4">
                <Field
                  label="Aniversário"
                  icon={Calendar}
                  value={form.birthday ?? ""}
                  editing={editing}
                  onChange={(v) => update("birthday", v)}
                />
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddress((s) => {
                        const next = !s;
                        if (!next) update("address", "");
                        return next;
                      });
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      showAddress
                        ? "gradient-primary border-transparent text-white shadow-glow"
                        : "border-border bg-secondary/40 text-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        showAddress ? "bg-white/20 text-white" : "bg-secondary text-primary",
                      )}
                    >
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-tight">Cadastrar endereço</p>
                      <p
                        className={cn(
                          "text-[11px] font-medium",
                          showAddress ? "text-white/80" : "text-muted-foreground",
                        )}
                      >
                        {showAddress ? "Endereço habilitado" : "Clique para habilitar"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border transition",
                        showAddress
                          ? "border-white/60 bg-white/20"
                          : "border-border bg-card",
                      )}
                    >
                      {showAddress && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                )}
                {(showAddress || !editing) && (
                  <Field
                    label="Endereço"
                    icon={MapPin}
                    value={form.address ?? ""}
                    editing={editing}
                    onChange={(v) => update("address", v)}
                  />
                )}
                <Field
                  label="Observações"
                  icon={StickyNote}
                  value={form.notes ?? ""}
                  editing={editing}
                  onChange={(v) => update("notes", v)}
                  multiline
                />
                {editing && (
                  <VipToggle
                    value={!!form.vip}
                    onChange={(v) => update("vip", v)}
                  />
                )}
              </div>


              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
                {editing ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={onCancelEdit}
                      className="h-10 rounded-xl px-4 text-sm font-semibold"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => onSave(form)}
                      className="h-10 rounded-xl gradient-primary px-4 text-sm font-bold shadow-glow"
                    >
                      <Check className="mr-1 h-4 w-4" /> Salvar
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={onEdit}
                    className="h-10 rounded-xl gradient-primary px-4 text-sm font-bold shadow-glow"
                  >
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

function Field({
  label,
  icon: Icon,
  value,
  editing,
  onChange,
  multiline,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {editing ? (
          multiline ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1 h-9 rounded-xl border-border bg-secondary/50 text-sm"
            />
          )
        ) : (
          <p className="mt-0.5 break-words text-sm font-semibold text-foreground">
            {value || <span className="text-muted-foreground">—</span>}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- VIP toggle ---------------- */

function VipToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition",
        value
          ? "gradient-primary border-transparent text-white shadow-glow"
          : "border-border bg-secondary/40 text-foreground",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            value ? "bg-white/20 text-white" : "bg-secondary text-primary",
          )}
        >
          <Crown className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">Cliente VIP</p>
          <p
            className={cn(
              "text-[11px] font-medium",
              value ? "text-white/80" : "text-muted-foreground",
            )}
          >
            {value ? "Marcada como VIP" : "Marcar como VIP"}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex h-6 w-11 items-center rounded-full p-0.5 transition",
          value ? "bg-white/30" : "bg-border",
        )}
      >
        <div
          className={cn(
            "h-5 w-5 rounded-full bg-white shadow-soft transition-transform",
            value ? "translate-x-5" : "translate-x-0",
          )}
        />
      </div>
    </button>
  );
}

/* ---------------- Create Client Modal ---------------- */

const PALETTE = ["#f472b6", "#ec4899", "#d946ef", "#a855f7", "#f9a8d4", "#c084fc"];

function CreateClientModal({
  prefill,
  existingIds,
  onCreate,
  onClose,
}: {
  prefill: Partial<Client & ClientExtras> | null;
  existingIds: string[];
  onCreate: (c: Client & ClientExtras) => void;
  onClose: () => void;
}) {
  const fromSite = !!prefill;
  const [form, setForm] = useState<Client & ClientExtras>({
    id: "",
    name: prefill?.name ?? "",
    phone: prefill?.phone ?? "",
    initials: "",
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    email: prefill?.email ?? "",
    birthday: prefill?.birthday ?? "",
    address: prefill?.address ?? "",
    notes: prefill?.notes ?? "",
    vip: prefill?.vip ?? false,
  });
  const [showAddress, setShowAddress] = useState(!!prefill?.address);

  function update<K extends keyof (Client & ClientExtras)>(
    k: K,
    v: (Client & ClientExtras)[K],
  ) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function makeInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function submit() {
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name) return toast.error("Informe o nome");
    if (!phone) return toast.error("Informe o WhatsApp");

    let id = "c" + (existingIds.length + 1);
    while (existingIds.includes(id)) id = id + "_" + Math.random().toString(36).slice(2, 5);

    onCreate({
      ...form,
      id,
      name,
      phone,
      initials: makeInitials(name),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl border border-border bg-card shadow-card sm:rounded-3xl max-h-[92vh] overflow-y-auto"
      >
        <div className="relative px-5 pb-3 pt-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:bg-secondary/80"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {fromSite ? "Finalizar cadastro" : "Nova cliente"}
          </p>
          <h2 className="font-display text-xl font-bold leading-tight">
            {fromSite ? "Cliente do site" : "Cadastrar cliente"}
          </h2>
          {fromSite && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] font-medium text-primary">
              <WomanIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Nome, WhatsApp e e-mail vieram do agendamento online. Complete os
                dados restantes.
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3 px-5 pb-3">
          <FormField
            label="Nome *"
            value={form.name}
            onChange={(v) => update("name", v)}
            readOnly={fromSite}
          />
          <FormField
            label="WhatsApp *"
            value={form.phone}
            onChange={(v) => update("phone", v)}
            readOnly={fromSite}
            placeholder="+55 11 99999-0000"
          />
          <FormField
            label="E-mail"
            value={form.email ?? ""}
            onChange={(v) => update("email", v)}
            readOnly={fromSite && !!prefill?.email}
            placeholder="email@exemplo.com"
          />
          <FormField
            label="Aniversário"
            value={form.birthday ?? ""}
            onChange={(v) => update("birthday", v)}
            placeholder="DD/MM"
          />
          <button
            type="button"
            onClick={() => {
              setShowAddress((s) => {
                const next = !s;
                if (!next) update("address", "");
                return next;
              });
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
              showAddress
                ? "gradient-primary border-transparent text-white shadow-glow"
                : "border-border bg-secondary/40 text-foreground",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                showAddress ? "bg-white/20 text-white" : "bg-secondary text-primary",
              )}
            >
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight">Cadastrar endereço</p>
              <p
                className={cn(
                  "text-[11px] font-medium",
                  showAddress ? "text-white/80" : "text-muted-foreground",
                )}
              >
                {showAddress ? "Endereço habilitado" : "Clique para habilitar"}
              </p>
            </div>
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded border transition",
                showAddress
                  ? "border-white/60 bg-white/20"
                  : "border-border bg-card",
              )}
            >
              {showAddress && <Check className="h-3.5 w-3.5" />}
            </div>
          </button>
          {showAddress && (
            <FormField
              label="Endereço"
              value={form.address ?? ""}
              onChange={(v) => update("address", v)}
              placeholder="Cidade, UF"
            />
          )}
          <FormField
            label="Observações"
            value={form.notes ?? ""}
            onChange={(v) => update("notes", v)}
            multiline
          />

          <VipToggle value={!!form.vip} onChange={(v) => update("vip", v)} />
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm font-semibold"
          >
            Cancelar
          </Button>
          <Button
            onClick={submit}
            className="h-10 rounded-xl gradient-primary px-4 text-sm font-bold shadow-glow"
          >
            <Check className="mr-1 h-4 w-4" /> Cadastrar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          readOnly={readOnly}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary",
            readOnly && "opacity-70",
          )}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className={cn(
            "h-10 rounded-xl border-border bg-secondary/50 text-sm",
            readOnly && "opacity-70",
          )}
        />
      )}
    </div>
  );
}

