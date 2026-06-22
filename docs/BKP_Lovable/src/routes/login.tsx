import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/mobile-shell";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
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

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("senha") ?? "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível entrar. Confira email e senha.");
      return;
    }
      toast.success("Bem-vinda de volta ✨");
      navigate({ to: "/saudacao" });
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
            Bem-vinda <span className="text-gradient italic">de volta</span>
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
                placeholder="••••••••"
                className="h-14 rounded-2xl border-border bg-card pl-11 pr-11 text-base shadow-card focus-visible:ring-primary"
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

          <button
            type="button"
            onClick={() => toast.info("Te enviamos instruções no email (demo).")}
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
    </MobileShell>
  );
}
