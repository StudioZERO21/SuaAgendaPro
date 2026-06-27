import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldOff,
  Loader2,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSuperToken } from "@/lib/super-auth";
import {
  superAdminGetMfaStatus,
  superAdminGenerateTotpSetup,
  superAdminActivateMfa,
  superAdminDeactivateMfa,
} from "@/lib/super-auth.server";

export const Route = createFileRoute("/(admin)/super/_app/mfa-setup")({
  head: () => ({
    meta: [
      { title: "Verificação em 2 Fatores — Super Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MfaSetupPage,
});

type Phase = "loading" | "inactive" | "scanning" | "confirming" | "active" | "disabling";
type SetupData = { secret: string; uri: string; email: string };

function MfaSetupPage() {
  const token = getSuperToken();

  const [phase, setPhase]     = useState<Phase>("loading");
  const [setup, setSetup]     = useState<SetupData | null>(null);
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  // Carrega status atual do MFA ao abrir a página
  useEffect(() => {
    if (!token) return;
    superAdminGetMfaStatus({ data: { _st: token } })
      .then(({ enabled, email }) => {
        setAdminEmail(email);
        setPhase(enabled ? "active" : "inactive");
      })
      .catch(() => setPhase("inactive"));
  }, [token]);

  // Passo 1: gerar QR code (secret temporário, ainda não salvo)
  async function handleStartSetup() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await superAdminGenerateTotpSetup({ data: { _st: token } });
      setSetup(data);
      setCode("");
      setPhase("scanning");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao gerar QR code");
    } finally {
      setLoading(false);
    }
  }

  // Passo 2: confirmar código → salva no banco automaticamente
  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !setup) return;
    setLoading(true);
    try {
      await superAdminActivateMfa({
        data: { _st: token, secret: setup.secret, totpCode: code },
      });
      setPhase("active");
      toast.success("2FA ativado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message ?? "Código incorreto");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  // Desativar MFA
  async function handleDeactivate() {
    if (!token) return;
    setLoading(true);
    try {
      await superAdminDeactivateMfa({ data: { _st: token } });
      setSetup(null);
      setCode("");
      setPhase("inactive");
      toast.success("2FA desativado.");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao desativar 2FA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8 px-4">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-violet-600" />
          Verificação em 2 Fatores
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Proteja o acesso ao painel com um código temporário gerado pelo
          Google Authenticator ou Authy.
        </p>
      </div>

      {/* ── Carregando ── */}
      {phase === "loading" && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── 2FA inativo ── */}
      {phase === "inactive" && (
        <div className="rounded-2xl border p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-muted p-3">
              <ShieldOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">2FA desativado</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Seu acesso está protegido apenas por senha. Ative o 2FA para
                adicionar uma segunda camada de segurança.
              </p>
            </div>
          </div>
          <Button
            onClick={handleStartSetup}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground h-11"
          >
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando…</>
              : <><ShieldCheck className="mr-2 h-4 w-4" />Ativar 2FA</>
            }
          </Button>
        </div>
      )}

      {/* ── QR code para escanear ── */}
      {phase === "scanning" && setup && (
        <div className="space-y-5">
          <div className="rounded-2xl border p-6 space-y-4">
            <p className="font-semibold text-center">
              Escaneie no app autenticador
            </p>
            <div className="flex justify-center rounded-xl bg-white p-5">
              <QRCode value={setup.uri} size={220} />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Abra o <strong>Google Authenticator</strong> ou <strong>Authy</strong>,
              toque em <strong>+</strong> e escaneie o código acima.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPhase("inactive")}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => setPhase("confirming")}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              Já escaniei →
            </Button>
          </div>
        </div>
      )}

      {/* ── Confirmar com o primeiro código ── */}
      {phase === "confirming" && setup && (
        <div className="space-y-5">
          <div className="rounded-2xl border p-6 space-y-4">
            <div className="text-center space-y-1">
              <p className="font-semibold">Digite o código do app</p>
              <p className="text-sm text-muted-foreground">
                Informe os 6 dígitos que aparecem para{" "}
                <strong>SuaAgenda Super Admin</strong> no seu autenticador.
              </p>
            </div>
            <form onSubmit={handleConfirm} className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000 000"
                className="text-center font-mono text-3xl tracking-[0.6em] h-14"
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPhase("scanning")}
                  disabled={loading}
                  className="flex-1"
                >
                  ← Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex-1 gradient-primary text-primary-foreground"
                >
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : "Confirmar e ativar"
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2FA ativo ── */}
      {phase === "active" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">
                  2FA ativo
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {adminEmail && <span className="font-mono">{adminEmail}</span>}
                  {" "}está protegido com verificação em 2 etapas.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Ao desativar, o login voltará a exigir apenas senha. Você pode
                reativar a qualquer momento.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={phase === "active" ? () => setPhase("disabling") : undefined}
              className="w-full border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
            >
              <ShieldOff className="mr-2 h-4 w-4" /> Desativar 2FA
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleStartSetup}
            disabled={loading}
            className="w-full"
          >
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando…</>
              : "Reconfigurar (trocar app autenticador)"
            }
          </Button>
        </div>
      )}

      {/* ── Confirmação de desativação ── */}
      {phase === "disabling" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">
                Confirmar desativação do 2FA
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Seu acesso ficará protegido apenas por senha até você reativar.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPhase("active")}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeactivate}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : "Sim, desativar"
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
