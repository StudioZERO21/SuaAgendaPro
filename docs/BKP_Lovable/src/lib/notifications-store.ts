import { useEffect, useState, useCallback } from "react";

export type NotificationType =
  | "agendamento"
  | "cancelamento"
  | "pagamento"
  | "avaliacao"
  | "lembrete"
  | "sistema";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string; // ISO
  read: boolean;
};

const STORAGE_KEY = "sa.notifications.inbox";

const SEED: AppNotification[] = [
  {
    id: "n1",
    type: "agendamento",
    title: "Novo agendamento",
    message: "Marina Costa marcou Design de Sobrancelhas para amanhã às 14:00.",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
  },
  {
    id: "n2",
    type: "pagamento",
    title: "Pagamento recebido",
    message: "Você recebeu R$ 120,00 de Carla Mendes via Pix.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
  },
  {
    id: "n3",
    type: "avaliacao",
    title: "Nova avaliação ⭐ 5",
    message: "Juliana deixou uma avaliação 5 estrelas no seu atendimento.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
  },
  {
    id: "n4",
    type: "lembrete",
    title: "Lembrete enviado",
    message: "Lembrete de 2h enviado para 3 clientes via WhatsApp.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: true,
  },
  {
    id: "n5",
    type: "cancelamento",
    title: "Agendamento cancelado",
    message: "Patrícia Lopes cancelou o horário de quinta-feira às 10:00.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    read: true,
  },
  {
    id: "n6",
    type: "sistema",
    title: "Bem-vinda ao SuaAgenda.Pro",
    message: "Seu perfil está pronto. Compartilhe seu link público!",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    read: true,
  },
];

function load(): AppNotification[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return SEED;
  }
}

function persist(list: AppNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("sa:notifications-changed"));
}

export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    setItems(load());
    const handler = () => setItems(load());
    window.addEventListener("sa:notifications-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("sa:notifications-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const markRead = useCallback((id: string) => {
    const next = load().map((n) => (n.id === id ? { ...n, read: true } : n));
    persist(next);
    setItems(next);
  }, []);

  const markAllRead = useCallback(() => {
    const next = load().map((n) => ({ ...n, read: true }));
    persist(next);
    setItems(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = load().filter((n) => n.id !== id);
    persist(next);
    setItems(next);
  }, []);

  const clearAll = useCallback(() => {
    persist([]);
    setItems([]);
  }, []);

  const sorted = [...items].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const unreadCount = items.filter((n) => !n.read).length;

  return { items: sorted, unreadCount, markRead, markAllRead, remove, clearAll };
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
