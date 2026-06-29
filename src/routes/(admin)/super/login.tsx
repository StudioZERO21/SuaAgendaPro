import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldAlert, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSuperAuth, setSuperToken } from "@/lib/super-auth";
import {
  superAdminLogin,
  superAdminVerifyMfa,
  superAdminForcedChangePassword,
} from "@/lib/super-auth.server";
import logoUrl from "@/assets/logo-suaagenda.png";

export const Route = createFileRoute("/(admin)/super/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Super Admin" },
      { name: "description", content: "Acesso ao painel do super administrador." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SuperLoginPage,
});

type Step = "credentials" | "mfa" | "change-password";

function SuperLoginPage() {
  const navigate  = useNavigate();
  const [step, setStep]           = useState<Step>("credentials");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const [totp, setTotp]           = useState("");
  const [newPassword, setNewPassword]   = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]     = useState(false);
  const totpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (getSuperAuth()) navigate({ to: "/super", replace: true });
  }, [navigate]);

  // Foca no input de TOTP quando entrar no step 2
  useEffect(() => {
    if (step === "mfa") setTimeout(() => totpRef.current?.focus(), 100);
  }, [step]);

  async function onSubmitCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Informe e-mail e senha");
      return;
    }
    setLoading(true);
    try {
      const result = await superAdminLogin({
        data: { email: email.trim(), password },
      });

      if (result.mustChangePassword) {
        setPendingToken(result.pendingToken);
        setStep("change-password");
      } else if (result.mfaRequired) {
        setPendingToken(result.pendingToken);
        setStep("mfa");
      } else if (result.token) {
        setSuperToken(result.token);
        toast.success("Bem-vindo ao painel Super Admin");
        navigate({ to: "/super", replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error("A senha deve ter pelo menos 8 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
    setLoading(true);
    try {
      const { token } = await superAdminForcedChangePassword({
        data: { pendingToken, newPassword },
      });
      setSuperToken(token);
      toast.success("Senha alterada com sucesso! Bem-vindo ao painel.");
      navigate({ to: "/super", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao alterar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitMfa(e: React.FormEvent) {
    e.preventDefault();
    const code = totp.replace(/\s/g, "");
    if (code.length !== 6) {
      toast.error("Informe os 6 dígitos do código");
      return;
    }
    setLoading(true);
    try {
      const { token } = await superAdminVerifyMfa({
        data: { pendingToken, totpCode: code },
      });
      setSuperToken(token);
      toast.success("Bem-vindo ao painel Super Admin");
      navigate({ to: "/super", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Código inválido");
      setTotp("");
      totpRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-background lg:grid-cols-[7fr_3fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#1f1230] via-[#2a1530] to-[#4c1d95] lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 backdrop-blur">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">
              SuaAgenda.Pro
            </p>
            <p className="font-display text-lg font-bold">Super Admin</p>
          </div>
        </div>
        <div className="relative z-10 max-w-lg">
          <h1 className="font-display text-5xl font-bold leading-tight lg:text-6xl">
            Controle total da plataforma.
          </h1>
          <p className="mt-6 text-lg text-white/70 lg:text-xl">
            Gerencie profissionais, permissões e configurações globais a partir
            de um único painel.
          </p>
        </div>
        <p className="relative z-10 text-[11px] text-white/40">
          Acesso restrito • Todas as ações são auditadas
        </p>
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </aside>

      {/* Form */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-8 lg:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex flex-col items-center">
            <img src={logoUrl} alt="SuaAgenda.Pro" className="h-32 w-auto object-contain" />
          </div>

          {step === "change-password" ? (
            <>
              <div className="mb-8 space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
                  <KeyRound className="h-7 w-7 text-amber-600" />
                </div>
                <h2 className="font-display text-2xl font-bold">Defina sua senha</h2>
                <p className="text-sm text-muted-foreground">
                  Por segurança, você precisa criar uma nova senha antes de continuar.
                </p>
              </div>
              <form onSubmit={onSubmitChangePassword} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoFocus
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="h-12 w-full rounded-xl gradient-primary font-semibold text-primary-foreground shadow-glow"
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…</> : "Salvar nova senha e entrar"}
                </Button>
              </form>
            </>
          ) : step === "credentials" ? (
            <>
              <div className="mb-8 space-y-3 text-center">
                <h2 className="font-display text-2xl font-bold">Entrar no painel</h2>
                <p className="text-sm text-muted-foreground">
                  Use suas credenciais de super administrador.
                </p>
              </div>
              <form onSubmit={onSubmitCredentials} className="space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@suaagenda.pro"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="h-12 w-full rounded-xl gradient-primary font-semibold text-primary-foreground shadow-glow"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando…</>
                  ) : (
                    "Entrar"
                  )}
                </Button>
                <p className="pt-1 text-center text-[11px] text-muted-foreground">
                  Acesso restrito · Todas as ações são auditadas
                </p>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8 space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/40">
                  <ShieldCheck className="h-7 w-7 text-violet-600" />
                </div>
                <h2 className="font-display text-2xl font-bold">Verificação em 2 etapas</h2>
                <p className="text-sm text-muted-foreground">
                  Abra seu app autenticador e informe o código de 6 dígitos.
                </p>
              </div>
              <form onSubmit={onSubmitMfa} className="space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="totp">Código do autenticador</Label>
                  <Input
                    ref={totpRef}
                    id="totp"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={totp}
                    onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || totp.length !== 6}
                  className="h-12 w-full rounded-xl gradient-primary font-semibold text-primary-foreground shadow-glow"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando…</>
                  ) : (
                    "Confirmar"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep("credentials"); setTotp(""); }}
                  className="block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Voltar ao login
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
