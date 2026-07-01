import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/mobile-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(app)/auth/callback")({
  head: () => ({
    meta: [{ title: "Confirmando acesso — SuaAgenda.Pro" }],
  }),
  component: AuthCallbackPage,
});

type Phase = "loading" | "success" | "error";

function parseAuthError(): string | null {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const raw =
    search.get("error_description") ||
    search.get("error") ||
    hash.get("error_description") ||
    hash.get("error");
  return raw ? decodeURIComponent(raw.replace(/\+/g, " ")) : null;
}

function waitForSession(timeoutMs = 4000): Promise<Session | null> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (session: Session | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      resolve(session);
    };

    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      finish(data.session);
    }, timeoutMs);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(session);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(data.session);
    });
  });
}

function isBenignAuthError(message: string): boolean {
  return /already|expired|invalid|used|grant|verif/i.test(message);
}

async function completeEmailConfirmationCallback(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const authError = parseAuthError();
  if (authError) {
    if (isBenignAuthError(authError)) return { ok: true };
    return { ok: false, message: authError };
  }

  const code = new URLSearchParams(window.location.search).get("code");

  const { data: initial } = await supabase.auth.getSession();
  if (initial.session) {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: true };
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await supabase.auth.signOut({ scope: "local" });
      return { ok: true };
    }

    const session = await waitForSession(2500);
    if (session) {
      await supabase.auth.signOut({ scope: "local" });
      return { ok: true };
    }

    if (isBenignAuthError(error.message)) return { ok: true };
    return { ok: false, message: error.message };
  }

  const session = await waitForSession(4000);
  if (session) {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: true };
  }

  return {
    ok: false,
    message: "Link inválido ou expirado. Solicite um novo e-mail de confirmação.",
  };
}

/**
 * Recebe o retorno do Supabase Auth (confirmação de e-mail).
 * Exibe sucesso e envia o usuário para o login — não mantém sessão automática.
 */
function AuthCallbackPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState("Confirmando seu e-mail…");

  useEffect(() => {
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      const result = await completeEmailConfirmationCallback();
      if (cancelled) return;

      if (result.ok) {
        setPhase("success");
        setMessage("E-mail confirmado com sucesso!");
        toast.success("E-mail confirmado! Agora é só entrar com sua senha.");
        redirectTimer = setTimeout(() => {
          navigate({
            to: "/login",
            search: { email_confirmed: "1" },
            replace: true,
          });
        }, 2200);
        return;
      }

      setPhase("error");
      setMessage(result.message);
      toast.error(result.message);
      redirectTimer = setTimeout(() => {
        navigate({ to: "/login", replace: true });
      }, 4000);
    })();

    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        {phase === "loading" && (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        )}
        {phase === "success" && (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
        )}
        {phase === "error" && (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
            <XCircle className="h-9 w-9 text-destructive" />
          </div>
        )}
        <p
          className={cn(
            "max-w-sm text-sm",
            phase === "success"
              ? "font-semibold text-foreground"
              : phase === "error"
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          {message}
        </p>
        {phase === "success" && (
          <p className="text-xs text-muted-foreground">
            Redirecionando para o login…
          </p>
        )}
        {phase === "error" && (
          <p className="text-xs text-muted-foreground">
            Você será redirecionado para o login em instantes.
          </p>
        )}
      </div>
    </MobileShell>
  );
}
