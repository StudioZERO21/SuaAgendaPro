import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { format, parse } from "date-fns";
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Power,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Download,
  ChevronLeft,
  ChevronRight,
  History,
  User as UserIcon,
  CreditCard,
  Clock,
  AlertTriangle,
  CalendarIcon,
  Star,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getSuperAdminUsers,
  adminUnblockUser,
  adminSuspendUser,
  adminGrantSpecial,
  adminCancelSubscription,
  adminChangePlan,
  type SuperUser,
} from "@/lib/super-admin.functions";
import { getAppRatings, type AppRatingRow } from "@/lib/app-rating.functions";
import { withSuperToken } from "@/lib/super-client";

export const Route = createFileRoute("/super/_app/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Super Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UsuariosPage,
});

type Status = "active" | "trial" | "suspended" | "cancelled" | "especial" | "overdue";

type Pro = {
  id: string;
  name: string;
  email: string;
  phone: string;
  niche: string;
  city: string;
  status: Status;
  joined: string;
  plan: string;
  planId: string;
  notes: string | null;
};

type AuditEntry = {
  id: string;
  proId: string;
  proName: string;
  action: "desativacao" | "reativacao" | "especial" | "cancelamento";
  reason: string;
  actor: string;
  at: string;
};

function superUserToPro(u: SuperUser): Pro {
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
  return {
    id:     u.id,
    name:   u.name  || u.email.split("@")[0] || "—",
    email:  u.email,
    phone:  u.phone || "—",
    niche:  u.specialty || "—",
    city:   "—",
    status: u.status as Status,
    joined: fmt(u.createdAt),
    plan:   u.planName,
    planId: u.planId,
    notes:  u.notes,
  };
}

const statusStyle: Record<Status, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  trial:     "bg-amber-100  text-amber-700",
  suspended: "bg-rose-100   text-rose-700",
  overdue:   "bg-orange-100 text-orange-700",
  cancelled: "bg-zinc-100   text-zinc-500",
  especial:  "bg-violet-100 text-violet-700",
};

const statusLabel: Record<Status, string> = {
  active:    "Ativo",
  trial:     "Trial",
  suspended: "Suspenso",
  overdue:   "Inadimplente",
  cancelled: "Cancelado",
  especial:  "Especial",
};

