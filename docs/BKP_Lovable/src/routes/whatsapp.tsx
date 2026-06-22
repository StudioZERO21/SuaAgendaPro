import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Trash2,
  Send,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp — SuaAgenda.Pro" },
      { name: "description", content: "Conecte o seu WhatsApp para falar com as clientes." },
    ],
  }),
  component: WhatsAppPage,
});

const STORAGE_KEY = "sap.whatsapp.config.v1";

type WhatsAppConfig = {
  countryCode: string;
  phone: string;
  greeting: string;
  connectedAt?: string;
};

const DEFAULT_GREETING =
  "Oi! 💖 Aqui é da equipe do Studio Beleza. Como posso te ajudar hoje?";

function onlyDigits(v: string) {
  return v.replace(/\D+/g, "");
}

function formatBrPhone(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function buildWaLink(countryCode: string, phoneDigits: string, message: string) {
  const number = `${countryCode}${phoneDigits}`;
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

function WhatsAppPage() {
  const [country, setCountry] = useState("55");
  const [phone, setPhone] = useState("");
  const [greeting, setGreeting] = useState(DEFAULT_GREETING);
  const [connected, setConnected] = useState<WhatsAppConfig | null>(null);

  // Quick-send to client
  const [clientPhone, setClientPhone] = useState("");
  const [clientMsg, setClientMsg] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const c = JSON.parse(raw) as WhatsAppConfig;
        setCountry(c.countryCode || "55");
        setPhone(c.phone || "");
        setGreeting(c.greeting || DEFAULT_GREETING);
        if (c.connectedAt) setConnected(c);
      }
    } catch {}
  }, []);

  const digits = useMemo(() => onlyDigits(phone), [phone]);
  const isValid = digits.length >= 10 && digits.length <= 11;
  const myWaLink = buildWaLink(country, digits, greeting);

  const clientDigits = useMemo(() => onlyDigits(clientPhone), [clientPhone]);
  const clientValid = clientDigits.length >= 10 && clientDigits.length <= 11;
  const clientWaLink = buildWaLink(country, clientDigits, clientMsg);

  function handleConnect() {
    if (!isValid) {
      toast.error("Número inválido", { description: "Inclua DDD + número (10 ou 11 dígitos)." });
      return;
    }
    const cfg: WhatsAppConfig = {
      countryCode: country,
      phone: digits,
      greeting: greeting.trim() || DEFAULT_GREETING,
      connectedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    setConnected(cfg);
    toast.success("WhatsApp conectado!", {
      description: "O app vai abrir conversas direto no seu WhatsApp.",
    });
  }

  function handleSave() {
    if (!isValid) {
      toast.error("Número inválido");
      return;
    }
    const cfg: WhatsAppConfig = {
      countryCode: country,
      phone: digits,
      greeting: greeting.trim() || DEFAULT_GREETING,
      connectedAt: connected?.connectedAt ?? new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    setConnected(cfg);
    toast.success("Alterações salvas");
  }

  function handleDisconnect() {
    localStorage.removeItem(STORAGE_KEY);
    setConnected(null);
    toast.message("WhatsApp desconectado");
  }

  function handleCopy(link: string) {
    navigator.clipboard.writeText(link).then(() => toast.success("Link copiado!"));
  }

  function openInWhatsApp(link: string) {
    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <MobileShell>
      <header className="flex items-center gap-3 px-5 pt-6">
        <Link
          to="/mais"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-card"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Conta
          </p>
          <h1 className="font-display text-2xl font-bold leading-tight">WhatsApp</h1>
        </div>
      </header>

      <main className="mt-5 flex-1 space-y-5 px-5 pb-10">
        {/* Status */}
        <section
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-glow"
          style={{
            background: connected
              ? "linear-gradient(145deg, #16a34a 0%, #15803d 50%, #14532d 100%)"
              : "linear-gradient(145deg, #64748b 0%, #475569 50%, #334155 100%)",
          }}
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-md">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold leading-tight">
                {connected ? "WhatsApp conectado" : "WhatsApp não conectado"}
              </p>
              <p className="mt-1 text-xs text-white/80">
                {connected
                  ? `+${connected.countryCode} ${formatBrPhone(connected.phone)}`
                  : "Conecte seu número para falar com as clientes pelo app."}
              </p>
              {connected && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-white/20">
                  <CheckCircle2 className="h-3 w-3" /> Ativo
                </span>
              )}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-soft text-primary">
              <Smartphone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Integração direta com o app</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Não precisamos do seu login. O SuaAgenda abre o <strong>WhatsApp instalado
                no seu celular</strong> com a conversa e a mensagem já preparadas — basta
                tocar em Enviar. Funciona com WhatsApp normal e WhatsApp Business.
              </p>
            </div>
          </div>
        </section>

        {/* Meu número */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Meu número
          </p>

          <div>
            <Label htmlFor="country" className="text-xs font-semibold">País (DDI)</Label>
            <div className="mt-1 flex items-center gap-2">
              <span className="flex h-11 items-center rounded-xl border border-border bg-secondary px-3 text-sm font-semibold">
                +
              </span>
              <Input
                id="country"
                inputMode="numeric"
                maxLength={4}
                value={country}
                onChange={(e) => setCountry(onlyDigits(e.target.value).slice(0, 4))}
                className="h-11 w-20"
              />
              <span className="text-xs text-muted-foreground">Brasil = 55</span>
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-xs font-semibold">Número com DDD</Label>
            <Input
              id="phone"
              inputMode="tel"
              placeholder="(11) 99999-9999"
              value={formatBrPhone(digits)}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 h-11"
            />
          </div>

          <div>
            <Label htmlFor="greeting" className="text-xs font-semibold">
              Mensagem padrão de boas-vindas
            </Label>
            <Textarea
              id="greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value.slice(0, 280))}
              rows={3}
              className="mt-1 resize-none"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Aparece pré-preenchida quando a cliente abrir a conversa. {greeting.length}/280
            </p>
          </div>

          {connected ? (
            <div className="space-y-2">
              <Button
                onClick={handleSave}
                disabled={!isValid}
                className="h-11 w-full rounded-xl gradient-primary font-semibold shadow-glow"
              >
                Salvar alterações
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleCopy(myWaLink)}
                  variant="outline"
                  className="h-11 rounded-xl font-semibold"
                >
                  <Copy className="mr-2 h-4 w-4" /> Copiar link
                </Button>
                <Button
                  onClick={() => openInWhatsApp(myWaLink)}
                  variant="outline"
                  className="h-11 rounded-xl font-semibold"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Abrir app
                </Button>
              </div>
              <Button
                onClick={handleDisconnect}
                variant="ghost"
                className="h-11 w-full rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Desconectar WhatsApp
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={!isValid}
              className="h-12 w-full rounded-xl gradient-primary font-semibold shadow-glow"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Conectar WhatsApp
            </Button>
          )}
        </section>

        {/* Quick send to client */}
        {connected && (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Falar com uma cliente
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Vai abrir o WhatsApp no seu celular com a conversa pronta.
              </p>
            </div>

            <div>
              <Label htmlFor="cphone" className="text-xs font-semibold">
                Número da cliente (com DDD)
              </Label>
              <Input
                id="cphone"
                inputMode="tel"
                placeholder="(11) 99999-9999"
                value={formatBrPhone(clientDigits)}
                onChange={(e) => setClientPhone(e.target.value)}
                className="mt-1 h-11"
              />
            </div>

            <div>
              <Label htmlFor="cmsg" className="text-xs font-semibold">Mensagem</Label>
              <Textarea
                id="cmsg"
                value={clientMsg}
                onChange={(e) => setClientMsg(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Ex: Oi Ana! Seu horário de amanhã às 14h está confirmado 💕"
                className="mt-1 resize-none"
              />
            </div>

            <Button
              onClick={() => openInWhatsApp(clientWaLink)}
              disabled={!clientValid}
              className="h-12 w-full rounded-xl gradient-primary font-semibold shadow-glow"
            >
              <Send className="mr-2 h-4 w-4" /> Abrir conversa no WhatsApp
            </Button>
          </section>
        )}

        {connected && (
          <section className="rounded-2xl border border-border bg-secondary/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Seu link público (para receber mensagens)
            </p>
            <p className="mt-1 break-all text-xs text-foreground/80">{myWaLink}</p>
          </section>
        )}
      </main>
    </MobileShell>
  );
}
