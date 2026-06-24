import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AccentId, FontId, ThemeId } from "@/lib/personalization";

export type UiSettings = {
  accent:       AccentId;
  font:         FontId;
  theme:        ThemeId;
  highContrast: boolean;
};

export type PublicProfileSettings = {
  slug:                string;
  bannerUrl:           string;
  logoUrl:             string;
  businessName:        string;
  themeColor:          string;
  gradientColor2:      string;
  showPrices:          boolean;
  showPortfolio:       boolean;
  acceptOnline:        boolean;
  cancellationPolicy:  string;
  welcomeMessage:      string;
  uiSettings:          UiSettings;
};

const DEFAULT_UI: UiSettings = { accent: "rose", font: "playfair", theme: "light", highContrast: false };

const DEFAULT_SETTINGS: PublicProfileSettings = {
  slug:               "",
  bannerUrl:          "",
  logoUrl:            "",
  businessName:       "",
  themeColor:         "#ec4899",
  gradientColor2:     "",
  showPrices:         false,
  showPortfolio:      true,
  acceptOnline:       true,
  cancellationPolicy: "",
  welcomeMessage:     "",
  uiSettings:         DEFAULT_UI,
};

const uiSchema = z.object({
  accent:       z.enum(["rose", "violet", "amber", "emerald", "sky", "noir"]).default("rose"),
  font:         z.enum(["playfair", "inter", "dm"]).default("playfair"),
  theme:        z.enum(["light", "dark", "auto"]).default("light"),
  highContrast: z.boolean().default(false),
});

const schema = z.object({
  bannerUrl:          z.string().default(""),
  businessName:       z.string().max(120).default(""),
  themeColor:         z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
  gradientColor2:     z.string().default(""),
  showPrices:         z.boolean(),
  showPortfolio:      z.boolean(),
  acceptOnline:       z.boolean(),
  cancellationPolicy: z.string().max(600).default(""),
  welcomeMessage:     z.string().max(300).default(""),
  uiSettings:         uiSchema,
});

function parseUi(raw: unknown): UiSettings {
  const result = uiSchema.safeParse(raw ?? {});
  return result.success ? result.data : DEFAULT_UI;
}

export const getPublicProfileSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PublicProfileSettings> => {
    const { data } = await context.supabase
      .from("profiles")
      .select("slug, banner_url, cover_url, business_name, theme_color, gradient_color_2, show_prices, show_portfolio, accept_online, cancellation_policy, welcome_message, ui_settings")
      .eq("id", context.userId)
      .maybeSingle();

    if (!data) return DEFAULT_SETTINGS;
    return {
      slug:               data.slug                ?? "",
      bannerUrl:          data.banner_url          ?? "",
      logoUrl:            (data as any).cover_url  ?? "",
      businessName:       data.business_name       ?? "",
      themeColor:         data.theme_color         ?? DEFAULT_SETTINGS.themeColor,
      gradientColor2:     data.gradient_color_2    ?? "",
      showPrices:         data.show_prices         ?? DEFAULT_SETTINGS.showPrices,
      showPortfolio:      data.show_portfolio      ?? DEFAULT_SETTINGS.showPortfolio,
      acceptOnline:       data.accept_online       ?? DEFAULT_SETTINGS.acceptOnline,
      cancellationPolicy: data.cancellation_policy ?? "",
      welcomeMessage:     data.welcome_message     ?? "",
      uiSettings:         parseUi(data.ui_settings),
    };
  });

export const savePublicProfileSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data, context }): Promise<PublicProfileSettings> => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        banner_url:          data.bannerUrl || null,
        business_name:       data.businessName || null,
        theme_color:         data.themeColor,
        gradient_color_2:    data.gradientColor2 || null,
        show_prices:         data.showPrices,
        show_portfolio:      data.showPortfolio,
        accept_online:       data.acceptOnline,
        cancellation_policy: data.cancellationPolicy || null,
        welcome_message:     data.welcomeMessage || null,
        ui_settings:         data.uiSettings,
      })
      .eq("id", context.userId);

    if (error) throw new Error(error.message);
    const { data: prof } = await context.supabase
      .from("profiles")
      .select("slug, banner_url, gradient_color_2")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      ...data,
      slug:          prof?.slug             ?? "",
      bannerUrl:     prof?.banner_url       ?? "",
      gradientColor2: prof?.gradient_color_2 ?? "",
    };
  });
