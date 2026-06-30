// Web Push (PWA) no cliente: assinar / cancelar. A inscrição é salva direto no
// Supabase (RLS push_subscriptions_own). Requer VITE_VAPID_PUBLIC_KEY.
import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported(): boolean {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

export function pushPermission(): NotificationPermission | "unsupported" {
  return pushSupported() ? Notification.permission : "unsupported";
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    return !!(await reg.pushManager.getSubscription());
  } catch { return false; }
}

export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapid) return { ok: false, reason: "no_vapid" };

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "denied" };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    });
  }
  const json: any = sub.toJSON();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !json.endpoint || !json.keys) return { ok: false, reason: "no_session" };

  await supabase.from("push_subscriptions").delete().eq("endpoint", json.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    user_id:  session.user.id,
    endpoint: json.endpoint,
    p256dh:   json.keys.p256dh,
    auth:     json.keys.auth,
  });
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const ep = sub.endpoint;
      await sub.unsubscribe().catch(() => {});
      await supabase.from("push_subscriptions").delete().eq("endpoint", ep);
    }
  } catch { /* noop */ }
}
