import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/precos")({
  head: () => ({
    meta: [
      { title: "Preços — SuaAgenda.Pro" },
      { name: "description", content: "Planos simples para profissionais autônomas, estúdios e salões. 3 dias grátis, sem cartão." },
      { property: "og:title", content: "Preços — SuaAgenda.Pro" },
      { property: "og:url", content: "/precos" },
    ],
    links: [{ rel: "canonical", href: "/precos" }],
  }),
  component: PrecosPage,
});

type Plan = {
  name: string; tagline: string;
  monthly: number; yearly: number;
  features: string[]; highlight?: boolean; cta: string;
};

const plans: Plan[] = [
  {
    name: "Solo",
    tagline: "Para quem atende sozinha",
    monthly: 39, yearly: 29,
    features: [
      "1 profissional",
      "Agenda ilimitada",
      "Lembretes via WhatsApp (50/mês)",
      "Ficha das clientes",
      "Link de agendamento online",
    ],
    cta: "Começar Solo",
  },
  {
    name: "Studio",
    tagline: "Para quem cresceu",
    monthly: 89, yearly: 69,
    features: [
      "Até 5 profissionais",
      "Lembretes ilimitados",
      "Programa de fidelidade",
      "Relatórios avançados",
      "Pagamentos online (Pix + cartão)",
      "Página personalizada com sua marca",
    ],
    highlight: true,
    cta: "Começar Studio",
  },
  {
    name: "Premium",
    tagline: "Para salões e franquias",
    monthly: 189, yearly: 149,
    features: [
      "Profissionais ilimitados",
      "Multi-unidades",
      "Campanhas e automações",
      "API e integrações",
      "Suporte prioritário 1:1",
      "Onboarding com especialista",
    ],
    cta: "Falar com vendas",
  },
];

const faqs = [
  { q: "Preciso de cartão pra testar?", a: "Não. São 3 dias grátis sem precisar cadastrar nenhuma forma de pagamento." },
  { q: "Posso mudar de plano depois?", a: "Sim, a qualquer momento — pra cima ou pra baixo. A cobrança é ajustada automaticamente." },
  { q: "Como funciona o WhatsApp?", a: "Os lembretes são enviados pelo nosso número oficial homologado. No plano Studio em diante são ilimitados." },
  { q: "Tem fidelidade ou multa?", a: "Nenhuma. Você cancela quando quiser direto no painel." },
];

function PrecosPage() {
  const [yearly, setYearly] = useState(true);

  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium">Preços</span>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
          Planos honestos,
          <br />
          <span className="text-gradient italic">pensados pra você crescer.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Comece grátis. Pague só quando seu studio decolar.
        </p>

        <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border/60 bg-card p-1 shadow-card">
          <button
            onClick={() => setYearly(false)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              !yearly ? "gradient-primary text-white shadow-glow" : "text-muted-foreground"
            )}
          >Mensal</button>
          <button
            onClick={() => setYearly(true)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition",
              yearly ? "gradient-primary text-white shadow-glow" : "text-muted-foreground"
            )}
          >
            Anual
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", yearly ? "bg-white/25" : "bg-success/15 text-success")}>
              -25%
            </span>
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const price = yearly ? p.yearly : p.monthly;
            return (
              <div
                key={p.name}
                className={cn(
                  "relative flex flex-col rounded-3xl border p-7 shadow-card",
                  p.highlight
                    ? "border-transparent gradient-primary text-white shadow-glow scale-[1.02]"
                    : "border-border/60 gradient-card"
                )}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-soft">
                    Mais popular
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" fill="currentColor" />
                  <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                </div>
                <p className={cn("mt-1 text-sm", p.highlight ? "text-white/85" : "text-muted-foreground")}>
                  {p.tagline}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-sm">R$</span>
                  <span className="font-display text-5xl font-bold leading-none">{price}</span>
                  <span className={cn("text-sm", p.highlight ? "text-white/85" : "text-muted-foreground")}>/mês</span>
                </div>
                {yearly && (
                  <p className={cn("mt-1 text-xs", p.highlight ? "text-white/85" : "text-muted-foreground")}>
                    cobrado anualmente
                  </p>
                )}

                <Button
                  asChild
                  size="lg"
                  className={cn(
                    "mt-6 h-12 rounded-2xl font-semibold",
                    p.highlight
                      ? "bg-white text-primary hover:bg-white/90"
                      : "gradient-primary text-white shadow-glow"
                  )}
                >
                  <Link to="/cadastro">{p.cta} <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>

                <ul className="mt-6 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={cn("mt-0.5 h-4 w-4 flex-shrink-0", p.highlight ? "text-white" : "text-primary")} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 pb-24">
        <h2 className="text-center font-display text-4xl font-bold tracking-tight">Perguntas frequentes</h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border/60 bg-card p-5 shadow-card open:shadow-soft">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                {f.q}
                <span className="ml-4 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
