import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageCircle, Instagram, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — SuaAgenda.Pro" },
      { name: "description", content: "Fale com a equipe SuaAgenda.Pro. Atendimento por WhatsApp, e-mail e Instagram." },
      { property: "og:title", content: "Contato — SuaAgenda.Pro" },
      { property: "og:url", content: "/contato" },
    ],
    links: [{ rel: "canonical", href: "/contato" }],
  }),
  component: ContatoPage,
});

const channels = [
  { icon: MessageCircle, label: "WhatsApp", value: "(11) 99999-0000", href: "https://wa.me/5511999990000" },
  { icon: Mail, label: "E-mail", value: "oi@suaagenda.pro", href: "mailto:oi@suaagenda.pro" },
  { icon: Instagram, label: "Instagram", value: "@suaagenda.pro", href: "https://instagram.com" },
];

function ContatoPage() {
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Mensagem enviada!", {
        description: "A gente responde em até 1 dia útil 💕",
      });
    }, 800);
  }

  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full gradient-hero opacity-60 blur-3xl" />
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium">Contato</span>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
            Bora <span className="text-gradient italic">conversar?</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Tira dúvidas, pede uma demo ou só vem dizer oi — a gente adora ouvir.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-5 pb-24 md:grid-cols-5">
        <div className="md:col-span-2 space-y-3">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-border/60 gradient-card p-4 shadow-card transition hover:shadow-glow"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary text-white shadow-glow">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className="font-semibold">{c.value}</div>
              </div>
            </a>
          ))}
          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Horário:</strong> seg a sex, 9h às 19h.
            <br />Sábado, 9h às 13h.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="md:col-span-3 space-y-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" placeholder="Como te chamamos?" required className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="voce@email.com" required className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="studio">Studio / salão (opcional)</Label>
            <Input id="studio" name="studio" placeholder="Nome do seu negócio" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg">Mensagem</Label>
            <Textarea id="msg" name="msg" rows={5} placeholder="Conta pra gente como podemos te ajudar..." required className="rounded-xl" />
          </div>
          <Button type="submit" disabled={sending} size="lg" className="h-12 w-full rounded-2xl gradient-primary text-white shadow-glow">
            {sending ? "Enviando..." : (<>Enviar mensagem <Send className="ml-2 h-4 w-4" /></>)}
          </Button>
        </form>
      </section>
    </SiteShell>
  );
}
