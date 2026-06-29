import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlaskConical, Wrench, AlertTriangle, CheckCircle2,
  RefreshCw, Clock, Trash2, Power, PowerOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn }       from "@/lib/utils";
import { toast }    from "sonner";
import { withSuperToken } from "@/lib/super-client";
import {
  getSystemConfigAdmin, setTestMode, setMaintenanceMode,
  type SystemConfig,
} from "@/lib/system-config.functions";

export const Route = createFileRoute("/(admin)/super/_app/sistema")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sistema — Super Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: SistemaPage,
});

function Badge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
      active ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground",
    )}>
      {active ? <CheckCircle2 className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) { setRemaining(null); return; }
    const calc = () => Math.max(0, new Date(expiresAt).getTime() - Date.now());
    setRemaining(calc());
    const iv = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);
  return remaining;
}

function formatCountdown(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// Local datetime-local min (now rounded up 1 min)
function nowDatetimeLocal() {
  const d = new Date(Date.now() + 60_000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

function SistemaPage() {
  const [config, setConfig]     = useState<SystemConfig | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  // Test mode form state
  const [testExpiry, setTestExpiry] = useState(nowDatetimeLocal());

  // Maintenance form state
  const [maintExpiry,   setMaintExpiry]   = useState(nowDatetimeLocal());
  const [maintMessage,  setMaintMessage]  = useState(
    "O sistema está passando por uma manutenção preventiva. Voltamos em breve!",
  );

  const testCountdown = useCountdown(config?.testModeExpiresAt ?? null);
  const maintCountdown = useCountdown(config?.maintenanceEndsAt ?? null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSystemConfigAdmin({ data: withSuperToken() });
      setConfig(data);
      if (data?.maintenanceMessage) setMaintMessage(data.maintenanceMessage);
    } catch (e: unknown) {
      toast.error("Erro ao carregar configurações: " + (e instanceof Error ? e.message : ""));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Invalidate client-side cache after any change
  function invalidateCache() {
    try { localStorage.removeItem("sa.sysconfig"); } catch { /* silent */ }
  }

  async function handleActivateTest() {
    if (!testExpiry) { toast.error("Defina o prazo de expiração."); return; }
    setSaving(true);
    try {
      await setTestMode({
        data: withSuperToken({ active: true, expiresAt: new Date(testExpiry).toISOString() }),
      });
      invalidateCache();
      toast.success("Modo Teste ativado com sucesso.");
      await load();
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : "Tente novamente"));
    } finally { setSaving(false); }
  }

  async function handleDeactivateTest() {
    setSaving(true);
    try {
      await setTestMode({ data: withSuperToken({ active: false }) });
      invalidateCache();
      toast.success("Modo Teste encerrado. Dados de teste excluídos.");
      await load();
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : "Tente novamente"));
    } finally { setSaving(false); }
  }

  async function handleActivateMaint() {
    if (!maintMessage.trim()) { toast.error("Informe a mensagem de manutenção."); return; }
    setSaving(true);
    try {
      await setMaintenanceMode({
        data: withSuperToken({
          active:  true,
          endsAt:  maintExpiry ? new Date(maintExpiry).toISOString() : undefined,
          message: maintMessage,
        }),
      });
      invalidateCache();
      toast.success("Modo Manutenção ativado.");
      await load();
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : "Tente novamente"));
    } finally { setSaving(false); }
  }

  async function handleDeactivateMaint() {
    setSaving(true);
    try {
      await setMaintenanceMode({ data: withSuperToken({ active: false }) });
      invalidateCache();
      toast.success("Manutenção encerrada. Sistema online.");
      await load();
    } catch (e: unknown) {
      toast.error("Erro: " + (e instanceof Error ? e.message : "Tente novamente"));
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle do Sistema</h1>
          <p className="text-sm text-muted-foreground">Modo Teste e Modo Manutenção</p>
        </div>
        <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* ── Modo Teste ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">Modo Teste</p>
              <p className="text-xs text-amber-700">Dados são isolados e excluídos ao encerrar</p>
            </div>
          </div>
          <Badge active={config?.testModeActive ?? false} />
        </div>

        {/* Info box */}
        <div className="rounded-xl border border-amber-200 bg-white/60 p-4 text-sm text-amber-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Como funciona</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-700">
            <li>Novos agendamentos, clientes e serviços são marcados com um ID de sessão de teste</li>
            <li>Ao encerrar o modo, todos os dados marcados são excluídos automaticamente</li>
            <li>Uma tarja laranja aparece no topo do app para usuários durante o teste</li>
            <li>O app funciona normalmente — apenas os dados são descartáveis</li>
          </ul>
        </div>

        {config?.testModeActive ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-amber-100 px-4 py-3 text-sm space-y-1">
              <p className="text-amber-800">
                <span className="font-semibold">Session ID:</span>{" "}
                <code className="text-xs">{config.testSessionId.slice(0, 8)}…</code>
              </p>
              {testCountdown !== null && testCountdown > 0 && (
                <p className="flex items-center gap-1.5 text-amber-700">
                  <Clock className="h-3.5 w-3.5" />
                  Expira em <span className="font-mono font-semibold">{formatCountdown(testCountdown)}</span>
                </p>
              )}
              {config.testModeExpiresAt && (
                <p className="text-xs text-amber-600">
                  Término: {new Date(config.testModeExpiresAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
            <Button
              variant="destructive"
              className="w-full gap-2"
              disabled={saving}
              onClick={handleDeactivateTest}
            >
              <Trash2 className="h-4 w-4" />
              {saving ? "Encerrando…" : "Encerrar e excluir dados de teste"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Expiração do período de teste
              </label>
              <Input
                type="datetime-local"
                value={testExpiry}
                min={nowDatetimeLocal()}
                onChange={(e) => setTestExpiry(e.target.value)}
                className="border-amber-200 bg-white focus-visible:ring-amber-400"
              />
            </div>
            <Button
              className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              disabled={saving || !testExpiry}
              onClick={handleActivateTest}
            >
              <Power className="h-4 w-4" />
              {saving ? "Ativando…" : "Ativar Modo Teste"}
            </Button>
          </div>
        )}
      </motion.div>

      {/* ── Modo Manutenção ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-orange-200 bg-orange-50 p-6 space-y-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-orange-900">Modo Manutenção Preventiva</p>
              <p className="text-xs text-orange-700">Exibe tela de manutenção para todos os usuários</p>
            </div>
          </div>
          <Badge active={config?.maintenanceModeActive ?? false} />
        </div>

        <div className="rounded-xl border border-orange-200 bg-white/60 p-4 text-sm text-orange-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Impacto</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-orange-700">
            <li>A landing page e o app exibirão tela de manutenção imediatamente</li>
            <li>O painel super admin continua acessível normalmente</li>
            <li>Usuários veem o tempo estimado de retorno e mensagem personalizada</li>
            <li>A tela se atualiza automaticamente quando o modo for encerrado</li>
          </ul>
        </div>

        {config?.maintenanceModeActive ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-orange-100 px-4 py-3 text-sm space-y-1">
              {maintCountdown !== null && maintCountdown > 0 && (
                <p className="flex items-center gap-1.5 text-orange-700">
                  <Clock className="h-3.5 w-3.5" />
                  Término em <span className="font-mono font-semibold">{formatCountdown(maintCountdown)}</span>
                </p>
              )}
              {config.maintenanceEndsAt && (
                <p className="text-xs text-orange-600">
                  Previsão: {new Date(config.maintenanceEndsAt).toLocaleString("pt-BR")}
                </p>
              )}
              <p className="text-xs text-orange-700 mt-1 italic">"{config.maintenanceMessage}"</p>
            </div>
            <Button
              className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              disabled={saving}
              onClick={handleDeactivateMaint}
            >
              <Power className="h-4 w-4" />
              {saving ? "Encerrando…" : "Encerrar Manutenção — Colocar online"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-orange-800">
                Previsão de término (opcional)
              </label>
              <Input
                type="datetime-local"
                value={maintExpiry}
                min={nowDatetimeLocal()}
                onChange={(e) => setMaintExpiry(e.target.value)}
                className="border-orange-200 bg-white focus-visible:ring-orange-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-orange-800">
                Mensagem para usuários
              </label>
              <Textarea
                value={maintMessage}
                onChange={(e) => setMaintMessage(e.target.value)}
                rows={3}
                className="border-orange-200 bg-white focus-visible:ring-orange-400 resize-none"
                placeholder="Mensagem exibida na tela de manutenção…"
              />
            </div>
            <Button
              className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              disabled={saving || !maintMessage.trim()}
              onClick={handleActivateMaint}
            >
              <Wrench className="h-4 w-4" />
              {saving ? "Ativando…" : "Ativar Manutenção Preventiva"}
            </Button>
          </div>
        )}
      </motion.div>

      {config?.updatedBy && (
        <p className="text-center text-xs text-muted-foreground">
          Última alteração por <span className="font-medium">{config.updatedBy}</span>
          {" · "}{new Date(config.updatedAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