const PAGE_SIZE = 8;
const AUDIT_PAGE_SIZE = 5;

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function nowStamp() {
  const d = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function UsuariosPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "todos">("todos");
  const [sorting, setSorting] = useState<SortingState>([{ id: "joined", desc: true }]);
  const [users, setUsers] = useState<Pro[]>([]);
  const [appRatings, setAppRatings] = useState<AppRatingRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [viewing, setViewing] = useState<Pro | null>(null);
  const [confirming, setConfirming] = useState<{ user: Pro; action: string } | null>(null);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1); // kept for audit pagination only
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditQ, setAuditQ] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditFrom, setAuditFrom] = useState<Date | undefined>();
  const [auditTo, setAuditTo] = useState<Date | undefined>();

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const [data, ratings] = await Promise.all([
        getSuperAdminUsers({ data: withSuperToken() }),
        getAppRatings({ data: withSuperToken() }),
      ]);
      setUsers(data.map(superUserToPro));
      setAppRatings(ratings);
    } catch (err: any) {
      toast.error("Erro ao carregar usuários: " + (err?.message ?? ""));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function executeAction(user: Pro, action: string, notes: string) {
    setActionLoading(true);
    try {
      if (action === "desativar")    await adminSuspendUser({ data: withSuperToken({ userId: user.id, notes, userEmail: user.email }) });
      if (action === "reativar")     await adminUnblockUser({ data: withSuperToken({ userId: user.id, notes, userEmail: user.email }) });
      if (action === "especial")     await adminGrantSpecial({ data: withSuperToken({ userId: user.id, notes, userEmail: user.email }) });
      if (action === "cancelar")     await adminCancelSubscription({ data: withSuperToken({ userId: user.id, userEmail: user.email }) });
      if (action === "premium")      await adminChangePlan({ data: withSuperToken({ userId: user.id, planId: "premium", notes, userEmail: user.email }) });
      toast.success("Ação executada com sucesso");
      const auditAction = action === "desativar" ? "desativacao" :
                          action === "reativar"  ? "reativacao"  :
                          action === "especial"  ? "especial"    : "cancelamento";
      setAudit((prev) => [
        { id: crypto.randomUUID(), proId: user.id, proName: user.name,
          action: auditAction as AuditEntry["action"],
          reason: notes || "(sem motivo)", actor: "admin", at: nowStamp() },
        ...prev,
      ]);
      await loadUsers();
    } catch (err: any) {
      toast.error("Erro: " + (err?.message ?? "Tente novamente"));
    } finally {
      setActionLoading(false);
      setConfirming(null);
      setReason("");
    }
  }

  const ratingMap = useMemo(
    () => new Map(appRatings.map((r) => [r.userId, r])),
    [appRatings],
  );

  const filtered = useMemo(() =>
    users.filter((u) => {
      const matchQ =
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase());
      const matchS = statusFilter === "todos" || u.status === statusFilter;
      return matchQ && matchS;
    }),
    [users, q, statusFilter],
  );

  // ── TanStack Table ────────────────────────────────────────────
  const columns = useMemo<ColumnDef<Pro>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Nome",
        enableSorting: true,
      },
      {
        id: "email",
        accessorKey: "email",
        header: "E-mail",
        enableSorting: true,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        enableSorting: true,
      },
      {
        id: "rating",
        header: "Avaliação",
        enableSorting: true,
        accessorFn: (row) => ratingMap.get(row.id)?.rating ?? -1,
      },
      {
        id: "joined",
        accessorKey: "joined",
        header: "Desde",
        enableSorting: true,
      },
    ],
    [ratingMap],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const totalPages = Math.max(1, table.getPageCount());

  useEffect(() => {
    setAuditQ("");
    setAuditPage(1);
    setAuditFrom(undefined);
    setAuditTo(undefined);
  }, [viewing?.id]);

  function handleConfirmAction() {
    if (!confirming) return;
    if (confirming.action === "desativar" && reason.trim().length < 5) {
      toast.error("Informe um motivo (mín. 5 caracteres).");
      return;
    }
    executeAction(confirming.user, confirming.action, reason.trim());
  }

  function exportCSV() {
    const headers = ["Nome", "E-mail", "Telefone", "Nicho", "Status", "Plano", "Desde"];
    const rows = filtered.map((u) => [
      u.name, u.email, u.phone, u.niche, u.status, u.plan, u.joined,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profissionais-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} registros exportados.`);
  }

  const auditForViewing = viewing
    ? audit.filter((a) => a.proId === viewing.id)
    : [];

  const filteredAudit = useMemo(() => {
    const term = auditQ.trim().toLowerCase();
    return auditForViewing.filter((a) => {
      const entryDate = parse(a.at, "dd/MM/yyyy HH:mm", new Date());
      const parsedOk = !isNaN(entryDate.getTime());
      if (auditFrom && (!parsedOk || entryDate < startOfDay(auditFrom))) {
        return false;
      }
      if (auditTo && (!parsedOk || entryDate > endOfDay(auditTo))) {
        return false;
      }
      if (!term) return true;
      return (
        a.reason.toLowerCase().includes(term) ||
        a.actor.toLowerCase().includes(term) ||
        a.at.toLowerCase().includes(term) ||
        (a.action === "desativacao" ? "desativado" : "reativado").includes(
          term,
        )
      );
    });
  }, [auditForViewing, auditQ, auditFrom, auditTo]);

  const auditTotalPages = Math.max(
    1,
    Math.ceil(filteredAudit.length / AUDIT_PAGE_SIZE),
  );
  const safeAuditPage = Math.min(auditPage, auditTotalPages);
  const paginatedAudit = filteredAudit.slice(
    (safeAuditPage - 1) * AUDIT_PAGE_SIZE,
    safeAuditPage * AUDIT_PAGE_SIZE,
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Plataforma
          </p>
          <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">
            Profissionais cadastrados
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize, busque, exporte e gerencie todas as contas profissionais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAuditOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Auditoria
            {audit.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {audit.length}
              </span>
            )}
          </Button>
          <Button onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                table.setPageIndex(0);
              }}
              placeholder="Buscar por nome ou e-mail…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["todos", "active", "trial", "suspended", "cancelled", "especial"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s as any);
                  table.setPageIndex(0);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {s === "todos" ? "Todos" : statusLabel[s as Status]}
              </button>
            ))}
          </div>
          <p className="ml-auto hidden text-xs text-muted-foreground sm:block">
            {filtered.length} de {users.length}
          </p>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-4 py-3 text-left font-semibold select-none",
                        header.column.getCanSort() && "cursor-pointer hover:text-foreground transition-colors",
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          header.column.getIsSorted() === "asc"  ? <ArrowUp className="h-3 w-3" /> :
                          header.column.getIsSorted() === "desc" ? <ArrowDown className="h-3 w-3" /> :
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                const u = row.original;
                const r = ratingMap.get(u.id);
                return (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", statusStyle[u.status])}>
                        {u.status === "active"    && <CheckCircle2 className="h-3 w-3" />}
                        {u.status === "suspended" && <XCircle className="h-3 w-3" />}
                        {statusLabel[u.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r ? (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "text-amber-400" : "text-muted-foreground/20"}`} fill={i < r.rating ? "currentColor" : "none"} />
                          ))}
                          <span className="ml-1 text-xs font-semibold text-muted-foreground">{r.rating}/5</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.joined}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setViewing(u)}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver mais
                        </Button>
                        {(u.status === "suspended" || u.status === "cancelled" || u.status === "overdue") && (
                          <Button size="sm" variant="default" onClick={() => setConfirming({ user: u, action: "reativar" })}>
                            <Power className="mr-1.5 h-3.5 w-3.5" /> Reativar
                          </Button>
                        )}
                        {(u.status === "active" || u.status === "trial") && (
                          <Button size="sm" variant="destructive" onClick={() => setConfirming({ user: u, action: "desativar" })}>
                            <Power className="mr-1.5 h-3.5 w-3.5" /> Suspender
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loadingUsers && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Carregando usuários…
          </p>
        )}
        {!loadingUsers && filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum profissional encontrado.
          </p>
        )}

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
            <p className="text-xs text-muted-foreground">
              Mostrando{" "}
              <span className="font-semibold text-foreground">
                {table.getState().pagination.pageIndex * PAGE_SIZE + 1}–
                {Math.min((table.getState().pagination.pageIndex + 1) * PAGE_SIZE, filtered.length)}
              </span>{" "}
              de <span className="font-semibold text-foreground">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => table.setPageIndex(i)}
                  className={cn(
                    "h-8 min-w-8 rounded-md px-2 text-xs font-semibold",
                    table.getState().pagination.pageIndex === i
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detalhes — melhorado com tabs */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-lg font-bold text-primary-foreground">
                    {viewing.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="truncate">{viewing.name}</DialogTitle>
                    <DialogDescription className="truncate">
                      {viewing.email} • {viewing.niche}
                    </DialogDescription>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          statusStyle[viewing.status],
                        )}
                      >
                        {statusLabel[viewing.status]}
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                        {viewing.plan}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-2">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="metricas">Métricas</TabsTrigger>
                  <TabsTrigger value="auditoria">
                    Auditoria
                    {auditForViewing.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
                        {auditForViewing.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="avaliacao" className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    Avaliação
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-3 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Row icon={Mail} label="E-mail" value={viewing.email} />
                    <Row icon={Phone} label="Telefone" value={viewing.phone} />
                    <Row icon={Briefcase} label="Nicho" value={viewing.niche} />
                    <Row icon={Calendar} label="Cadastrado em" value={viewing.joined} />
                    <Row icon={CreditCard} label="Plano" value={viewing.plan} />
                    {viewing.notes && <Row icon={Clock} label="Notas admin" value={viewing.notes} />}
                  </div>
                </TabsContent>

                <TabsContent value="metricas" className="space-y-3 pt-4">
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Métricas de agendamentos serão exibidas em breve.
                  </div>
                </TabsContent>

                <TabsContent value="auditoria" className="pt-4">
                  {auditForViewing.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Nenhuma ação registrada para este profissional.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={auditQ}
                            onChange={(e) => {
                              setAuditQ(e.target.value);
                              setAuditPage(1);
                            }}
                            placeholder="Buscar por motivo, responsável ou data…"
                            className="pl-9"
                          />
                        </div>
                        <AuditDatePicker
                          value={auditFrom}
                          onChange={(d) => {
                            setAuditFrom(d);
                            setAuditPage(1);
                          }}
                          placeholder="De"
                        />
                        <AuditDatePicker
                          value={auditTo}
                          onChange={(d) => {
                            setAuditTo(d);
                            setAuditPage(1);
                          }}
                          placeholder="Até"
                        />
                      </div>
                      {(auditQ || auditFrom || auditTo) && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {filteredAudit.length} evento
                            {filteredAudit.length !== 1 ? "s" : ""} encontrado
                            {filteredAudit.length !== 1 ? "s" : ""}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAuditQ("");
                              setAuditFrom(undefined);
                              setAuditTo(undefined);
                              setAuditPage(1);
                            }}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Limpar filtros
                          </button>
                        </div>
                      )}
                      {filteredAudit.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          Nenhum evento encontrado para "{auditQ}".
                        </p>
                      ) : (
                        <>
                          <ul className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                            {paginatedAudit.map((a) => (
                              <AuditItem key={a.id} entry={a} compact />
                            ))}
                          </ul>
                          {filteredAudit.length > AUDIT_PAGE_SIZE && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                              <p className="text-xs text-muted-foreground">
                                Mostrando{" "}
                                <span className="font-semibold text-foreground">
                                  {(safeAuditPage - 1) * AUDIT_PAGE_SIZE + 1}–
                                  {Math.min(
                                    safeAuditPage * AUDIT_PAGE_SIZE,
                                    filteredAudit.length,
                                  )}
                                </span>{" "}
                                de{" "}
                                <span className="font-semibold text-foreground">
                                  {filteredAudit.length}
                                </span>
                              </p>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setAuditPage((p) => Math.max(1, p - 1))
                                  }
                                  disabled={safeAuditPage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({
                                  length: auditTotalPages,
                                }).map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setAuditPage(i + 1)}
                                    className={cn(
                                      "h-8 min-w-8 rounded-md px-2 text-xs font-semibold",
                                      safeAuditPage === i + 1
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted",
                                    )}
                                  >
                                    {i + 1}
                                  </button>
                                ))}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setAuditPage((p) =>
                                      Math.min(auditTotalPages, p + 1),
                                    )
                                  }
                                  disabled={safeAuditPage === auditTotalPages}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="avaliacao" className="pt-4">
                  {(() => {
                    const r = ratingMap.get(viewing.id);
                    if (!r) return (
                      <div className="rounded-xl border border-dashed border-border p-8 text-center">
                        <Star className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Este profissional ainda não avaliou o app.</p>
                      </div>
                    );
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-7 w-7 ${i < r.rating ? "text-amber-400" : "text-muted-foreground/20"}`} fill={i < r.rating ? "currentColor" : "none"} />
                            ))}
                          </div>
                          <span className="text-2xl font-bold">{r.rating}<span className="text-sm font-normal text-muted-foreground">/5</span></span>
                        </div>
                        {r.comment ? (
                          <div className="rounded-xl border border-border bg-muted/30 p-4">
                            <p className="text-sm leading-relaxed">{r.comment}</p>
                          </div>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">Sem comentário.</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Enviado em {new Date(r.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    );
                  })()}
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex-wrap gap-2">
                <Button variant="outline" onClick={() => setViewing(null)}>
                  Fechar
                </Button>
                {viewing.status !== "especial" && (
                  <Button
                    variant="secondary"
                    onClick={() => { setConfirming({ user: viewing, action: "especial" }); setViewing(null); }}
                  >
                    Conceder Especial
                  </Button>
                )}
                {(viewing.status === "suspended" || viewing.status === "cancelled" || viewing.status === "overdue") && (
                  <Button
                    variant="default"
                    onClick={() => { setConfirming({ user: viewing, action: "reativar" }); setViewing(null); }}
                  >
                    <Power className="mr-1.5 h-4 w-4" />
                    Reativar
                  </Button>
                )}
                {(viewing.status === "active" || viewing.status === "trial") && (
                  <Button
                    variant="destructive"
                    onClick={() => { setConfirming({ user: viewing, action: "desativar" }); setViewing(null); }}
                  >
                    <Power className="mr-1.5 h-4 w-4" />
                    Suspender
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação com motivo (auditoria) */}
      <Dialog
        open={!!confirming}
        onOpenChange={(o) => {
          if (!o) { setConfirming(null); setReason(""); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {confirming && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                      confirming.action === "desativar"
                        ? "bg-rose-100 text-rose-700"
                        : confirming.action === "especial"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-emerald-100 text-emerald-700",
                    )}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle>
                      {confirming.action === "desativar" && "Suspender profissional?"}
                      {confirming.action === "reativar"  && "Reativar profissional?"}
                      {confirming.action === "especial"  && "Conceder plano Especial?"}
                      {confirming.action === "cancelar"  && "Cancelar assinatura?"}
                      {confirming.action === "premium"   && "Mudar para Premium?"}
                    </DialogTitle>
                    <DialogDescription>
                      {confirming.action === "desativar"
                        ? `${confirming.user.name} perderá acesso à plataforma imediatamente.`
                        : confirming.action === "reativar"
                        ? `${confirming.user.name} voltará a ter acesso por 30 dias.`
                        : confirming.action === "especial"
                        ? `${confirming.user.name} receberá acesso vitalício sem cobrança.`
                        : `Ação sobre ${confirming.user.name}. A ação será auditada.`}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="reason">
                  Motivo / observação{confirming.action === "desativar" ? " *" : " (opcional)"}
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: solicitação do usuário, inadimplência confirmada…"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => { setConfirming(null); setReason(""); }}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={actionLoading}
                  variant={confirming.action === "desativar" || confirming.action === "cancelar" ? "destructive" : "default"}
                  onClick={handleConfirmAction}
                >
                  {actionLoading ? "Aguarde…" : "Confirmar"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Auditoria global */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Auditoria de status</DialogTitle>
            <DialogDescription>
              Histórico de desativações e reativações de profissionais.
            </DialogDescription>
          </DialogHeader>
          {audit.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma ação registrada ainda.
            </div>
          ) : (
            <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {audit.map((a) => (
                <AuditItem key={a.id} entry={a} />
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAuditOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-transparent p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
    </div>
  );
}

function AuditItem({ entry, compact }: { entry: AuditEntry; compact?: boolean }) {
  const isDeact = entry.action === "desativacao";
  return (
    <li className="flex gap-3 rounded-xl border border-border bg-card p-3">
      <div
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          isDeact ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
        )}
      >
        {isDeact ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          {!compact && (
            <p className="truncate text-sm font-semibold">{entry.proName}</p>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
              isDeact ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
            )}
          >
            {isDeact ? "Desativado" : "Reativado"}
          </span>
          <span className="text-[11px] text-muted-foreground">{entry.at}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Motivo:</span> {entry.reason}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <UserIcon className="h-3 w-3" /> por {entry.actor}
        </p>
      </div>
    </li>
  );
}

function AuditDatePicker({
  value,
  onChange,
  placeholder,
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarPicker
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
