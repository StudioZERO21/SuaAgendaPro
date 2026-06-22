import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSuperAuth, setSuperAuth } from "@/lib/super-auth";
import logoAsset from "@/assets/logo-suaagenda.png.asset.json";

export const Route = createFileRoute("/super/login")({
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

function SuperLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@suaagenda.pro");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getSuperAuth()) {
      navigate({ to: "/super", replace: true });
    }
  }, [navigate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Informe e-mail e senha");
      return;
    }
    setLoading(true);
    // Mock auth: aceita qualquer combinação.
    setTimeout(() => {
      setSuperAuth(email.trim());
      toast.success("Bem-vindo ao painel Super");
      navigate({ to: "/super", replace: true });
    }, 600);
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-background lg:grid-cols-[7fr_3fr]">
      {/* Brand panel — só aparece em telas largas */}
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

        {/* Decorative blurs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </aside>

      {/* Form */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-8 lg:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex flex-col items-center">
            <img
              src={logoAsset.url}
              alt="SuaAgenda.Pro"
              className="h-32 w-auto object-contain"
            />
          </div>

          <div className="mb-8 space-y-3 text-center">
            <h2 className="font-display text-2xl font-bold">Entrar no painel</h2>
            <p className="text-sm text-muted-foreground">
              Use suas credenciais de super administrador.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <p className="pt-1 text-center text-[11px] text-muted-foreground">
              Demo: qualquer e-mail e senha são aceitos.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
