import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/mobile-shell";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova Senha — SuaAgenda.Pro" },
      { name: "description", content: "Redefina sua senha de acesso." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  // Supabase sends #access_token=...&type=recovery in the hash
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.includes("type=recovery") && !hash.includes("access_token")) {
      setTokenError(true);
    }
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("senha") ?? "");
    const confirm = String(data.get("confirmar") ?? "");

    if (password.length < 8) {
      toast.error("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("A senha deve ter ao menos 1 letra maiúscula.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("A senha deve ter ao menos 1 número.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error("Não foi possível redefinir a senha. O link pode ter expirado.");
      return;
    }

    setDone(true);
    toast.success("Senha redefinida com sucesso!");
    setTimeout(() => navigate({ to: "/dashboard" }), 2500);
  }

  if (tokenError) {
    return (
      <MobileShell>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <BrandLogo size="lg" />
          <h1 className="mt-8 font-display text-2xl font-bold">Link inválido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este link de recuperação expirou ou é inválido.
            Solicite um novo na tela de login.
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
            Voltar ao login
          </Link>
        </div>
      </MobileShell>
    );
  }

  if (done) {
    return (
      <MobileShell>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </motion.div>
          <h1 className="mt-6 font-display text-2xl font-bold">Senha redefinida!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Redirecionando para sua agenda…
          </p>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="relative flex flex-1 flex-col justify-end px-6 pb-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full gradient-hero opacity-70 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 flex flex-col items-center text-center"
        >
          <BrandLogo size="2xl" />
          <h1 className="mt-6 font-display text-3xl font-bold leading-tight">
            Nova <span className="text-gradient italic">senha</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha uma senha segura para proteger sua conta.
          </p>
        </motion.div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="senha" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nova senha
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="senha"
                name="senha"
                type={show ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Mín. 8 chars, 1 maiúsc., 1 número"
                className="h-14 rounded-2xl border-border bg-card pl-11 pr-11 text-base shadow-card"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Confirmar nova senha
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmar"
                name="confirmar"
                type={showConfirm ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                className="h-14 rounded-2xl border-border bg-card pl-11 pr-11 text-base shadow-card"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="mt-2 h-14 rounded-2xl gradient-primary text-base font-semibold shadow-glow"
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </Button>

          <Link to="/login" className="text-center text-sm text-muted-foreground hover:text-foreground">
            Voltar ao login
          </Link>
        </form>
      </div>
    </MobileShell>
  );
}
