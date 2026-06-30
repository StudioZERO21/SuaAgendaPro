/** Locale padrão do produto — evita prompt de tradução do navegador. */
export const SITE_LANG = "pt-BR" as const;
export const SITE_OG_LOCALE = "pt_BR";

export const LOCALE_HEAD_META = [
  { httpEquiv: "content-language", content: SITE_LANG },
  { name: "google", content: "notranslate" },
  { property: "og:locale", content: SITE_OG_LOCALE },
] as const;
