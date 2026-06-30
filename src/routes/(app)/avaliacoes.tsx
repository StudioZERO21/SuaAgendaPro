import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Star, Trash2, ArrowLeft, User,
  Link2, Copy, Check, Share2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";
import { useReviews, useToggleReviewPublic, useDeleteReview, MAX_PUBLIC } from "@/hooks/useReviews";
import { generateReviewToken } from "@/lib/review-tokens.functions";
import type { Review } from "@/integrations/supabase/types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/(app)/avaliacoes")({
  head: () => ({
    meta: [{ title: "Avaliações — SuaAgenda.Pro" }],
  }),
  component: AvaliacoesPage,
});

// ── Helpers ───────────────────────────────────────────────────

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) {
  const s = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(s, i < rating ? "text-amber-400" : "text-muted-foreground/30")}
          fill={i < rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function AvatarPlaceholder({ name, avatarUrl, isAnonymous }: { name: string; avatarUrl: string | null; isAnonymous: boolean }) {
  if (isAnonymous || !avatarUrl) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <User className="h-4 w-4" />
      </div>
    );
  }
  return <LazyImage src={avatarUrl} alt={name} width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />;
}

// ── Page ──────────────────────────────────────────────────────

function AvaliacoesPage() {
  const { data: reviews = [], isLoading } = useReviews();
  const togglePublic = useToggleReviewPublic();
  const deleteReview = useDeleteReview();

  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [generatedLink, setGeneratedLink]   = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied]                 = useState(false);

  const publicCount = reviews.filter((r) => r.is_public).length;
  const avgRating   = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  async function handleGenerateLink() {
    setGeneratingLink(true);
    try {
      const { token } = await generateReviewToken();
      const link = `${window.location.origin}/avaliar/${token}`;
      setGeneratedLink(link);
      setLinkDialogOpen(true);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Erro ao gerar link.");
    } finally {
      setGeneratingLink(false);
    }
  }

  async function copyLink() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2500);
  }

  async function shareLink() {
    if (!generatedLink) return;
    const text = `Olá! Gostaria de saber como foi seu atendimento. Por favor, deixe sua avaliação neste link (válido por 48h):\n${generatedLink}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Avalie meu atendimento", text, url: generatedLink }); }
      catch { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    }
  }

  async function handleToggle(review: Review) {
    const next = !review.is_public;
    try {
      await togglePublic.mutateAsync({ id: review.id, is_public: next, currentPublicCount: publicCount });
      toast.success(next ? "Avaliação publicada!" : "Avaliação ocultada.");
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Erro ao atualizar avaliação.");
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteReview.mutateAsync(confirmDelete.id);
      toast.success("Avaliação excluída.");
    } catch {
      toast.error("Erro ao excluir avaliação.");
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <>
      <MobileShell withNav>
        <header className="px-5 pt-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Studio</p>
              <h1 className="font-display text-2xl font-bold leading-tight">Avaliações</h1>
            </div>
            <Button
              onClick={handleGenerateLink}
              disabled={generatingLink}
              size="sm"
              className="h-9 rounded-2xl gradient-primary text-white shadow-glow gap-1.5 shrink-0"
            >
              {generatingLink ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              {generatingLink ? "Gerando…" : "Gerar link"}
            </Button>
          </div>
        </header>

        {/* Stats */}
        <section className="mt-5 px-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total",       value: String(reviews.length) },
              { label: "Publicadas",  value: `${publicCount}/${MAX_PUBLIC}` },
              { label: "Nota média",  value: reviews.length ? avgRating.toFixed(1) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-3 shadow-card text-center">
                <p className="font-display text-xl font-bold">{value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-3 px-5 text-[11px] text-muted-foreground">
          Exiba até <span className="font-semibold text-foreground">{MAX_PUBLIC}</span> avaliações na sua página pública. Links gerados expiram em <span className="font-semibold text-foreground">48h</span> e são de uso único.
        </p>

        {/* Reviews list */}
        <main className="mt-4 flex-1 space-y-2 px-5 pb-6">
          {isLoading && (
            <div className="py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {!isLoading && reviews.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/40 px-5 py-12 text-center">
              <Star className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-semibold">Nenhuma avaliação ainda</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Gere um link e envie para seus clientes avaliarem.
              </p>
            </div>
          )}

          {!isLoading && reviews.map((review) => {
            const displayName = review.is_anonymous ? `Anônimo (${review.client_name})` : review.client_name;
            const publicName  = review.is_anonymous ? "Anônimo" : review.client_name;
            const isAtLimit   = publicCount >= MAX_PUBLIC && !review.is_public;
            const date = new Date(review.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "short", year: "numeric",
            });

            return (
              <div
                key={review.id}
                className={cn(
                  "flex gap-3 rounded-2xl border bg-card p-4 shadow-card transition-all",
                  review.is_public ? "border-primary/20 bg-primary/[0.02]" : "border-border"
                )}
              >
                <AvatarPlaceholder
                  name={publicName}
                  avatarUrl={review.client_avatar_url}
                  isAnonymous={review.is_anonymous}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <StarRow rating={review.rating} size="xs" />
                        <span className="text-[10px] text-muted-foreground">{date}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Switch
                        checked={review.is_public}
                        disabled={togglePublic.isPending || isAtLimit}
                        title={isAtLimit ? `Limite de ${MAX_PUBLIC} avaliações atingido` : undefined}
                        onCheckedChange={() => handleToggle(review)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmDelete(review)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
                    {review.message}
                  </p>
                </div>
              </div>
            );
          })}
        </main>

        <BottomNav />
      </MobileShell>

      {/* ── Link dialog ───────────────────────────────────────── */}
      <Dialog open={linkDialogOpen} onOpenChange={(o) => { setLinkDialogOpen(o); if (!o) setCopied(false); }}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Link de avaliação gerado
            </DialogTitle>
            <DialogDescription>
              Válido por <strong>48 horas</strong> e de uso único. Envie para o cliente
              que deseja avaliar seu atendimento.
            </DialogDescription>
          </DialogHeader>

          {/* Link box */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 px-3 py-2.5">
              <p className="min-w-0 flex-1 truncate text-[11px] font-mono text-muted-foreground/70">
                {generatedLink
                  ? (() => {
                      try {
                        const url = new URL(generatedLink);
                        const token = url.pathname.split("/").pop() ?? "";
                        return `${url.host}/avaliar/${token.slice(0, 8)}…`;
                      } catch { return generatedLink.slice(0, 35) + "…"; }
                    })()
                  : ""}
              </p>
              <button
                onClick={copyLink}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-card border border-border transition hover:bg-secondary"
                aria-label="Copiar link"
              >
                {copied
                  ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                  : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Copied feedback */}
            <p className={cn(
              "text-center text-[11px] font-semibold text-emerald-500 transition-all duration-300",
              copied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
            )}>
              ✓ Link copiado!
            </p>
          </div>

          {/* Share */}
          <Button
            onClick={shareLink}
            className="h-11 w-full rounded-2xl gap-2 gradient-primary text-white shadow-glow"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar link
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Após o uso, o link é invalidado automaticamente.
          </p>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ────────────────────────────────────── */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
            <AlertDialogDescription>
              A avaliação de <strong>{confirmDelete?.is_anonymous ? "Anônimo" : confirmDelete?.client_name}</strong> será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
