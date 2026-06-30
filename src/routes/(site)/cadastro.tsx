import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Mail, Lock, Phone, Check, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/mobile-shell";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { recordReferralVisit, linkReferralToUser } from "@/lib/referral.functions";

export const Route = createFileRoute("/(site)/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — SuaAgenda.Pro" },
      { name: "description", content: "Comece grátis em 1 minuto." },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  senha: z
    .string()
    .min(8, "Mínimo de 8 caracteres")
    .regex(/[A-Z]/, "Deve ter ao menos 1 letra maiúscula")
    .regex(/[0-9]/, "Deve ter ao menos 1 número"),
});

type FieldId = "nome" | "email" | "telefone" | "senha";

const fields: Array<{ id: FieldId; label: string; icon: React.ElementType; type: string; placeholder: string; autoComplete: string }> = [
  { id: "nome",     label: "Nome completo", icon: User,  type: "text",     placeholder: "Como devemos te chamar",  autoComplete: "name" },
  { id: "email",    label: "Email",         icon: Mail,  type: "email",    placeholder: "voce@studio.com",         autoComplete: "email" },
  { id: "telefone", label: "WhatsApp",      icon: Phone, type: "tel",      placeholder: "(11) 99999-9999",         autoComplete: "tel" },
  { id: "senha",    label: "Senha",         icon: Lock,  type: "password", placeholder: "Mín. 8 chars, 1 maiúsc., 1 número", autoComplete: "new-password" },
];

function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldId, string>>>({});
  const [showPwd, setShowPwd] = useState(false);

  const refCode = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("ref") ?? null
    : null;

  useEffect(() => {
    if (refCode) {
      recordReferralVisit({ data: { code: refCode } }).catch(() => {});
    }
  }, [refCode]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const values = {
      nome:     String(data.get("nome") ?? "").trim(),
      email:    String(data.get("email") ?? "").trim(),
      telefone: String(data.get("telefone") ?? "").trim(),
      senha:    String(data.get("senha") ?? ""),
    };

    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<FieldId, string>> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as FieldId;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    // Anti-fraude: bloqueia novo cadastro com telefone já vinculado a uma conta
    try {
      const { data: inUse } = await supabase.rpc("phone_in_use", { p: values.telefone });
      if (inUse) {
        setLoading(false);
        setErrors({ telefone: "Este telefone já está vinculado a uma conta." });
        toast.error("Este telefone já tem uma conta. Faça login ou use outro número.");
        return;
      }
    } catch {
      /* se a checagem falhar, não bloqueia o cadastro */
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.senha,
      options: {
        data: { full_name: values.nome, phone: values.telefone },
      },
    });

    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        toast.error("Este email já está cadastrado. Tente fazer login.");
      } else {
        toast.error("Não foi possível criar a conta. Tente novamente.");
      }
      return;
    }

    // Vincular indicação se veio via link
    if (refCode && authData?.user?.id) {
      linkReferralToUser({
        data: { code: refCode, refereeId: authData.user.id, refereeEmail: values.email },
      }).catch(() => {});
    }

    toast.success("Conta criada! Vamos personalizar seu studio ✨");
    navigate({ to: "/onboarding" });
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
              className="space-y-1"
            >
              <Label htmlFor={f.id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {f.label}
              </Label>
              <div className="relative">
                <f.icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={f.id}
                  name={f.id}
                  type={f.id === "senha" ? (showPwd ? "text" : "password") : f.type}
                  required
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  className={`h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary ${f.id === "senha" ? "pr-11" : ""} ${errors[f.id] ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {f.id === "senha" && (
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
              {errors[f.id] && (
                <p className="text-xs text-red-500">{errors[f.id]}</p>
              )}
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
