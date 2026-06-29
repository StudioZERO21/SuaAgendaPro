// GET /uploads/<path> — serve arquivos do disco local do app.
// Os arquivos ficam em UPLOADS_DIR (volume Docker em produção). Servido em todos
// os subdomínios (o middleware passa direto por terminar em extensão de imagem).
import { createFileRoute } from "@tanstack/react-router";

const TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export const Route = createFileRoute("/uploads/$")({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { pathname } = new URL(request.url);
          const rel = decodeURIComponent(pathname.replace(/^\/uploads\//, ""));
          if (!rel || rel === pathname) return new Response("Not found", { status: 404 });

          const { safeUploadPath } = await import("@/lib/uploads.server");
          const abs = safeUploadPath(rel);

          const { readFile } = await import("node:fs/promises");
          const data = await readFile(abs);

          const ext = rel.split(".").pop()?.toLowerCase() ?? "";
          const type = TYPE_BY_EXT[ext] ?? "application/octet-stream";

          return new Response(data, {
            status: 200,
            headers: {
              "Content-Type": type,
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
