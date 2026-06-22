import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  MapPin,
  Download,
  ChevronLeft,
  ChevronRight,
  History,
  User as UserIcon,
  CreditCard,
  Hash,
  Clock,
  AlertTriangle,
  CalendarIcon,
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

export const Route = createFileRoute("/super/_app/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Super Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UsuariosPage,
});

type Status = "ativo" | "inativo" | "pendente";

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
  appointments: number;
  revenue: number;
  lastLogin: string;
  document: string;
};

type AuditEntry = {
  id: string;
  proId: string;
  proName: string;
  action: "desativacao" | "reativacao";
  reason: string;
  actor: string;
  at: string;
};

const INITIAL: Pro[] = [
  { id: "u1", name: "Camila Almeida", email: "camila@studio.com", phone: "(11) 98821-4422", niche: "Cabeleireira", city: "São Paulo, SP", status: "ativo", joined: "12/03/2025", plan: "Profissional", appointments: 248, revenue: 18420, lastLogin: "20/06/2026 14:32", document: "123.456.789-01" },
  { id: "u2", name: "Bruno Reis", email: "bruno@lash.pro", phone: "(21) 99712-1190", niche: "Lash Designer", city: "Rio de Janeiro, RJ", status: "ativo", joined: "02/04/2025", plan: "Profissional", appointments: 132, revenue: 9870, lastLogin: "21/06/2026 09:11", document: "234.567.890-12" },
  { id: "u3", name: "Maria Souza", email: "maria@nails.com", phone: "(31) 98455-7821", niche: "Manicure", city: "Belo Horizonte, MG", status: "pendente", joined: "18/05/2025", plan: "Trial", appointments: 12, revenue: 480, lastLogin: "19/06/2026 18:02", document: "345.678.901-23" },
  { id: "u4", name: "Studio Glamour", email: "contato@glamour.com", phone: "(41) 99887-3321", niche: "Estética", city: "Curitiba, PR", status: "ativo", joined: "30/05/2025", plan: "Profissional", appointments: 312, revenue: 27110, lastLogin: "21/06/2026 11:45", document: "11.222.333/0001-44" },
  { id: "u5", name: "Ana Paula", email: "ana@beauty.io", phone: "(51) 99221-7765", niche: "Maquiadora", city: "Porto Alegre, RS", status: "inativo", joined: "07/06/2025", plan: "Profissional", appointments: 87, revenue: 5430, lastLogin: "02/06/2026 10:18", document: "456.789.012-34" },
  { id: "u6", name: "Diego Lima", email: "diego@barber.app", phone: "(11) 97755-8821", niche: "Barbeiro", city: "São Paulo, SP", status: "ativo", joined: "21/06/2026", plan: "Profissional", appointments: 45, revenue: 2210, lastLogin: "21/06/2026 13:02", document: "567.890.123-45" },
  { id: "u7", name: "Renata Castro", email: "renata@spa.com", phone: "(48) 98712-3344", niche: "Massoterapeuta", city: "Florianópolis, SC", status: "ativo", joined: "11/01/2026", plan: "Profissional", appointments: 178, revenue: 14210, lastLogin: "20/06/2026 17:22", document: "678.901.234-56" },
  { id: "u8", name: "Felipe Andrade", email: "felipe@tattoo.art", phone: "(61) 99332-7788", niche: "Tatuador", city: "Brasília, DF", status: "pendente", joined: "02/06/2026", plan: "Trial", appointments: 4, revenue: 320, lastLogin: "20/06/2026 22:01", document: "789.012.345-67" },
  { id: "u9", name: "Letícia Borges", email: "leticia@brows.co", phone: "(85) 98123-9911", niche: "Designer de Sobrancelhas", city: "Fortaleza, CE", status: "ativo", joined: "14/02/2026", plan: "Profissional", appointments: 96, revenue: 6720, lastLogin: "21/06/2026 08:45", document: "890.123.456-78" },
  { id: "u10", name: "Pedro Henrique", email: "pedro@barber.app", phone: "(11) 99001-2233", niche: "Barbeiro", city: "Campinas, SP", status: "ativo", joined: "20/04/2026", plan: "Profissional", appointments: 67, revenue: 3950, lastLogin: "20/06/2026 19:30", document: "901.234.567-89" },
  { id: "u11", name: "Carolina Pires", email: "carol@nails.io", phone: "(11) 98221-4321", niche: "Manicure", city: "Santo André, SP", status: "ativo", joined: "05/03/2026", plan: "Profissional", appointments: 121, revenue: 7820, lastLogin: "21/06/2026 12:00", document: "012.345.678-90" },
  { id: "u12", name: "Sandra Melo", email: "sandra@hair.pro", phone: "(31) 99887-1122", niche: "Cabeleireira", city: "Contagem, MG", status: "inativo", joined: "22/12/2025", plan: "Profissional", appointments: 54, revenue: 3010, lastLogin: "10/05/2026 14:00", document: "112.233.445-56" },
  { id: "u13", name: "Otávio Mendes", email: "otavio@barber.app", phone: "(21) 98112-2233", niche: "Barbeiro", city: "Niterói, RJ", status: "ativo", joined: "30/03/2026", plan: "Profissional", appointments: 88, revenue: 4520, lastLogin: "21/06/2026 10:11", document: "223.344.556-67" },
  { id: "u14", name: "Juliana Rocha", email: "ju@spa.io", phone: "(47) 98765-3344", niche: "Massoterapeuta", city: "Joinville, SC", status: "ativo", joined: "12/05/2026", plan: "Profissional", appointments: 39, revenue: 2980, lastLogin: "20/06/2026 16:00", document: "334.455.667-78" },
  { id: "u15", name: "Marcos Vinícius", email: "marcos@tattoo.art", phone: "(11) 98000-1212", niche: "Tatuador", city: "Guarulhos, SP", status: "pendente", joined: "10/06/2026", plan: "Trial", appointments: 2, revenue: 0, lastLogin: "19/06/2026 21:00", document: "445.566.778-89" },
];

