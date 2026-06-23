import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// ── Auth helper ───────────────────────────────────────────────

async function uid() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return user.id;
}

const KEY = ["profile"] as const;

// ── Queries ───────────────────────────────────────────────────

export function useProfile() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const id = await uid();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    staleTime: 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Omit<ProfileUpdate, "id">) => {
      const id = await uid();
      const { error } = await supabase
        .from("profiles")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// ── Avatar upload ─────────────────────────────────────────────

export function useUploadBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dataUrl: string): Promise<string> => {
      const id = await uid();
      const res  = await fetch(dataUrl);
      const blob = await res.blob();
      const path = `${id}/banner.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ banner_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (pErr) throw pErr;
      return publicUrl;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dataUrl: string): Promise<string> => {
      const id = await uid();
      const res  = await fetch(dataUrl);
      const blob = await res.blob();
      const path = `${id}/logo.png`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/png", upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ cover_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (pErr) throw pErr;
      return publicUrl;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dataUrl: string): Promise<string> => {
      const id = await uid();

      // Convert data URL → Blob
      const res  = await fetch(dataUrl);
      const blob = await res.blob();

      const path = `${id}/avatar.jpg`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // Bust cache by appending timestamp
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      // Persist to profile row
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (pErr) throw pErr;

      return publicUrl;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
