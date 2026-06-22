import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "./notifications.functions";

export type { NotificationType, AppNotification } from "./notifications.functions";

const QK = ["notifications"] as const;

export function useNotifications() {
  const qc = useQueryClient();

  const getFn         = useServerFn(getNotifications);
  const markReadFn    = useServerFn(markNotificationRead);
  const markAllReadFn = useServerFn(markAllNotificationsRead);
  const deleteFn      = useServerFn(deleteNotification);
  const clearFn       = useServerFn(clearAllNotifications);

  const { data: items = [], isLoading } = useQuery({
    queryKey: QK,
    queryFn:  () => getFn(),
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => markReadFn({ data: { id } }),
    onMutate: (id) => {
      qc.setQueryData(QK, (prev: typeof items) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: () => markAllReadFn(),
    onMutate: () => {
      qc.setQueryData(QK, (prev: typeof items) =>
        prev.map((n) => ({ ...n, read: true })),
      );
    },
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onMutate: (id) => {
      qc.setQueryData(QK, (prev: typeof items) => prev.filter((n) => n.id !== id));
    },
  });

  const clearMut = useMutation({
    mutationFn: () => clearFn(),
    onMutate: () => {
      qc.setQueryData(QK, [] as typeof items);
    },
  });

  const sorted = [...items].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const unreadCount = items.filter((n) => !n.read).length;

  return {
    items: sorted,
    unreadCount,
    isLoading,
    markRead:    (id: string) => markReadMut.mutate(id),
    markAllRead: ()           => markAllReadMut.mutate(),
    remove:      (id: string) => removeMut.mutate(id),
    clearAll:    ()           => clearMut.mutate(),
  };
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
