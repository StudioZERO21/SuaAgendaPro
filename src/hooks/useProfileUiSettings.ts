import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  applyPersonalization,
  loadPersonalization,
  savePersonalization,
  type AccentId,
  type FontId,
  type Personalization,
  type ThemeId,
} from "@/lib/personalization";

export const PROFILE_UI_SETTINGS_KEY = "profile-ui-settings";

type UiSettingsRow = {
  accent?: AccentId;
  font?: FontId;
  theme?: ThemeId;
  highContrast?: boolean;
};

async function fetchProfileUiSettings(userId: string): Promise<UiSettingsRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("ui_settings")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.ui_settings as UiSettingsRow | null) ?? null;
}

/** Busca ui_settings uma vez e compartilha cache entre __root e Personalização. */
export function useProfileUiSettings(userId: string | undefined) {
  return useQuery({
    queryKey: [PROFILE_UI_SETTINGS_KEY, userId],
    queryFn: () => fetchProfileUiSettings(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

/** Mescla ui_settings do Supabase no localStorage e aplica tema ao DOM. */
export function mergeAndApplyUiSettings(ui: UiSettingsRow | null | undefined) {
  if (!ui) return;
  const local = loadPersonalization();
  const merged: Personalization = {
    ...local,
    accent: ui.accent ?? local.accent,
    font: ui.font ?? local.font,
    theme: ui.theme ?? local.theme,
    highContrast: ui.highContrast ?? local.highContrast,
  };
  savePersonalization(merged);
  applyPersonalization(merged);
  return merged;
}
