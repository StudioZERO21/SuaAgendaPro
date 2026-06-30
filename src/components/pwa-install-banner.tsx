import { useEffect, useState } from "react";
import { Download, Share, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isIosSafari,
  isStandaloneDisplayMode,
  resolveSubdomain,
} from "@/lib/pwa-context";

const DISMISS_KEY = "sa.pwa.install.dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Banner de instalação PWA — Android/Chrome (beforeinstallprompt) e iOS (instruções).
 */
export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandaloneDisplayMode()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const subdomain = resolveSubdomain(
      window.location.hostname,
      window.location.pathname,
    );
    if (subdomain !== "app") return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    if (isIosSafari()) {
      const t = window.setTimeout(() => setVisible(true), 3000);
      setIosHint(true);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBip);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  if (!visible || isStandaloneDisplayMode()) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar aplicativo"
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] left-3 right-3 z-50 mx-auto max-w-md animate-sa-fade-in-up"
    >
      <div className="studio-surface flex gap-3 rounded-2xl p-4 shadow-soft">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">
            Instale o SuaAgenda no celular
          </p>
          {iosHint ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              No Safari: toque em{" "}
              <Share className="inline h-3.5 w-3.5 align-text-bottom" />{" "}
              Compartilhar →{" "}
              <strong>Adicionar à Tela de Início</strong>.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Acesso rápido como app, sem abrir o navegador toda vez.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {!iosHint && deferred && (
              <Button
                type="button"
                size="sm"
                className="h-9 px-3 gradient-primary text-white shadow-glow"
                onClick={install}
              >
                <Download className="h-3.5 w-3.5" />
                Instalar
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-xs text-muted-foreground"
              onClick={dismiss}
            >
              Agora não
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 self-start p-1 text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Botão reutilizável (ex.: tela Mais) — dispara install ou mostra dica iOS. */
export function PwaInstallButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplayMode()) {
      setInstalled(true);
      return;
    }
    setIos(isIosSafari());
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  async function onClick() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    if (ios) {
      alert(
        "No iPhone/iPad: abra no Safari → ícone Compartilhar → Adicionar à Tela de Início.",
      );
    }
  }

  if (installed) {
    return (
      <p className={className ?? "text-xs text-muted-foreground"}>
        App instalado neste dispositivo.
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className ?? "w-full justify-start gap-2"}
      onClick={onClick}
    >
      <Download className="h-4 w-4" />
      {ios && !deferred ? "Como instalar no iPhone" : "Instalar aplicativo"}
    </Button>
  );
}
