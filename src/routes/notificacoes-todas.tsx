import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarCheck,
  CalendarX,
  CreditCard,
  Star,
  Clock,
  Sparkles,
  CheckCheck,
  Trash2,
  Eye,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Input } from "@/components/ui/input";
import {
  useNotifications,
  formatRelative,
  type AppNotification,
  type NotificationType,
} from "@/lib/notifications-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/notificacoes-todas")({
  head: () => ({
    meta: [
      { title: "Todas as notificações — SuaAgenda.Pro" },
      {
        name: "description",
        content: "Veja e gerencie todas as suas notificações.",
      },
    ],
  }),
  component: TodasNotificacoesPage,
});

const ICONS: Record<NotificationType, LucideIcon> = {
  agendamento: CalendarCheck,
  cancelamento: CalendarX,
  pagamento: CreditCard,
  avaliacao: Star,
  lembrete: Clock,
  sistema: Sparkles,
};

const COLORS: Record<NotificationType, string> = {
  agendamento: "bg-emerald-100 text-emerald-700",
  cancelamento: "bg-rose-100 text-rose-700",
  pagamento: "bg-sky-100 text-sky-700",
  avaliacao: "bg-amber-100 text-amber-700",
  lembrete: "bg-violet-100 text-violet-700",
  sistema: "bg-zinc-100 text-zinc-700",
};

const FILTERS: Array<{ key: "todas" | "nao-lidas"; label: string }> = [
  { key: "todas", label: "Todas" },
  { key: "nao-lidas", label: "Não lidas" },
];

function TodasNotificacoesPage() {
  const navigate = useNavigate();
  const { items, unreadCount, markRead, markAllRead, remove, clearAll } =
    useNotifications();
  const [filter, setFilter] = useState<"todas" | "nao-lidas">("todas");
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<AppNotification | null>(null);
  const [deleting, setDeleting] = useState<AppNotification | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = items.filter((n) => {
    if (filter === "nao-lidas" && n.read) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleView(n: AppNotification) {
    setViewing(n);
    if (!n.read) markRead(n.id);
  }

  function handleDelete(n: AppNotification) {
    remove(n.id);
    toast.success("Notificação excluída");
    setDeleting(null);
  }

  return (
    <MobileShell>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Inbox
          </p>
          <h1 className="truncate font-display text-lg font-bold">
            Notificações
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold"
            >
              <CheckCheck className="h-3 w-3" />
              Lidas
            </button>
          )}
          {items.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-rose-600"
              aria-label="Limpar tudo"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 space-y-4 px-5 pb-24 pt-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar notificações"
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-foreground/70",
                )}
              >
                {f.label}
                {f.key === "nao-lidas" && unreadCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <section className="space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-semibold">Nada por aqui</p>
              <p className="text-xs text-muted-foreground">
                Você está em dia com suas notificações.
              </p>
            </div>
          ) : (
            filtered.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <article
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card",
                    !n.read && "border-primary/30 bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                      COLORS[n.type],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {n.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        {formatRelative(n.createdAt)}
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleView(n)}
                          className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold hover:bg-secondary/80"
                        >
                          <Eye className="h-3 w-3" />
                          Ver
                        </button>
                        <button
                          onClick={() => setDeleting(n)}
                          className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          {viewing && (
            <>
              <DialogHeader>
                <div
                  className={cn(
                    "mb-2 flex h-12 w-12 items-center justify-center rounded-2xl",
                    COLORS[viewing.type],
                  )}
                >
                  {(() => {
                    const Icon = ICONS[viewing.type];
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <DialogTitle className="font-display text-left text-lg">
                  {viewing.title}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-foreground/80">{viewing.message}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {formatRelative(viewing.createdAt)}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete single */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir notificação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && handleDelete(deleting)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todas as notificações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você irá apagar {items.length} notificaç
              {items.length === 1 ? "ão" : "ões"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAll();
                toast.success("Notificações limpas");
                setConfirmClear(false);
              }}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Limpar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileShell>
  );
}