const statusStyle: Record<Status, string> = {
  ativo: "bg-emerald-100 text-emerald-700",
  inativo: "bg-rose-100 text-rose-700",
  pendente: "bg-amber-100 text-amber-700",
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
  const [users, setUsers] = useState<Pro[]>(INITIAL);
  const [viewing, setViewing] = useState<Pro | null>(null);
  const [confirming, setConfirming] = useState<Pro | null>(null);
  const [reason, setReason] = useState("");
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditQ, setAuditQ] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditFrom, setAuditFrom] = useState<Date | undefined>();
  const [auditTo, setAuditTo] = useState<Date | undefined>();

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const matchQ =
          u.name.toLowerCase().includes(q.toLowerCase()) ||
          u.email.toLowerCase().includes(q.toLowerCase());
        const matchS = statusFilter === "todos" || u.status === statusFilter;
        return matchQ && matchS;
      }),
    [users, q, statusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    setAuditQ("");
    setAuditPage(1);
    setAuditFrom(undefined);
    setAuditTo(undefined);
  }, [viewing?.id]);

  function toggleStatus() {
    if (!confirming) return;
    if (confirming.status === "ativo" && reason.trim().length < 5) {
      toast.error("Informe um motivo (mín. 5 caracteres).");
      return;
    }
    const action: AuditEntry["action"] =
      confirming.status === "ativo" ? "desativacao" : "reativacao";
    const newStatus: Status = confirming.status === "ativo" ? "inativo" : "ativo";

    setUsers((prev) =>
      prev.map((u) =>
        u.id === confirming.id ? { ...u, status: newStatus } : u,
      ),
    );
    setAudit((prev) => [
      {
        id: `a${Date.now()}`,
        proId: confirming.id,
        proName: confirming.name,
        action,
        reason: reason.trim() || "—",
        actor: "Super Admin",
        at: nowStamp(),
      },
      ...prev,
    ]);
    toast.success(
      action === "desativacao"
        ? `${confirming.name} foi desativado.`
        : `${confirming.name} foi reativado.`,
    );
    setConfirming(null);
    setReason("");
  }

  function exportCSV() {
    const headers = ["Nome", "E-mail", "Telefone", "Nicho", "Cidade", "Status", "Plano", "Desde", "Agendamentos", "Receita"];
    const rows = filtered.map((u) => [
      u.name, u.email, u.phone, u.niche, u.city, u.status, u.plan, u.joined,
      String(u.appointments), String(u.revenue),
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
                setPage(1);
              }}
              placeholder="Buscar por nome ou e-mail…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["todos", "ativo", "pendente", "inativo"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="ml-auto hidden text-xs text-muted-foreground sm:block">
            {filtered.length} de {users.length}
          </p>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nome</th>
                <th className="px-4 py-3 text-left font-semibold">E-mail</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Desde</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                        statusStyle[u.status],
                      )}
                    >
                      {u.status === "ativo" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : u.status === "inativo" ? (
                        <XCircle className="h-3 w-3" />
                      ) : null}
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewing(u)}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Ver mais
                      </Button>
                      <Button
                        size="sm"
                        variant={u.status === "ativo" ? "destructive" : "default"}
                        onClick={() => setConfirming(u)}
                      >
                        <Power className="mr-1.5 h-3.5 w-3.5" />
                        {u.status === "ativo" ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <ul className="divide-y divide-border md:hidden">
          {paginated.map((u) => (
            <li key={u.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                    statusStyle[u.status],
                  )}
                >
                  {u.status}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Desde {u.joined}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setViewing(u)}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Ver mais
                </Button>
                <Button
                  size="sm"
                  variant={u.status === "ativo" ? "destructive" : "default"}
                  className="flex-1"
                  onClick={() => setConfirming(u)}
                >
                  <Power className="mr-1.5 h-3.5 w-3.5" />
                  {u.status === "ativo" ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum profissional encontrado.
          </p>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
            <p className="text-xs text-muted-foreground">
              Mostrando{" "}
              <span className="font-semibold text-foreground">
                {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              de <span className="font-semibold text-foreground">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={cn(
                    "h-8 min-w-8 rounded-md px-2 text-xs font-semibold",
                    safePage === i + 1
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
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
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                          statusStyle[viewing.status],
                        )}
                      >
                        {viewing.status}
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                        {viewing.plan}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-2">
                <TabsList className="grid w-full grid-cols-3">
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
                </TabsList>

                <TabsContent value="info" className="space-y-3 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Row icon={Mail} label="E-mail" value={viewing.email} />
                    <Row icon={Phone} label="Telefone" value={viewing.phone} />
                    <Row icon={Briefcase} label="Nicho" value={viewing.niche} />
                    <Row icon={MapPin} label="Cidade" value={viewing.city} />
                    <Row icon={Hash} label="Documento" value={viewing.document} />
                    <Row icon={Calendar} label="Cadastrado em" value={viewing.joined} />
                    <Row icon={Clock} label="Último acesso" value={viewing.lastLogin} />
                    <Row icon={CreditCard} label="Plano" value={viewing.plan} />
                  </div>
                </TabsContent>

                <TabsContent value="metricas" className="space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Stat label="Agendamentos" value={viewing.appointments.toLocaleString("pt-BR")} />
                    <Stat label="Receita total" value={formatBRL(viewing.revenue)} />
                    <Stat
                      label="Ticket médio"
                      value={
                        viewing.appointments > 0
                          ? formatBRL(viewing.revenue / viewing.appointments)
                          : "—"
                      }
                    />
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
              </Tabs>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setViewing(null)}>
                  Fechar
                </Button>
                <Button
                  variant={viewing.status === "ativo" ? "destructive" : "default"}
                  onClick={() => {
                    setConfirming(viewing);
                    setViewing(null);
                  }}
                >
                  <Power className="mr-1.5 h-4 w-4" />
                  {viewing.status === "ativo" ? "Desativar" : "Ativar"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação com motivo (auditoria) */}
      <Dialog
        open={!!confirming}
        onOpenChange={(o) => {
          if (!o) {
            setConfirming(null);
            setReason("");
          }
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
                      confirming.status === "ativo"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700",
                    )}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle>
                      {confirming.status === "ativo"
                        ? "Desativar profissional?"
                        : "Reativar profissional?"}
                    </DialogTitle>
                    <DialogDescription>
                      {confirming.status === "ativo"
                        ? `${confirming.name} perderá acesso à plataforma. A ação será registrada na auditoria.`
                        : `${confirming.name} voltará a ter acesso normal. A ação será registrada na auditoria.`}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {confirming.status === "ativo" && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo da desativação *</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Inadimplência, denúncia confirmada, solicitação do usuário…"
                    rows={3}
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirming(null);
                    setReason("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant={confirming.status === "ativo" ? "destructive" : "default"}
                  onClick={toggleStatus}
                >
                  {confirming.status === "ativo" ? "Confirmar desativação" : "Confirmar ativação"}
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
