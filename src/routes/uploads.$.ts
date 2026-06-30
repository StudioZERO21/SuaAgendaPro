import { createFileRoute } from "@tanstack/react-router";
import {
  isPrivateUploadPath,
  verifyUploadSignature,
} from "@/lib/upload-sign.server";

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
          const url = new URL(request.url);
          const rel = decodeURIComponent(
            url.pathname.replace(/^\/uploads\//, ""),
          );
          if (!rel || rel === url.pathname) {
            return new Response("Not found", { status: 404 });
          }

          if (isPrivateUploadPath(rel)) {
            const sig = url.searchParams.get("sig");
            if (!verifyUploadSignature(rel, sig)) {
              return new Response("Forbidden", { status: 403 });
            }
          }

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
              "Cache-Control": isPrivateUploadPath(rel)
                ? "private, max-age=3600"
                : "public, max-age=31536000, immutable",
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
