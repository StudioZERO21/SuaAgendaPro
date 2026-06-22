import { Link } from "@tanstack/react-router";
import {
  Bell,
  CalendarCheck,
  CalendarX,
  CreditCard,
  Star,
  Clock,
  Sparkles,
  CheckCheck,
  ArrowRight,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useNotifications,
  formatRelative,
  type NotificationType,
} from "@/lib/notifications-store";
import { cn } from "@/lib/utils";

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

export function NotificationsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const recent = items.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[92vw] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-sm [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Notificações</DialogTitle>
        <DialogDescription className="sr-only">
          Suas notificações recentes
        </DialogDescription>

        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="font-display text-sm font-bold">Notificações</p>
              <p className="text-[11px] text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
                  : "Tudo em dia"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1.5 text-[10px] font-semibold text-foreground/80 hover:bg-secondary/80"
                aria-label="Marcar todas como lidas"
              >
                <CheckCheck className="h-3 w-3" />
                Lidas
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-3 py-3">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">Sem notificações</p>
              <p className="text-xs text-muted-foreground">
                Quando algo acontecer, aparece aqui.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recent.map((n) => {
                const Icon = ICONS[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex items-start gap-2.5 rounded-2xl border border-border/60 p-2.5 text-left transition hover:bg-secondary/60",
                      !n.read && "border-primary/20 bg-primary/5",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        COLORS[n.type],
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold">
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="line-clamp-2 text-[11px] text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        {formatRelative(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 p-3">
          <Link
            to="/notificacoes-todas"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            Ver todas as notificações
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
