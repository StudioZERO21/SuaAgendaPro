import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Copy, Check, Loader2, RefreshCw } from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSuperAuth } from "@/lib/super-auth";
import {
  superAdminGenerateTotpSetup,
  superAdminConfirmTotpSetup,
} from "@/lib/super-auth.server";

export const Route = createFileRoute("/(admin)/super/_app/mfa-setup")({
  head: () => ({
    meta: [
      { title: "Configurar 2FA — Super Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MfaSetupPage,
});

type SetupData = { secret: string; uri: string; email: string };

function MfaSetupPage() {
  const token = getSuperAuth();
  const [setup, setSetup]       = useState<SetupData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [code, setCode]         = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied]     = useState(false);

  async function generate() {
    if (!token) return;
    setLoading(true);
    setSetup(null);
    setConfirmed(false);
    setCode("");
    try {
      const data = await superAdminGenerateTotpSetup({ data: { _st: token } });
      setSetup(data);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao gerar setup");
    } finally {
      setLoading(false);
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !setup) return;
    setLoading(true);
    try {
      await superAdminConfirmTotpSetup({
        data: { _st: token, secret: setup.secret, totpCode: code },
      });
      setConfirmed(true);
      toast.success("Código validado! Copie o secret abaixo para o .env");
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

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8 px-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-violet-600" />
          Configurar autenticação em 2 fatores
        </h1>
        <p className="text-sm text-muted-foreground">
          Gere um QR code, escaneie no Google Authenticator ou Authy, confirme
          com o primeiro código e copie o secret para o arquivo <code className="rounded bg-muted px-1">.env</code>.
        </p>
      </div>

      {!setup && !confirmed && (
        <Button onClick={generate} disabled={loading} className="w-full">
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando…</>
          ) : (
            "Gerar QR code"
          )}
        </Button>
      )}

      {setup && !confirmed && (
        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-white p-6">
            <QRCode value={setup.uri} size={200} />
            <p className="text-center text-xs text-muted-foreground">
              Escaneie com Google Authenticator, Authy ou qualquer app TOTP.
            </p>
          </div>

          {/* Secret manual */}
          <div className="space-y-2">
            <Label>Chave manual (se não conseguir escanear)</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={setup.secret}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={copySecret}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Confirmar com primeiro código */}
          <form onSubmit={confirm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Confirme com o primeiro código do app</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center font-mono text-2xl tracking-[0.5em]"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={generate}
                disabled={loading}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Gerar novo
              </Button>
              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 gradient-primary text-primary-foreground"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {confirmed && setup && (
        <div className="space-y-6 rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950/30">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">
                2FA configurado com sucesso!
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Adicione o secret abaixo ao <code className="rounded bg-green-100 dark:bg-green-900 px-1">.env</code> da VPS.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Secret TOTP — copie para o .env</Label>
            <div className="flex gap-2">
              <Input readOnly value={setup.secret} className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={copySecret}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900 p-4 text-xs text-slate-300 font-mono space-y-1">
            <p className="text-slate-500"># Formato no .env (array JSON):</p>
            <p>SUPER_ADMINS='[&#123;</p>
            <p className="pl-4">"email": "{setup.email}",</p>
            <p className="pl-4">"password": "SUA_SENHA",</p>
            <p className="pl-4 text-green-400">"totpSecret": "{setup.secret}"</p>
            <p>&#125;]'</p>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ Não compartilhe este secret. Após salvar no .env e reiniciar o
            container, o login exigirá o código do autenticador.
          </p>

          <Button
            variant="outline"
            onClick={generate}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Gerar novo (substituir)
          </Button>
        </div>
      )}
    </div>
  );
}
