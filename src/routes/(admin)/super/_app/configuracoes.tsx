import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, Eye, EyeOff, CheckCircle2, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { withSuperToken } from "@/lib/super-client";
import { getSettings, updateSettings, testApiConnection, getEnvStatus } from "@/lib/super-settings.functions";

export const Route = createFileRoute("/(admin)/super/_app/configuracoes")({
  ssr: false,
  head: () => ({ meta: [{ title: "Configurações — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ConfiguracoesPage,
});

type Settings = Record<string, string>;

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-border pb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

function EnvKeyRow({ keyName, configured }: { keyName: string; configured: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
      <div>
        <p className="font-mono text-xs font-semibold">{keyName}</p>
        <p className="text-[11px] text-muted-foreground">Configure no arquivo .env</p>
      </div>
      {configured
        ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Configurado</span>
        : <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Não configurado</span>
      }
    </div>
  );
}

function ConfiguracoesPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState<Record<string, boolean>>({});
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({ ASAAS_API_KEY: false, RESEND_API_KEY: false, EVOLUTION_API_URL: false, EVOLUTION_API_KEY: false, HOSTINGER_API_TOKEN: false });

  useEffect(() => {
    getSettings({ data: withSuperToken() })
      .then((s) => { setSettings(s); setLoading(false); })
      .catch((e) => { toast.error(e.message); setLoading(false); });
    getEnvStatus({ data: withSuperToken() })
      .then((s) => setEnvStatus(s))
      .catch((e) => toast.error("Erro ao ler .env: " + e.message));
  }, []);

  function set(key: string, val: string) { setSettings((p) => ({ ...p, [key]: val })); }
  function toggle(key: string) { setSettings((p) => ({ ...p, [key]: p[key] === "true" ? "false" : "true" })); }

  async function save() {
    setSaving(true);
    try {
      await updateSettings({ data: withSuperToken({ settings }) });
      toast.success("Configurações salvas com sucesso");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally { setSaving(false); }
  }

  async function testApi(api: "asaas" | "resend" | "evolution") {
    setTesting((p) => ({ ...p, [api]: true }));
    try {
      const r = await testApiConnection({ data: withSuperToken({ api }) });
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setTesting((p) => ({ ...p, [api]: false })); }
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground animate-pulse">Carregando configurações…</div>;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <header className="border-b border-border pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Sistema</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Configurações</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Ajuste os parâmetros da plataforma e integrações.</p>
      </header>

      {/* Geral */}
      <section className="space-y-5">
        <SectionHeader title="Geral" description="Informações básicas da plataforma" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome da plataforma</Label>
            <Input value={settings.platform_name ?? ""} onChange={(e) => set("platform_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>URL do App</Label>
            <Input value={settings.app_url ?? ""} onChange={(e) => set("app_url", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp de suporte</Label>
            <Input placeholder="5511999999999" value={settings.support_whatsapp ?? ""} onChange={(e) => set("support_whatsapp", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail de suporte</Label>
            <Input type="email" value={settings.support_email ?? ""} onChange={(e) => set("support_email", e.target.value)} />
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="space-y-5">
        <SectionHeader title="Planos & Preços" description="Configuração dos planos disponíveis" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Duração do trial (dias)</Label>
            <Input type="number" min={1} max={30} value={settings.trial_days ?? "7"} onChange={(e) => set("trial_days", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Preço do Premium (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={settings.premium_price_cents ? (parseInt(settings.premium_price_cents) / 100).toFixed(2) : "49.90"}
              onChange={(e) => set("premium_price_cents", String(Math.round(parseFloat(e.target.value) * 100)))}
            />
          </div>
        </div>
      </section>

      {/* Notificações */}
      <section className="space-y-5">
        <SectionHeader title="Notificações" description="Habilitar/desabilitar canais de notificação automática" />
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium text-sm">Notificações por E-mail</p>
              <p className="text-xs text-muted-foreground">Usa Resend para envio de emails transacionais</p>
            </div>
            <Switch checked={settings.notifications_email === "true"} onCheckedChange={() => toggle("notifications_email")} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium text-sm">Notificações por WhatsApp</p>
              <p className="text-xs text-muted-foreground">Usa Evolution API para mensagens automáticas</p>
            </div>
            <Switch checked={settings.notifications_whatsapp === "true"} onCheckedChange={() => toggle("notifications_whatsapp")} />
          </div>
          {settings.notifications_whatsapp === "true" && (
            <div className="space-y-1.5">
              <Label>Nome da instância Evolution</Label>
              <Input value={settings.evolution_instance ?? ""} onChange={(e) => set("evolution_instance", e.target.value)} />
            </div>
          )}
          {settings.asaas_env !== undefined && (
            <div className="space-y-1.5">
              <Label>Ambiente Asaas</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.asaas_env ?? "sandbox"}
                onChange={(e) => set("asaas_env", e.target.value)}
              >
                <option value="sandbox">Sandbox (testes)</option>
                <option value="production">Produção</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* API Keys */}
      <section className="space-y-5">
        <SectionHeader title="Chaves de API" description="Configuradas no arquivo .env do servidor — não armazenadas no banco" />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Edite o arquivo <code className="font-mono">.env</code> na raiz do projeto e reinicie o servidor para aplicar as chaves. Chaves Asaas começam com <code className="font-mono">$</code> — use <code className="font-mono">\$</code> no .env (ex: <code className="font-mono">ASAAS_API_KEY=&quot;\$aact_...&quot;</code>).</span>
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <EnvKeyRow keyName="ASAAS_API_KEY" configured={envStatus.ASAAS_API_KEY} />
            <Button size="sm" variant="outline" disabled={testing.asaas || !envStatus.ASAAS_API_KEY} onClick={() => testApi("asaas")}>
              {testing.asaas ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Testar Asaas
            </Button>
          </div>
          <div className="space-y-2">
            <EnvKeyRow keyName="RESEND_API_KEY" configured={envStatus.RESEND_API_KEY} />
            <Button size="sm" variant="outline" disabled={testing.resend || !envStatus.RESEND_API_KEY} onClick={() => testApi("resend")}>
              {testing.resend ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Testar Resend
            </Button>
          </div>
          <div className="space-y-2">
            <EnvKeyRow keyName="EVOLUTION_API_URL" configured={envStatus.EVOLUTION_API_URL} />
            <EnvKeyRow keyName="EVOLUTION_API_KEY" configured={envStatus.EVOLUTION_API_KEY} />
            <Button size="sm" variant="outline" disabled={testing.evolution || !envStatus.EVOLUTION_API_URL} onClick={() => testApi("evolution")}>
              {testing.evolution ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Testar Evolution
            </Button>
          </div>
        </div>
      </section>

      <div className="flex justify-end border-t border-border pt-6">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "Salvando…" : "Salvar configurações"}
        </Button>
      </div>
    </div>
  );
}
