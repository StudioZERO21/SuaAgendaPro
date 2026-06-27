import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, CheckCircle2, AlertCircle, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  validateReviewToken,
  submitReviewWithToken,
  type TokenValidation,
} from "@/lib/review-tokens.functions";

export const Route = createFileRoute("/(public)/avaliar/$token")({
  head: () => ({
    meta: [{ title: "Avaliar atendimento — SuaAgenda.Pro" }],
  }),
  component: ReviewFormPage,
});

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const active = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform active:scale-90"
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "h-9 w-9 transition-colors",
                active ? "text-amber-400" : "text-muted-foreground/25"
              )}
              fill={active ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}

const STAR_LABELS = ["", "Ruim", "Regular", "Bom", "Muito bom", "Excelente!"];

function ReviewFormPage() {
  const { token } = Route.useParams();

  const [validation, setValidation] = useState<TokenValidation | null>(null);
  const [loading, setLoading]       = useState(true);

  // Form state
  const [name, setName]           = useState("");
  const [rating, setRating]       = useState(0);
  const [message, setMessage]     = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    validateReviewToken(token).then((result) => {
      setValidation(result);
      setLoading(false);
    });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!anonymous && !name.trim()) { setSubmitError("Informe seu nome para enviar a avaliação."); return; }
    if (rating === 0) { setSubmitError("Selecione uma nota de 1 a 5 estrelas."); return; }
    if (!message.trim()) { setSubmitError("Escreva uma mensagem sobre sua experiência."); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      await submitReviewWithToken({
        token,
        clientName: name.trim(),
        rating,
        message: message.trim(),
        isAnonymous: anonymous,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError((err as Error).message ?? "Erro ao enviar avaliação.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // ── Invalid token ────────────────────────────────────────────
  if (!validation || !validation.ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Link inválido</h1>
          <p className="mt-2 text-muted-foreground">
            {!validation ? "Não foi possível verificar este link." : validation.error}
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    );
  }

  const { professionalName, avatarUrl, expiresAt } = validation;
  const expiresDate = new Date(expiresAt).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

  // ── Success ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={professionalName}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-emerald-200 dark:ring-emerald-800"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-800">
              <User className="h-10 w-10 text-emerald-500" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="max-w-xs space-y-3">
          <h1 className="font-display text-2xl font-bold">Muito obrigado!</h1>
          <p className="text-base font-semibold text-foreground">
            {professionalName} agradece de coração pelo seu feedback.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sua avaliação é muito importante para a melhoria contínua do meu trabalho
            e me motiva a continuar evoluindo a cada atendimento.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-5 w-5 text-amber-400" fill="currentColor" />
          ))}
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-sm px-5 py-10">

        {/* Professional identity */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-secondary ring-4 ring-primary/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt={professionalName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <h1 className="font-display text-2xl font-bold">{professionalName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conte como foi sua experiência
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            Link válido até {expiresDate}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star rating */}
          <div className="flex flex-col items-center gap-2">
            <StarPicker value={rating} onChange={setRating} />
            <p className={cn(
              "h-5 text-sm font-semibold transition-all",
              rating > 0 ? "text-amber-500 opacity-100" : "opacity-0"
            )}>
              {STAR_LABELS[rating]}
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Seu nome{!anonymous && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <Input
              id="name"
              placeholder="Ex.: Maria Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={anonymous}
              required={!anonymous}
              className={cn(anonymous && "opacity-40")}
            />
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3.5">
            <Checkbox
              id="anon"
              checked={anonymous}
              onCheckedChange={(v) => setAnonymous(Boolean(v))}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <Label htmlFor="anon" className="cursor-pointer font-semibold">
                Enviar anonimamente
              </Label>
              <p className="text-[12px] text-muted-foreground">
                Seu nome não será exibido publicamente, mas o profissional poderá ver.
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="msg">Sua avaliação *</Label>
            <Textarea
              id="msg"
              rows={4}
              placeholder="Conte sobre sua experiência: atendimento, resultado, pontualidade..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={600}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {message.length}/600
            </p>
          </div>

          {submitError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting || rating === 0 || (!anonymous && !name.trim())}
            className="h-12 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
            ) : (
              "Enviar avaliação"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/60">
          Powered by{" "}
          <Link to="/" className="font-semibold hover:text-foreground">
            SuaAgenda.Pro
          </Link>
        </p>
      </div>
    </div>
  );
}
