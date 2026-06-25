// Etapa 10 — Detecção de dispositivo e redirecionamento mobile-only
import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

export function isDesktopDevice(): boolean {
  return !isMobileDevice();
}

// Rotas do app que exigem mobile (tudo autenticado exceto super e público)
const APP_PATH_PREFIXES = [
  "/app", "/dashboard", "/clientes", "/servicos", "/horarios",
  "/perfil-profissional", "/personalizacao", "/portfolio", "/avaliacoes",
  "/notificacoes", "/pagamentos", "/transacoes", "/whatsapp",
  "/google-calendar", "/plano", "/mais",
];

function isAppPath(pathname: string): boolean {
  return APP_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Hook: redireciona desktop para /use-no-celular nas rotas do app (apenas em produção)
export function useDeviceGuard() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!isAppPath(location.pathname)) return;
    if (isDesktopDevice()) {
      navigate({ to: "/use-no-celular" });
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
}
