// Upload de arquivos para o storage local do app (rota /api/upload → disco).
// Centraliza o envio: para trocar de storage no futuro, basta mudar aqui.
import { supabase } from "@/integrations/supabase/client";

async function authHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Envia um Blob para o disco do app e retorna a URL pública (ex: /uploads/<uid>/<folder>/<file>).
 * @param folder pasta lógica: "portfolio" | "services" | "profile" | "support"
 * @param filename nome fixo (ex: avatar.jpg) para sobrescrever; omitido = gera por timestamp
 */
export async function uploadBlob(
  blob: Blob,
  folder: "portfolio" | "services" | "profile" | "support",
  filename?: string,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", blob, filename ?? "upload");
  fd.append("folder", folder);
  if (filename) fd.append("filename", filename);

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: await authHeader(),
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Falha no upload");
  }
  const { url } = await res.json();
  return url as string;
}

/** Converte uma data URL (ex: canvas/crop) em Blob. */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * Remove um arquivo do disco do app a partir da sua URL (/uploads/...).
 * URLs antigas do Supabase são ignoradas (best-effort). Não lança erro.
 */
export async function deleteUpload(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const idx = url.indexOf("/uploads/");
  if (idx === -1) return; // não é arquivo local (ex: URL antiga do Supabase)
  const path = url.slice(idx + "/uploads/".length).split("?")[0];
  try {
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { ...(await authHeader()), "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
  } catch {
    /* best-effort */
  }
}
