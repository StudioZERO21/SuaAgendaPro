import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Calendar,
  Heart,
  MessageCircle,
  BarChart3,
  Smartphone,
  Star,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SuaAgenda.Pro — Agenda premium para profissionais da beleza" },
      {
        name: "description",
        content:
          "Software de agendamento online para salões, estúdios de beleza e profissionais autônomas. Lembretes no WhatsApp, agenda inteligente e clientes fiéis.",
      },
      { property: "og:title", content: "SuaAgenda.Pro" },
      { property: "og:description", content: "Agenda premium para profissionais da beleza." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const features = [
  { icon: Calendar, title: "Agenda inteligente", desc: "Visualize seu dia em segundos, com cores e status claros." },
  { icon: MessageCircle, title: "Lembretes no WhatsApp", desc: "Reduza faltas com lembretes automáticos para suas clientes." },
  { icon: Users, title: "Ficha da cliente", desc: "Histórico, preferências e fotos — tudo em um só lugar." },
  { icon: BarChart3, title: "Relatórios em tempo real", desc: "Saiba o que mais vende e quanto você faturou na semana." },
  { icon: Smartphone, title: "Funciona no celular", desc: "App leve, rápido e pensado pra você atender de qualquer lugar." },
  { icon: Heart, title: "Clientes fiéis", desc: "Programa de fidelidade e reagendamento com um toque." },
];

const stats = [
  { value: "+2.500", label: "profissionais" },
  { value: "98%", label: "menos no-shows" },
  { value: "4.9★", label: "avaliação" },
];

const testimonials = [
  {
    name: "Camila R.",
    role: "Lash Designer · SP",
    text: "Triplicou minha organização. As clientes amam receber o lembrete no WhatsApp 💕",
  },
  {
    name: "Bia M.",
    role: "Nail Studio · BH",
    text: "Larguei caderno e planilha. Hoje só uso o SuaAgenda — bonito, fácil e rápido.",
  },
  {
    name: "Letícia S.",
    role: "Designer de Sobrancelhas · RJ",
    text: "Os relatórios me mostraram que eu tava cobrando barato. Aumentei o ticket em 30%.",
  },
];

function HomePage() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full gradient-hero opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-[-10%] h-[380px] w-[380px] rounded-full bg-accent/20 blur-3xl" />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="h-3 w-3" fill="currentColor" /> Premium para estética
            </span>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Sua agenda,
              <br />
              <span className="text-gradient italic">seu tempo</span>,
              <br />
              mais clientes.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              O app de agendamento feito pra profissionais da beleza que querem
              parar de perder horários no caderno e começar a faturar mais.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-14 rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow">
                <Link to="/cadastro">
                  Começar grátis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 rounded-2xl text-base">
                <Link to="/recursos">Ver recursos</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              3 dias grátis · sem cartão de crédito · cancela quando quiser
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-bold text-gradient">{s.value}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="absolute -inset-6 rounded-[3rem] gradient-hero opacity-60 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2.5rem] border-8 border-foreground/90 bg-background shadow-glow">
              <div className="gradient-soft px-6 pb-6 pt-8">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Hoje, ter 21</span>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium">8 horários</span>
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold">Boa tarde, Bia ✨</h3>
                <p className="text-xs text-muted-foreground">Seu faturamento hoje: R$ 1.240</p>
              </div>
              <div className="space-y-3 p-5">
                {[
                  { h: "14:00", n: "Júlia Mendes", s: "Volume Russo", c: "bg-pink-100 text-pink-800" },
                  { h: "15:30", n: "Ana Carolina", s: "Esmaltação em Gel", c: "bg-fuchsia-100 text-fuchsia-800" },
                  { h: "17:00", n: "Marina Souza", s: "Design + Henna", c: "bg-rose-100 text-rose-800" },
                ].map((a) => (
                  <div key={a.h} className="flex items-center gap-3 rounded-2xl border border-border/60 p-3 shadow-card">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl gradient-soft text-xs font-semibold">
                      {a.h}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{a.n}</div>
                      <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${a.c}`}>
                        {a.s}
                      </span>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                ))}
                <button className="w-full rounded-2xl gradient-primary py-3 text-sm font-semibold text-white shadow-glow">
                  + Novo agendamento
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="border-y border-border/60 bg-secondary/30 py-8">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Usado por estúdios em todo o Brasil
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-base font-display italic text-muted-foreground/80">
            <span>Lash Studio</span>
            <span>·</span>
            <span>Belle Nails</span>
            <span>·</span>
            <span>Atelier Rosa</span>
            <span>·</span>
            <span>Studio Brow</span>
            <span>·</span>
            <span>Pele de Pêssego</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="recursos" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            Recursos
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Tudo o que seu studio precisa
            <br />
            <span className="text-gradient italic">em um só lugar</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pensado por quem entende do salão. Bonito por fora, poderoso por dentro.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-3xl border border-border/60 gradient-card p-6 shadow-card transition hover:shadow-glow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-white shadow-glow">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SPLIT */}
      <section className="bg-secondary/30 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-medium">
              <Clock className="h-3 w-3" /> Economize 8h por semana
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Menos tempo na <span className="text-gradient italic">agenda</span>,
              mais tempo com suas clientes.
            </h2>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Confirmação automática via WhatsApp",
                "Bloqueio de horários e folgas em 2 toques",
                "Reagendamento sem dor de cabeça",
                "Histórico completo de cada cliente",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 h-12 rounded-2xl gradient-primary text-white shadow-glow">
              <Link to="/cadastro">Quero testar grátis <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[3rem] gradient-hero opacity-50 blur-2xl" />
            <div className="relative rounded-3xl border border-border/60 bg-card p-6 shadow-glow">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Esta semana</h3>
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">+18%</span>
              </div>
              <div className="mt-5 grid grid-cols-7 items-end gap-2 h-32">
                {[40, 60, 35, 80, 55, 95, 70].map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-lg gradient-primary" style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2 text-center text-[10px] text-muted-foreground">
                {["S","T","Q","Q","S","S","D"].map((d, i) => <span key={i}>{d}</span>)}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl gradient-soft p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Faturamento</p>
                  <p className="mt-1 font-display text-xl font-bold">R$ 6.420</p>
                </div>
                <div className="rounded-2xl gradient-soft p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Atendimentos</p>
                  <p className="mt-1 font-display text-xl font-bold">47</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Amado por <span className="text-gradient italic">profissionais</span>
            <br /> de verdade
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-3xl border border-border/60 bg-card p-6 shadow-card">
              <div className="flex gap-0.5 text-primary">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4" fill="currentColor" />)}
              </div>
              <p className="mt-4 text-sm leading-relaxed">"{t.text}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary font-display text-sm font-bold text-white">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] gradient-primary p-10 text-center text-white shadow-glow md:p-16">
          <Sparkles className="mx-auto h-8 w-8" fill="currentColor" />
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Pronta pra elevar seu studio?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/90">
            Crie sua conta em menos de 1 minuto. Sem cartão, sem complicação.
          </p>
          <Button asChild size="lg" className="mt-8 h-14 rounded-2xl bg-white text-base font-semibold text-primary hover:bg-white/90">
            <Link to="/cadastro">
              Começar agora grátis <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
