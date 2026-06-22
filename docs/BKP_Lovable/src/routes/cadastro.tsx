import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Mail, Lock, Phone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/mobile-shell";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — SuaAgenda.Pro" },
      { name: "description", content: "Comece grátis em 1 minuto." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("senha") ?? "");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: String(form.get("nome") ?? "").trim(),
          phone: String(form.get("telefone") ?? "").trim(),
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível criar a conta. Tente outro email ou senha.");
      return;
    }
    toast.success("Conta criada! Vamos personalizar seu studio ✨");
    navigate({ to: "/onboarding" });
  }

  const fields: Array<{ id: string; label: string; icon: any; type: string; placeholder: string }> = [
    { id: "nome", label: "Nome completo", icon: User, type: "text", placeholder: "Como devemos te chamar" },
    { id: "email", label: "Email", icon: Mail, type: "email", placeholder: "voce@studio.com" },
    { id: "telefone", label: "WhatsApp", icon: Phone, type: "tel", placeholder: "(11) 99999-9999" },
    { id: "senha", label: "Senha", icon: Lock, type: "password", placeholder: "Mínimo 8 caracteres" },
  ];

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
          <BrandLogo size="lg" />
          <h1 className="mt-8 font-display text-4xl font-bold leading-tight">
            Comece <span className="text-gradient italic">grátis</span> hoje
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            3 dias para testar tudo. Sem cartão, sem pegadinha.
          </p>
        </motion.div>

        <form onSubmit={submit} className="relative mt-6 flex flex-1 flex-col gap-4">
          {fields.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="space-y-2"
            >
              <Label htmlFor={f.id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {f.label}
              </Label>
              <div className="relative">
                <f.icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={f.id}
                  name={f.id}
                  type={f.type}
                  required
                  placeholder={f.placeholder}
                  className="h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
                />
              </div>
            </motion.div>
          ))}

          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            {["Agenda completa", "Lembretes automáticos", "Link público para clientes"].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <div className="flex h-4 w-4 items-center justify-center rounded-full gradient-primary text-white">
                  <Check className="h-2.5 w-2.5" />
                </div>
                {b}
              </li>
            ))}
          </ul>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="mt-3 h-14 rounded-2xl gradient-primary text-base font-semibold shadow-glow"
          >
            {loading ? "Criando..." : "Criar conta grátis"}
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
