// POST /api/upload — recebe um arquivo e grava no disco local do app (/uploads/...).
// Autenticado por Bearer token (sessão Supabase do usuário). O UID vem do token
// verificado, nunca do client. Substitui o Supabase Storage.
import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_FOLDERS = new Set(["portfolio", "services", "profile", "support"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const Route = createFileRoute("/api/upload")({
  ssr: false,
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.replace(/^Bearer\s+/i, "").trim();
          if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
          if (authErr || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

          const form = await request.formData();
          const file = form.get("file");
          const folder = String(form.get("folder") ?? "");
          const wantedName = String(form.get("filename") ?? "");

          if (!(file instanceof File)) {
            return Response.json({ error: "arquivo ausente" }, { status: 400 });
          }
          if (!ALLOWED_FOLDERS.has(folder)) {
            return Response.json({ error: "pasta inválida" }, { status: 400 });
          }

          const buf = Buffer.from(await file.arrayBuffer());
          if (buf.length === 0) return Response.json({ error: "arquivo vazio" }, { status: 400 });
          if (buf.length > MAX_BYTES) return Response.json({ error: "arquivo muito grande (máx 8MB)" }, { status: 413 });

          const ext = EXT_BY_TYPE[file.type] ?? "bin";
          // Nome: usa o solicitado (sanitizado) ou gera por timestamp
          let name = wantedName.replace(/[^a-zA-Z0-9._-]/g, "");
          if (!name || name === "." || name === "..") name = `${Date.now()}.${ext}`;

          const rel = `${user.id}/${folder}/${name}`;
          const { safeUploadPath } = await import("@/lib/uploads.server");
          const abs = safeUploadPath(rel);

          const { mkdir, writeFile } = await import("node:fs/promises");
          const { dirname } = await import("node:path");
          await mkdir(dirname(abs), { recursive: true });
          await writeFile(abs, buf);

          return Response.json({ url: `/uploads/${rel}` });
        } catch (e: any) {
          return Response.json({ error: e?.message ?? "erro interno" }, { status: 500 });
        }
      },

      DELETE: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.replace(/^Bearer\s+/i, "").trim();
          if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
          if (authErr || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

          const body = await request.json().catch(() => ({}));
          const path = String(body?.path ?? "");
          // Só permite apagar arquivos do próprio usuário (path começa com o uid)
          if (!path || !path.startsWith(`${user.id}/`)) {
            return Response.json({ error: "caminho inválido" }, { status: 400 });
          }

          const { safeUploadPath } = await import("@/lib/uploads.server");
          const abs = safeUploadPath(path);
          const { unlink } = await import("node:fs/promises");
          await unlink(abs).catch(() => {});

          return Response.json({ ok: true });
        } catch (e: any) {
          return Response.json({ error: e?.message ?? "erro interno" }, { status: 500 });
        }
      },
    },
  },
});
