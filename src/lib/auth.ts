import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function requireAuth() {
  if (typeof window === "undefined") return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw redirect({ to: "/login" });
  }
  return session;
}

export async function requireGuest() {
  if (typeof window === "undefined") return;
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .single();
    throw redirect({ to: profile?.onboarding_completed ? "/dashboard" : "/onboarding" });
  }
}

export async function getOnboardingStatus(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .single();
  return data?.onboarding_completed ?? false;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 40);
}

export async function isSlugAvailable(slug: string, currentUserId?: string): Promise<boolean> {
  const query = supabase.from("profiles").select("id").eq("slug", slug);
  if (currentUserId) {
    query.neq("id", currentUserId);
  }
  const { data } = await query.single();
  return !data;
}
