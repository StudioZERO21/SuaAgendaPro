import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Eye, EyeOff, Check } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/mobile-shell";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getPreregData, activateAccount } from "@/lib/register.functions";
import { linkReferralToUser } from "@/lib/referral.functions";
import { recordTermsAcceptance } from "@/lib/privacy.functions";

export const Route = createFileRoute("/(site)/ativar")({
  head: () => ({
    meta: [
      { title: "Ativar conta — SuaAgenda.Pro" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ t: String(s.t ?? "") }),
  component: ActivatePage,
});

const pwdSchema = z
  .string()
  .min(8, "Mínimo de 8 caracteres")
  .regex(/[A-Z]/, "Deve ter ao menos 1 letra maiúscula")
  .regex(/[0-9]/, "Deve ter ao menos 1 número");

type Prereg = { email: string; firstName: string; refCode: string | null };

function ActivatePage() {
  const navigate = useNavigate();
  const { t } = Route.useSearch();

  const [prereg, setPrereg] = useState<Prereg | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (!t) { setPrereg(null); return; }
    getPreregData({ data: { token: t } })
      .then(setPrereg)
      .catch(() => setPrereg(null));
  }, [t]);

  if (prereg === undefined) {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MobileShell>
    );
  }

  if (!prereg) {
    return (
      <MobileShell>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="mb-6 text-5xl">⏰</div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Link expirado
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Este link de ativação expirou ou já foi utilizado.
              <br />
              Faça o cadastro novamente para receber um novo link.
            </p>
            <Button asChild className="mt-8 h-14 w-full rounded-2xl gradient-primary text-base font-semibold shadow-glow">
              <Link to="/cadastro">Fazer cadastro novamente</Link>
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </motion.div>
        </div>
      </MobileShell>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd       = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm  = String(fd.get("confirm") ?? "");

    const pwdResult = pwdSchema.safeParse(password);
    if (!pwdResult.success) {
      setPwdError(pwdResult.error.issues[0].message);
      return;
    }
    if (password !== confirm) {
      setConfirmError("As senhas não conferem.");
      return;
    }
    setPwdError(null);
    setConfirmError(null);
    setLoading(true);

    try {
      const result = await activateAccount({ data: { token: t, password } });

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    result.email,
        password,
      });
      if (signInErr) throw new Error(signInErr.message);

      // Ações pós-ativação (não bloqueantes)
      recordTermsAcceptance({}).catch(() => {});
      if (result.refCode && result.userId) {
        linkReferralToUser({
          data: { code: result.refCode, refereeId: result.userId, refereeEmail: result.email },
        }).catch(() => {});
      }

      toast.success("Conta ativada! Bem-vindo(a) ao SuaAgenda.Pro 🎉");
      navigate({ to: "/onboarding" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ativar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell>
      <div className="relative flex flex-1 flex-col px-6 pt-6">
        <div className="pointer-events-none absolute -top-24 -right-12 h-56 w-56 rounded-full gradient-hero opacity-70 blur-3xl" />
        <Link
          to="/"
          className="relative -ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-4 flex flex-col items-center text-center"
        >
          <BrandLogo variant="stack" size="lg" priority />
          <h1 className="mt-8 font-display text-3xl font-bold leading-tight">
            Olá, <span className="text-gradient">{prereg.firstName}</span>!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie uma senha para ativar sua conta
            <br />
            <span className="font-medium text-foreground">{prereg.email}</span>
          </p>
        </motion.div>

        <form onSubmit={submit} className="relative mt-8 flex flex-1 flex-col gap-4">
          {/* Senha */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-1"
          >
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Senha
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPwd ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Mín. 8 chars, 1 maiúsc., 1 número"
                className={`h-14 rounded-2xl border-border bg-card pl-11 pr-11 text-base shadow-card focus-visible:ring-primary ${pwdError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwdError && <p className="text-xs text-red-500">{pwdError}</p>}
          </motion.div>

          {/* Confirmar senha */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-1"
          >
            <Label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Confirmar senha
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm"
                name="confirm"
                type={showConfirm ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Repita a senha"
                className={`h-14 rounded-2xl border-border bg-card pl-11 pr-11 text-base shadow-card focus-visible:ring-primary ${confirmError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmError && <p className="text-xs text-red-500">{confirmError}</p>}
          </motion.div>

          {/* Requisitos */}
          <ul className="mt-1 space-y-1.5 text-xs text-muted-foreground">
            {["Mínimo de 8 caracteres", "Ao menos 1 letra maiúscula", "Ao menos 1 número"].map((req) => (
              <li key={req} className="flex items-center gap-2">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary">
                  <Check className="h-2.5 w-2.5" />
                </div>
                {req}
              </li>
            ))}
          </ul>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="mt-4 h-14 rounded-2xl gradient-primary text-base font-semibold shadow-glow"
          >
            {loading ? "Ativando..." : "Ativar minha conta"}
          </Button>

          <p className="mb-8 mt-auto pt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </MobileShell>
  );
}
