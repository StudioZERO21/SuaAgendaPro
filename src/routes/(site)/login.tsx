import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/mobile-shell";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getOnboardingStatus } from "@/lib/auth";
import { recordActivity } from "@/lib/activity.functions";

export const Route = createFileRoute("/(site)/login")({
  head: () => ({
    meta: [
      { title: "Entrar — SuaAgenda.Pro" },
      { name: "description", content: "Acesse sua agenda premium." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("senha") ?? "");

    // Limpa qualquer nonce local antigo ANTES de logar. O checkNonce dispara
    // imediatamente no evento SIGNED_IN; se o localStorage estiver vazio ele
    // retorna cedo (sem kick) durante a janela em que o nonce é gravado.
    localStorage.removeItem("session_nonce");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      recordActivity({ data: { event: "login_failed", email } }).catch(() => {});
      toast.error("Não foi possível entrar. Confira email e senha.");
      return;
    }
    recordActivity({ data: { event: "login_success", email, professionalId: data.user.id } }).catch(() => {});

    // Register this as the only active session — other devices will be kicked out within 30s
    const nonce = crypto.randomUUID();

    const [profile] = await Promise.all([
      supabase.from("profiles").select("force_password_change, active_session_nonce").eq("id", data.user.id).single()
        .then(({ data: p }) => p),
      supabase.auth.signOut({ scope: "others" }),
    ]);

    // Grava o nonce no banco PRIMEIRO e só então no localStorage — evita a
    // janela "local=novo, banco=antigo" que disparava o falso kick (race com
    // o checkNonce do SIGNED_IN).
    await supabase.from("profiles").update({ active_session_nonce: nonce }).eq("id", data.user.id);
    localStorage.setItem("session_nonce", nonce);

    // If admin forced a password change, redirect there before the dashboard
    if (profile?.force_password_change) {
      setLoading(false);
      navigate({ to: "/trocar-senha" });
      return;
    }

    const onboarded = await getOnboardingStatus(data.user.id);
    setLoading(false);
    toast.success("Que bom te ver de novo ✨");
    navigate({ to: onboarded ? "/dashboard" : "/onboarding" });
  }

  async function sendReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) {
      toast.error("Não foi possível enviar. Verifique o email.");
    } else {
      toast.success("Instruções enviadas! Verifique sua caixa de entrada.");
      setForgotOpen(false);
      setForgotEmail("");
    }
  }

  return (
    <MobileShell>
      <div className="relative flex flex-1 flex-col justify-end px-6 pb-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full gradient-hero opacity-70 blur-3xl" />
        <Link
          to="/"
          className="absolute left-4 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-6 flex flex-col items-center text-center"
        >
          <BrandLogo size="2xl" />
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight">
            Que bom <span className="text-gradient italic">te ver</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre para continuar gerenciando sua agenda.
          </p>
        </motion.div>

        <form onSubmit={submit} className="relative mt-6 flex flex-col gap-3">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@studio.com"
                className="h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Senha
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="senha"
                name="senha"
                type={show ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-14 rounded-2xl border-border bg-card pl-11 pr-11 text-base shadow-card focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="-mt-1 self-end text-xs font-medium text-primary hover:underline"
          >
            Esqueci minha senha
          </button>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="mt-2 h-14 rounded-2xl gradient-primary text-base font-semibold shadow-glow"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-primary hover:underline">
            Crie agora
          </Link>
        </p>
      </div>

      {/* Modal — Esqueci minha senha */}
      <AnimatePresence>
        {forgotOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setForgotOpen(false); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold">Recuperar acesso</h2>
                <button
                  onClick={() => setForgotOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Informe seu email e enviaremos um link para redefinir sua senha.
              </p>
              <form onSubmit={sendReset} className="flex flex-col gap-3">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="voce@studio.com"
                    className="h-12 rounded-2xl pl-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="h-12 rounded-2xl gradient-primary font-semibold"
                >
                  {forgotLoading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileShell>
  );
}
