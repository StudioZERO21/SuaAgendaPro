import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Smartphone, QrCode } from "lucide-react";

export const Route = createFileRoute("/(app)/use-no-celular")({
  head: () => ({ meta: [{ title: "Use no Celular — SuaAgenda.Pro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: UseNoCelularPage,
});

const APP_URL = "https://app.suaagenda.pro";

function UseNoCelularPage() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    import("qrcode").then(({ default: QRCode }) => {
      QRCode.toDataURL(APP_URL, { width: 240, margin: 2, color: { dark: "#18181b", light: "#ffffff" } })
        .then(setQrUrl)
        .catch(() => setQrUrl(null));
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-8">
        {/* Ícone */}
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
          <Smartphone className="h-10 w-10 text-white" />
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Abra no celular
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            O <strong>SuaAgenda.Pro</strong> foi feito para o seu celular.<br />
            Escaneie o QR code abaixo para acessar.
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          {qrUrl ? (
            <div className="rounded-2xl border border-border bg-white p-4 shadow-card">
              <img src={qrUrl} alt="QR Code para o app" className="h-52 w-52" />
            </div>
          ) : (
            <div className="flex h-52 w-52 items-center justify-center rounded-2xl border border-border bg-muted/30">
              <QrCode className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* URL */}
        <p className="text-xs text-muted-foreground">
          Ou acesse diretamente:{" "}
          <span className="font-mono font-medium text-primary">{APP_URL}</span>
        </p>

        {/* Logo */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-display font-bold text-primary">SuaAgenda</span>
            <span className="font-bold">.Pro</span>
          </p>
        </div>
      </div>
    </div>
  );
}
