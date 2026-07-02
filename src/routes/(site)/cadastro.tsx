import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Mail, Phone, Check, Mail as MailIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MobileShell } from "@/components/mobile-shell";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import { recordReferralVisit } from "@/lib/referral.functions";
import { preRegister } from "@/lib/register.functions";

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
  nome:     z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email:    z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
});

type FieldId = "nome" | "email" | "telefone";

const fields: Array<{ id: FieldId; label: string; icon: React.ElementType; type: string; placeholder: string; autoComplete: string }> = [
  { id: "nome",     label: "Nome completo", icon: User,  type: "text",  placeholder: "Como devemos te chamar", autoComplete: "name" },
  { id: "email",    label: "Email",         icon: Mail,  type: "email", placeholder: "voce@studio.com",        autoComplete: "email" },
  { id: "telefone", label: "WhatsApp",      icon: Phone, type: "tel",   placeholder: "(11) 99999-9999",        autoComplete: "tel" },
];

function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldId, string>>>({});
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

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
    const fd     = new FormData(e.currentTarget);
    const values = {
      nome:     String(fd.get("nome") ?? "").trim(),
      email:    String(fd.get("email") ?? "").trim(),
      telefone: String(fd.get("telefone") ?? "").trim(),
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
    if (!acceptedLegal) {
      toast.error("Aceite os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await preRegister({
        data: { name: values.nome, email: values.email, phone: values.telefone, refCode: refCode ?? null },
      });
      setSentEmail(values.email);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar o e-mail. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sentEmail) {
    return (
      <MobileShell>
        <div className="relative flex flex-1 flex-col px-6 pt-6">
          <div className="pointer-events-none absolute -top-24 -right-12 h-56 w-56 rounded-full gradient-hero opacity-70 blur-3xl" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex flex-1 flex-col items-center justify-center text-center"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full gradient-primary shadow-glow">
              <MailIcon className="h-9 w-9 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Verifique seu e-mail
            </h1>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Enviamos um link de ativação para{" "}
              <span className="font-semibold text-foreground">{sentEmail}</span>.
              Clique no link para criar sua senha e ativar a conta.
            </p>
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              ⏰ O link expira em 4 horas. Verifique também a pasta de spam.
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              Não recebeu o e-mail?{" "}
              <button
                onClick={() => setSentEmail(null)}
                className="font-semibold text-primary hover:underline"
              >
                Tentar novamente
              </button>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
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
                  type={f.type}
                  required
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  className={`h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary ${errors[f.id] ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
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

          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4">
            <Checkbox
              id="legal"
              checked={acceptedLegal}
              onCheckedChange={(v) => setAcceptedLegal(v === true)}
            />
            <label htmlFor="legal" className="text-xs leading-relaxed text-muted-foreground">
              Li e aceito os{" "}
              <Link to="/termos" className="font-medium text-primary underline-offset-2 hover:underline">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link to="/privacidade" className="font-medium text-primary underline-offset-2 hover:underline">
                Política de Privacidade
              </Link>
              .
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading || !acceptedLegal}
            className="mt-3 h-14 rounded-2xl gradient-primary text-base font-semibold shadow-glow"
          >
            {loading ? "Enviando..." : "Continuar"}
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
