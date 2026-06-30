import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "sa_cookie_consent";

/**
 * Banner de cookies essenciais (LGPD Art. 8).
 * Registra aceite em localStorage — sem cookies de rastreamento de terceiros.
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: new Date().toISOString(), essential: true }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur md:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Usamos cookies e armazenamento local essenciais para login, preferências e
          funcionamento do app. Consulte nossa{" "}
          <Link to="/privacidade" className="font-medium text-primary underline-offset-2 hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
        <Button onClick={accept} size="sm" className="shrink-0">
          Entendi
        </Button>
      </div>
    </div>
  );
}
