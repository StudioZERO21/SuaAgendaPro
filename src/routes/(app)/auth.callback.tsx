import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getOnboardingStatus } from "@/lib/auth";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/(app)/auth/callback")({
  head: () => ({
    meta: [{ title: "Confirmando acesso — SuaAgenda.Pro" }],
  }),
  component: AuthCallbackPage,
});

/**
 * Recebe o retorno do Supabase Auth (confirmação de e-mail, magic link).
 * Substitui links que apontavam para localhost:3000.
 */
function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirmando seu e-mail…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const authError = params.get("error_description") || params.get("error");

        if (authError) {
          throw new Error(decodeURIComponent(authError));
        }

        if (code) {
          setMessage("Validando link…");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Hash legado (#access_token) — detectSessionInUrl no client Supabase
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!data.session) {
            throw new Error("Link inválido ou expirado. Solicite um novo e-mail.");
          }
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Sessão não encontrada após confirmação.");

        const onboarded = await getOnboardingStatus(user.id);
        if (cancelled) return;

        toast.success("E-mail confirmado! ✨");
        navigate({ to: onboarded ? "/dashboard" : "/onboarding", replace: true });
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Não foi possível confirmar o e-mail.";
        setMessage(msg);
        toast.error(msg);
        setTimeout(() => navigate({ to: "/login", replace: true }), 3500);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </MobileShell>
  );
}
