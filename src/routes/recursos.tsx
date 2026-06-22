import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar, MessageCircle, Users, BarChart3, Smartphone, Heart,
  Bell, CreditCard, Shield, Palette, Clock, Gift, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/recursos")({
  head: () => ({
    meta: [
      { title: "Recursos — SuaAgenda.Pro" },
      { name: "description", content: "Agenda inteligente, lembretes no WhatsApp, ficha da cliente, relatórios e tudo o que seu studio de beleza precisa." },
      { property: "og:title", content: "Recursos — SuaAgenda.Pro" },
      { property: "og:url", content: "/recursos" },
    ],
    links: [{ rel: "canonical", href: "/recursos" }],
  }),
  component: RecursosPage,
});

const groups = [
  {
    title: "Agenda & atendimento",
    items: [
      { icon: Calendar, t: "Agenda em tempo real", d: "Vista diária, semanal e por profissional." },
      { icon: Clock, t: "Bloqueio de horários", d: "Folgas, intervalos e feriados em 2 toques." },
      { icon: Bell, t: "Lembretes automáticos", d: "WhatsApp, e-mail e push para reduzir faltas." },
    ],
  },
  {
    title: "Clientes & fidelização",
    items: [
      { icon: Users, t: "Ficha da cliente", d: "Histórico, preferências e fotos do antes/depois." },
      { icon: Heart, t: "Programa de fidelidade", d: "Pontos, recompensas e aniversariantes do mês." },
      { icon: Gift, t: "Campanhas", d: "Promoções segmentadas direto no WhatsApp." },
    ],
  },
  {
    title: "Gestão & dinheiro",
    items: [
      { icon: CreditCard, t: "Pagamentos", d: "Receba por Pix, cartão e link de pagamento." },
      { icon: BarChart3, t: "Relatórios", d: "Faturamento, serviços top e clientes que mais voltam." },
      { icon: Shield, t: "Segurança", d: "Dados criptografados e backup automático." },
    ],
  },
  {
    title: "Sua marca, seu jeito",
    items: [
      { icon: Palette, t: "Página personalizada", d: "Link de agendamento com sua identidade visual." },
      { icon: Smartphone, t: "Funciona no celular", d: "Atenda de onde estiver, sem instalar nada." },
      { icon: MessageCircle, t: "Mensagens prontas", d: "Modelos editáveis para confirmar, lembrar e agradecer." },
    ],
  },
];

function RecursosPage() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full gradient-hero opacity-60 blur-3xl" />
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium">Recursos</span>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
            Tudo que você precisa,
            <br />
            <span className="text-gradient italic">nada que você não precisa.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Cada recurso foi desenhado junto com profissionais da beleza.
            Bonito de usar, rápido de aprender.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="space-y-14">
          {groups.map((g) => (
            <div key={g.title}>
              <h2 className="font-display text-2xl font-bold">{g.title}</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {g.items.map((it) => (
                  <div key={it.t} className="rounded-3xl border border-border/60 gradient-card p-6 shadow-card">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary text-white shadow-glow">
                      <it.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">{it.t}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{it.d}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 overflow-hidden rounded-[2.5rem] gradient-primary p-10 text-center text-white shadow-glow">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Teste tudo isso por 3 dias grátis</h2>
          <Button asChild size="lg" className="mt-6 h-14 rounded-2xl bg-white text-base font-semibold text-primary hover:bg-white/90">
            <Link to="/cadastro">Criar minha conta <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
