import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Scissors, Store, Check, Eye, Hand, Heart, Flame, Flower2, Star, Brush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/mobile-shell";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Bem-vinda — SuaAgenda.Pro" },
      { name: "description", content: "Personalize seu studio em 3 passos." },
    ],
  }),
  component: OnboardingPage,
});

const niches = [
  { id: "lash", label: "Lash & Brow", Icon: Eye },
  { id: "nail", label: "Manicure", Icon: Sparkles },
  { id: "hair", label: "Cabelo", Icon: Scissors },
  { id: "skin", label: "Estética facial", Icon: Flower2 },
  { id: "body", label: "Estética corporal", Icon: Heart },
  { id: "makeup", label: "Maquiagem", Icon: Brush },
  { id: "depil", label: "Depilação", Icon: Flame },
  { id: "other", label: "Outro", Icon: Star },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [nichesSel, setNichesSel] = useState<string[]>([]);
  const totalSteps = 3;

  function toggleNiche(id: string) {
    setNichesSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function next() {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      toast.success("Studio pronto! Bora atender ✨");
      navigate({ to: "/app" });
    }
  }
  function back() {
    if (step === 0) navigate({ to: "/cadastro" });
    else setStep((s) => s - 1);
  }

  return (
    <MobileShell>
      <div className="relative flex flex-1 flex-col px-6 pt-6">
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full gradient-hero opacity-70 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <button
            onClick={back}
            className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Passo {step + 1} de {totalSteps}
          </span>
          <div className="w-10" />
        </div>

        {/* progress */}
        <div className="relative mt-3 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                i <= step ? "gradient-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>

        <div className="relative mt-8 flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="s0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-1 flex-col"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-soft text-primary">
                  <Store className="h-5 w-5" />
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold leading-tight">
                  Vamos conhecer seu <span className="text-gradient italic">trabalho</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Essas informações aparecem no seu link público.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Nome Completo
                    </Label>
                    <Input
                      placeholder="Seu nome"
                      className="h-14 rounded-2xl border-border bg-card text-base shadow-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Cidade / Bairro que atua
                    </Label>
                    <Input
                      placeholder="Onde você atende"
                      className="h-14 rounded-2xl border-border bg-card text-base shadow-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Bio curta
                    </Label>
                    <Input
                      placeholder="Transformando autoestima ✨"
                      className="h-14 rounded-2xl border-border bg-card text-base shadow-card focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-1 flex-col"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-soft text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold leading-tight">
                  Qual é a sua <span className="text-gradient italic">especialidade?</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Selecione uma ou mais áreas que você atende.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {niches.map((n) => {
                    const active = nichesSel.includes(n.id);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => toggleNiche(n.id)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                          active
                            ? "border-primary bg-secondary shadow-glow"
                            : "border-border bg-card shadow-card hover:border-primary/40",
                        )}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
                          <n.Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold">{n.label}</span>
                        {active && (
                          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full gradient-primary text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-1 flex-col"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-soft text-primary">
                  <Scissors className="h-5 w-5" />
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold leading-tight">
                  Cadastre seu <span className="text-gradient italic">primeiro serviço</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você pode adicionar quantos quiser depois.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Nome do serviço
                    </Label>
                    <Input
                      placeholder="Ex: Volume Brasileiro"
                      className="h-14 rounded-2xl border-border bg-card text-base shadow-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Duração
                      </Label>
                      <Input
                        placeholder="60 min"
                        className="h-14 rounded-2xl border-border bg-card text-base shadow-card focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Valor
                      </Label>
                      <Input
                        placeholder="R$ 120"
                        className="h-14 rounded-2xl border-border bg-card text-base shadow-card focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl gradient-soft p-4 text-sm text-secondary-foreground">
                  <p className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <strong>Quase lá!</strong> Depois disso, você já pode receber agendamentos pelo seu link público.
                    </span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={next}
            size="lg"
            className="mb-10 mt-8 h-14 rounded-2xl gradient-primary text-base font-semibold shadow-glow"
          >
            {step === totalSteps - 1 ? "Acessar minha agenda" : "Continuar"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}
