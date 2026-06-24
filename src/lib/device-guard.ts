// ETAPA 10 — Detecção de dispositivo client-side
// Usado para enforcement de mobile-only no app após produção

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

export function isDesktopDevice(): boolean {
  return !isMobileDevice();
}

// TODO (Etapa 10):
// - Hook useDeviceGuard() que redireciona desktop em rotas de app
// - Ativado apenas em PROD (import.meta.env.PROD)
// - Página "use no celular" com QR code para o app
