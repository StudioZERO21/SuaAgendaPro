import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSuperToken } from "@/lib/super-auth";
import {
  superAdminGenerateTotpSetup,
  superAdminConfirmTotpSetup,
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

type Phase = "idle" | "scanning" | "confirming" | "done";
type SetupData = { secret: string; uri: string; email: string };

function MfaSetupPage() {
  const token = getSuperToken();

  const [phase, setPhase]   = useState<Phase>("idle");
  const [setup, setSetup]   = useState<SetupData | null>(null);
  const [code, setCode]     = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleActivate() {
    if (!token) { toast.error("Sessão inválida. Faça login novamente."); return; }
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

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !setup) return;
    setLoading(true);
    try {
      await superAdminConfirmTotpSetup({
        data: { _st: token, secret: setup.secret, totpCode: code },
      });
      setPhase("done");
      toast.success("Código validado! Copie o secret para o .env da VPS.");
    } catch (err: any) {
      toast.error(err?.message ?? "Código incorreto");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    if (!setup) return;
    navigator.clipboard.writeText(setup.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setPhase("idle");
    setSetup(null);
    setCode("");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-8 px-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-violet-600" />
          Autenticação em 2 Fatores (2FA)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Proteja o acesso ao painel com um código temporário gerado pelo Google
          Authenticator, Authy ou qualquer app TOTP.
        </p>
      </div>

      {/* ── IDLE: botão de ativar ── */}
      {phase === "idle" && (
        <div className="rounded-2xl border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldOff className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-semibold">2FA ainda não configurado</p>
              <p className="text-sm text-muted-foreground">
                Clique em <strong>Ativar</strong> para gerar um QR code e vinculá-lo
                ao seu app autenticador.
              </p>
            </div>
          </div>
          <Button
            onClick={handleActivate}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando…</>
            ) : (
              <><ShieldCheck className="mr-2 h-4 w-4" /> Ativar 2FA</>
            )}
          </Button>
        </div>
      )}

      {/* ── SCANNING: QR code + chave manual ── */}
      {phase === "scanning" && setup && (
        <div className="space-y-6">
          <div className="rounded-2xl border p-6 space-y-4">
            <p className="font-semibold text-center">Passo 1 — Escaneie o QR code</p>
            <div className="flex justify-center rounded-xl bg-white p-5">
              <QRCode value={setup.uri} size={210} />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Abra o Google Authenticator ou Authy, toque em <strong>+</strong> e
              escaneie o código acima.
            </p>
          </div>

          {/* Chave manual (fallback) */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Prefere digitar manualmente?
            </Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={setup.secret}
                className="font-mono text-sm tracking-widest"
              />
              <Button variant="outline" size="icon" onClick={copySecret} title="Copiar chave">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => setPhase("confirming")}
            variant="default"
          >
            Já escaniei — confirmar código →
          </Button>
          <button
            type="button"
            onClick={reset}
            className="block w-full text-center text-sm text-muted-foreground hover:underline underline-offset-4"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* ── CONFIRMING: inserir primeiro código ── */}
      {phase === "confirming" && setup && (
        <div className="space-y-6">
          <div className="rounded-2xl border p-6 space-y-5">
            <div className="text-center space-y-1">
              <p className="font-semibold">Passo 2 — Confirme com o primeiro código</p>
              <p className="text-sm text-muted-foreground">
                Abra o app autenticador e informe o código de 6 dígitos que aparece
                para <strong>SuaAgenda Super Admin</strong>.
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DONE: secret para copiar ao .env ── */}
      {phase === "done" && setup && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 space-y-5 dark:border-green-900 dark:bg-green-950/30">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">
                2FA configurado com sucesso!
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Adicione o secret abaixo ao <code className="rounded bg-green-100 dark:bg-green-900 px-1">.env</code> da VPS e reinicie o container.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Secret TOTP (copie para o .env)</Label>
            <div className="flex gap-2">
              <Input readOnly value={setup.secret} className="font-mono text-sm tracking-widest" />
              <Button variant="outline" size="icon" onClick={copySecret}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900 text-slate-300 text-xs font-mono p-4 space-y-0.5 select-all">
            <p className="text-slate-500"># Cole no .env (substitua os valores):</p>
            <p>SUPER_ADMINS='[&#123;</p>
            <p className="pl-4">"email": "{setup.email}",</p>
            <p className="pl-4">"password": "SUA_SENHA_ATUAL",</p>
            <p className="pl-4 text-green-400">"totpSecret": "{setup.secret}"</p>
            <p>&#125;]'</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Após salvar o .env e reiniciar o container, o login passará a exigir o
            código do autenticador na segunda etapa.
          </p>

          <Button variant="outline" onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Gerar novo secret
          </Button>
        </div>
      )}
    </div>
  );
}
