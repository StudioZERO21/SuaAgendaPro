import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(site)/precos")({
  head: () => ({
    meta: [
      { title: "Preços — SuaAgenda.Pro" },
      { name: "description", content: "Comece grátis por 7 dias. Plano Premium completo por R$49,90/mês. Sem fidelidade, cancele quando quiser." },
      { property: "og:title", content: "Preços — SuaAgenda.Pro" },
      { property: "og:url", content: "/precos" },
    ],
    links: [{ rel: "canonical", href: "/precos" }],
  }),
  component: PrecosPage,
});

const faqs = [
  { q: "Preciso de cartão pra começar?", a: "Não. São 7 dias grátis sem precisar cadastrar nenhuma forma de pagamento." },
  { q: "Como funciona após o trial?", a: "Após 7 dias você escolhe o plano Premium por R$49,90/mês. Se não assinar, o acesso é suspenso e você pode reativar quando quiser." },
  { q: "Como funciona o WhatsApp?", a: "Os lembretes são enviados via WhatsApp para suas clientes automaticamente nos dias antes do agendamento." },
  { q: "Tem fidelidade ou multa?", a: "Nenhuma. Você cancela quando quiser direto no painel, sem burocracia." },
  { q: "Aceita quais formas de pagamento?", a: "PIX e cartão de crédito (via Asaas). A cobrança é mensal e automática." },
];

function PrecosPage() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium">Preços</span>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
          Um plano simples,
          <br />
          <span className="text-gradient italic">pra você crescer.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Comece grátis por 7 dias. Sem cartão. Sem pegadinha.
        </p>
      </section>

      {/* Cards */}
      <section className="mx-auto max-w-4xl px-5 pb-20">
        <div className="grid gap-6 md:grid-cols-3">

          {/* Trial */}
          <div className="relative flex flex-col rounded-3xl border border-border/60 gradient-card p-7 shadow-card">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-2xl font-bold">Acesso Livre</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Para explorar sem compromisso</p>
            <div className="my-6">
              <span className="font-display text-4xl font-bold">Grátis</span>
              <span className="ml-2 text-sm text-muted-foreground">por 7 dias</span>
            </div>
            <ul className="flex-1 space-y-2.5 text-sm">
              {["Agenda completa", "Clientes ilimitadas", "Agendamento online", "Notificações WhatsApp", "7 dias sem cartão"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/cadastro" className="mt-8">
              <Button variant="outline" className="w-full">Começar grátis</Button>
            </Link>
          </div>

          {/* Premium — Destaque */}
          <div className="relative flex flex-col rounded-3xl border-transparent gradient-primary p-7 shadow-glow scale-[1.02] text-white">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-soft">
              Mais popular
            </span>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" fill="currentColor" />
              <h3 className="font-display text-2xl font-bold">Premium</h3>
            </div>
            <p className="mt-1 text-sm text-white/75">Para profissionais que querem crescer</p>
            <div className="my-6">
              <span className="font-display text-4xl font-bold">R$49,90</span>
              <span className="ml-2 text-sm text-white/75">/mês</span>
            </div>
            <ul className="flex-1 space-y-2.5 text-sm">
              {[
                "Tudo do Acesso Livre",
                "Portfólio com fotos",
                "Avaliações das clientes",
                "Relatórios de faturamento",
                "Serviços ilimitados",
                "Sinal online (PIX + cartão)",
                "Suporte prioritário",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-white" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/cadastro" className="mt-8">
              <Button className="w-full bg-white text-primary font-bold hover:bg-white/90">
                Começar Premium
              </Button>
            </Link>
          </div>

          {/* Premium IA — Em breve */}
          <div className="relative flex flex-col rounded-3xl border border-border/60 gradient-card p-7 shadow-card opacity-75">
            <div className="absolute inset-0 rounded-3xl bg-background/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-10">
              <Lock className="h-6 w-6 text-muted-foreground" />
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Em breve</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" fill="currentColor" />
              <h3 className="font-display text-2xl font-bold">Premium IA</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Com inteligência artificial</p>
            <div className="my-6">
              <span className="font-display text-4xl font-bold">R$79,90</span>
              <span className="ml-2 text-sm text-muted-foreground">/mês</span>
            </div>
            <ul className="flex-1 space-y-2.5 text-sm">
              {[
                "Tudo do Premium",
                "Assistente IA integrado",
                "Sugestões automáticas",
                "Respostas inteligentes",
                "Análise de tendências",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-8 w-full" disabled>Em breve</Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-5 pb-24 space-y-4">
        <h2 className="text-center font-display text-2xl font-bold mb-8">Dúvidas frequentes</h2>
        {faqs.map(({ q, a }) => (
          <details key={q} className="group rounded-2xl border border-border/60 bg-card px-5 py-4 cursor-pointer">
            <summary className="flex items-center justify-between font-medium text-sm list-none">
              {q}
              <span className="ml-2 shrink-0 text-muted-foreground transition group-open:rotate-180">▾</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </details>
        ))}
      </section>
    </SiteShell>
  );
}
