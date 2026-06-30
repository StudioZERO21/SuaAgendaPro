import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/mobile-shell";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import { validatePasswordResetToken, resetPasswordWithToken } from "@/lib/password-reset.functions";

export const Route = createFileRoute("/(site)/redefinir-senha")({
  head: () => ({
    meta: [{ title: "Redefinir senha — SuaAgenda.Pro" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) ?? "" }),
  component: RedefinirSenhaPage,
});

function RedefinirSenhaPage() {
  const navigate  = useNavigate();
  const { token } = Route.useSearch();
  const [status, setStatus]   = useState<"loading" | "valid" | "invalid">("loading");
  const [reason, setReason]   = useState("");
  const [novaSenha, setNova]  = useState("");
  const [confirmar, setConf]  = useState("");
  const [showPass, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); setReason("Link inválido."); return; }
    validatePasswordResetToken({ data: { token } })
      .then((r) => {
        if (r.valid) setStatus("valid");
        else { setStatus("invalid"); setReason(r.reason ?? "Link inválido."); }
      })
      .catch(() => { setStatus("invalid"); setReason("Erro ao validar o link. Tente novamente."); });
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha !== confirmar) { toast.error("As senhas não coincidem."); return; }
    if (novaSenha.length < 6)   { toast.error("A senha deve ter ao menos 6 caracteres."); return; }
    setLoading(true);
    try {
      await resetPasswordWithToken({ data: { token, newPassword: novaSenha } });
      setDone(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Validando link…</p>
        </div>
      </MobileShell>
    );
  }

  if (status === "invalid") {
    return (
      <MobileShell>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600">
            <XCircle className="h-7 w-7" />
          </div>
          <h1 className="font-display text-xl font-bold">Link inválido</h1>
          <p className="mt-2 text-sm text-muted-foreground">{reason}</p>
          <Button className="mt-6" onClick={() => navigate({ to: "/login" })}>
            Ir para o login
          </Button>
        </div>
      </MobileShell>
    );
  }

  if (done) {
    return (
      <MobileShell>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="font-display text-xl font-bold">Senha atualizada!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua senha foi redefinida com sucesso. Faça login com a nova senha.
          </p>
          <Button className="mt-6" onClick={() => navigate({ to: "/login" })}>
            Ir para o login
          </Button>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="relative flex flex-1 flex-col justify-end px-6 pb-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full gradient-hero opacity-70 blur-3xl" />
        <div className="space-y-6">
          <div>
            <BrandLogo variant="horizontal" size="sm" className="mb-4" />
            <h1 className="font-display text-2xl font-bold">Defina sua nova senha</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie uma senha segura para continuar acessando o SuaAgenda.Pro.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="nova-senha"
                  type={showPass ? "text" : "password"}
                  className="pl-9 pr-10"
                  value={novaSenha}
                  onChange={(e) => setNova(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmar-senha"
                  type="password"
                  className="pl-9"
                  value={confirmar}
                  onChange={(e) => setConf(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando…" : "Salvar nova senha"}
            </Button>
          </form>
        </div>
      </div>
    </MobileShell>
  );
}
