// Armazenamento de arquivos em disco local (na própria aplicação).
// Os arquivos ficam em UPLOADS_DIR (padrão: <cwd>/uploads — em produção /app/uploads,
// montado como volume Docker para persistir entre rebuilds).
import { join, normalize, sep } from "node:path";

export function uploadsRoot(): string {
  return process.env.UPLOADS_DIR ?? join(process.cwd(), "uploads");
}

/**
 * Resolve um caminho relativo para um caminho absoluto seguro DENTRO do uploadsRoot,
 * rejeitando path traversal (../ etc).
 */
export function safeUploadPath(relative: string): string {
  const root = uploadsRoot();
  // remove barras iniciais e normaliza
  const clean = normalize(relative).replace(/^([/\\])+/, "");
  const abs = join(root, clean);
  if (abs !== root && !abs.startsWith(root + sep)) {
    throw new Error("Caminho inválido");
  }
  return abs;
}
