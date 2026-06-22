import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PublicProfileSettings = {
  businessName:        string;
  themeColor:          string;
  showPrices:          boolean;
  showPortfolio:       boolean;
  acceptOnline:        boolean;
  cancellationPolicy:  string;
  welcomeMessage:      string;
};

const DEFAULT_SETTINGS: PublicProfileSettings = {
  businessName:       "",
  themeColor:         "#ec4899",
  showPrices:         true,
  showPortfolio:      true,
  acceptOnline:       true,
  cancellationPolicy: "",
  welcomeMessage:     "",
};

const schema = z.object({
  businessName:       z.string().max(120).default(""),
  themeColor:         z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
  showPrices:         z.boolean(),
  showPortfolio:      z.boolean(),
  acceptOnline:       z.boolean(),
  cancellationPolicy: z.string().max(600).default(""),
  welcomeMessage:     z.string().max(300).default(""),
});

export const getPublicProfileSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PublicProfileSettings> => {
    const { data } = await context.supabase
      .from("profiles")
      .select("business_name, theme_color, show_prices, show_portfolio, accept_online, cancellation_policy, welcome_message")
      .eq("id", context.userId)
      .maybeSingle();

    if (!data) return DEFAULT_SETTINGS;
    return {
      businessName:       (data as any).business_name    ?? "",
      themeColor:         data.theme_color               ?? DEFAULT_SETTINGS.themeColor,
      showPrices:         data.show_prices               ?? DEFAULT_SETTINGS.showPrices,
      showPortfolio:      data.show_portfolio            ?? DEFAULT_SETTINGS.showPortfolio,
      acceptOnline:       data.accept_online             ?? DEFAULT_SETTINGS.acceptOnline,
      cancellationPolicy: data.cancellation_policy       ?? "",
      welcomeMessage:     data.welcome_message           ?? "",
    };
  });

export const savePublicProfileSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data, context }): Promise<PublicProfileSettings> => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        business_name:       data.businessName || null,
        theme_color:         data.themeColor,
        show_prices:         data.showPrices,
        show_portfolio:      data.showPortfolio,
        accept_online:       data.acceptOnline,
        cancellation_policy: data.cancellationPolicy || null,
        welcome_message:     data.welcomeMessage || null,
      } as any)
      .eq("id", context.userId);

    if (error) throw new Error(error.message);
    return data;
  });
