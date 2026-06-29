import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/mobile-shell";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/(site)/trocar-senha")({
  head: () => ({
    meta: [{ title: "Trocar senha — SuaAgenda.Pro" }],
  }),
  component: TrocarSenhaPage,
});

function TrocarSenhaPage() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha]   = useState("");
  const [confirmar, setConfirmar]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [showAtual, setShowAtual]   = useState(false);
  const [showNova, setShowNova]     = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha !== confirmar) {
      toast.error("As senhas novas não coincidem.");
      return;
    }
    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (!user?.email) {
      toast.error("Sessão expirada. Faça login novamente.");
      navigate({ to: "/login" });
      return;
    }

    setLoading(true);

    // Verify current password
    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    user.email,
      password: senhaAtual,
    });
    if (authError) {
      setLoading(false);
      toast.error("Senha atual incorreta.");
      return;
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });
    if (updateError) {
      setLoading(false);
      toast.error("Erro ao atualizar senha: " + updateError.message);
      return;
    }

    // Clear forced-change flags
    await supabase
      .from("profiles")
      .update({
        force_password_change:           false,
        password_reset_token:            null,
        password_reset_token_expires_at: null,
      })
      .eq("id", user.id);

    setLoading(false);
    toast.success("Senha atualizada com sucesso!");
    navigate({ to: "/dashboard" });
  }

  return (
    <MobileShell>
      <div className="relative flex flex-1 flex-col justify-end px-6 pb-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full gradient-hero opacity-70 blur-3xl" />
        <div className="space-y-6">
          <div className="text-center">
            <BrandLogo className="mx-auto mb-4 h-9 w-auto" />
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">Troca de senha obrigatória</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              O administrador solicitou que você crie uma nova senha para continuar.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha-atual">Senha atual</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="senha-atual"
                  type={showAtual ? "text" : "password"}
                  className="pl-9 pr-10"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAtual(!showAtual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="nova-senha"
                  type={showNova ? "text" : "password"}
                  className="pl-9 pr-10"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNova(!showNova)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Atualizando…" : "Atualizar senha"}
            </Button>
          </form>
        </div>
      </div>
    </MobileShell>
  );
}
