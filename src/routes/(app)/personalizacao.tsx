import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ArrowLeft, Save, Sun, Moon, Monitor, Upload, Check, Eye, DollarSign, Image as ImageIcon, CalendarCheck, Loader2, HelpCircle, Link2, Copy, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { LogoShape } from "@/lib/personalization";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getPublicProfileSettings,
  savePublicProfileSettings,
  type PublicProfileSettings,
} from "@/lib/profile-public-settings.functions";

export const Route = createFileRoute("/(app)/personalizacao")({
  head: () => ({
    meta: [
      { title: "Personalização — SuaAgenda.Pro" },
      {
        name: "description",
        content: "Personalize tema, cores e logo do seu negócio.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: GOOGLE_FONTS_URL },
    ],
  }),
  component: PersonalizacaoPage,
});

import {
  ACCENTS,
  FONTS,
  DEFAULTS,
  loadPersonalization,
  savePersonalization,
  applyPersonalization,
  type Personalization,
} from "@/lib/personalization";
import { THEMES, GOOGLE_FONTS_URL } from "@/lib/themes";
import { THEME_CATEGORY_ORDER } from "@/lib/theme-meta";
import { TemplatePreviewCard } from "@/components/public-page/template-preview-card";


function PersonalizacaoPage() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const { user }   = useAuth();
  const [data, setData] = useState<Personalization>(DEFAULTS);
  const [showNameHelp, setShowNameHelp] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Public profile settings (Supabase) ───────────────────────
  const getSettingsFn  = useServerFn(getPublicProfileSettings);
  const saveSettingsFn = useServerFn(savePublicProfileSettings);

  const { data: pubSettings, isLoading: loadingPub } = useQuery({
    queryKey: ["public-profile-settings"],
    queryFn:  () => getSettingsFn(),
  });

  const [pub, setPub] = useState<PublicProfileSettings>({
    slug: "", bannerUrl: "", logoUrl: "", businessName: "", themeColor: "#ec4899", gradientColor2: "",
    showPrices: true, showPortfolio: true, acceptOnline: true, cancellationPolicy: "", welcomeMessage: "",
    uiSettings: { accent: "rose", font: "playfair", theme: "light", highContrast: false },
    templateId: "bloom_soft",
  });

  useEffect(() => {
    if (pubSettings) {
      setPub((prev) => ({
        ...pubSettings,
        businessName: pubSettings.businessName || prev.businessName,
      }));
      setSlug(pubSettings.slug ?? "");
    }
  }, [pubSettings]);

  // ── Slug editing ─────────────────────────────────────────────
  const [slug,            setSlug]           = useState("");
  const [editingSlug,     setEditingSlug]    = useState(false);
  const [slugInput,       setSlugInput]      = useState("");
  const [slugStatus,      setSlugStatus]     = useState<"idle" | "checking" | "available" | "taken" | "too-short">("idle");
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [savingSlug,      setSavingSlug]     = useState(false);
  const [linkCopied,      setLinkCopied]     = useState(false);
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function normalizeSlug(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  function startEditSlug() {
    setSlugInput(slug);
    setSlugStatus("idle");
    setSlugSuggestions([]);
    setEditingSlug(true);
  }

  function handleSlugInput(raw: string) {
    const val = normalizeSlug(raw);
    setSlugInput(val);
    setSlugSuggestions([]);
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    if (!val) { setSlugStatus("idle"); return; }
    if (val.length < 8) { setSlugStatus("too-short"); return; }
    if (val === slug) { setSlugStatus("available"); return; }
    setSlugStatus("checking");
    slugTimerRef.current = setTimeout(async () => {
      const { data: found } = await supabase
        .from("profiles").select("id").eq("slug", val).neq("id", user?.id ?? "").maybeSingle();
      if (found) {
        setSlugStatus("taken");
        const base = val.replace(/-?\d+$/, "");
        setSlugSuggestions([`${base}-2`, `${base}-pro`, `${base}01`].filter(s => s.length >= 8).slice(0, 3));
      } else {
        setSlugStatus("available");
      }
    }, 500);
  }

  async function confirmSlug() {
    if (slugStatus !== "available" || slugInput.length < 8) return;
    setSavingSlug(true);
    try {
      const { error } = await supabase.from("profiles").update({ slug: slugInput }).eq("id", user?.id ?? "");
      if (error) throw error;
      setSlug(slugInput);
      setEditingSlug(false);
      toast.success("Link público atualizado!");
    } catch {
      toast.error("Esse link pode já estar em uso. Tente outro.");
    } finally {
      setSavingSlug(false);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/agendar/${slug}`;
    navigator.clipboard?.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }
  // ─────────────────────────────────────────────────────────────

  // Carrega personalização: Supabase tem prioridade sobre localStorage
  useEffect(() => {
    const local = loadPersonalization();
    setData(local);
    applyPersonalization(local);
    if (local.business.name) {
      setPub((prev) => ({ ...prev, businessName: prev.businessName || local.business.name }));
    }
  }, []);

  // Quando dados do Supabase chegarem, sobrescreve accent/font/theme do localStorage
  useEffect(() => {
    if (!pubSettings?.uiSettings) return;
    const ui = pubSettings.uiSettings;
    setData((prev) => {
      const next: Personalization = {
        ...prev,
        accent:      ui.accent,
        font:        ui.font,
        theme:       ui.theme,
        highContrast: ui.highContrast,
      };
      savePersonalization(next);
      applyPersonalization(next);
      return next;
    });
  }, [pubSettings?.uiSettings?.accent, pubSettings?.uiSettings?.font, pubSettings?.uiSettings?.theme]);

  // Sync: se logo está como data URL no localStorage (nunca foi upado), faz upload silencioso
  const logoSyncedRef = useRef(false);
  useEffect(() => {
    if (logoSyncedRef.current) return;
    if (!user?.id) return;
    if (!data.business.logo.startsWith("data:")) return;
    logoSyncedRef.current = true;
    const uid = user.id;
    const logoData = data.business.logo;
    (async () => {
      try {
        const res  = await fetch(logoData);
        const blob = await res.blob();
        const path = `${uid}/logo.png`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { contentType: "image/png", upsert: true });
        if (upErr) return;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        await supabase.from("profiles")
          .update({ cover_url: publicUrl, updated_at: new Date().toISOString() })
          .eq("id", uid);
        setData((d) => {
          const next = { ...d, business: { ...d.business, logo: publicUrl } };
          savePersonalization(next);
          return next;
        });
      } catch { /* silent */ }
    })();
  }, [user?.id, data.business.logo]);

  useEffect(() => {
    applyPersonalization(data);
  }, [data.theme, data.accent, data.font, data.highContrast]);

  // ── Banner upload ─────────────────────────────────────────────
  const bannerInputRef  = useRef<HTMLInputElement>(null);
  const [bannerCropSrc,     setBannerCropSrc]     = useState<string | null>(null);
  const [bannerCrop,        setBannerCrop]        = useState({ x: 0, y: 0 });
  const [bannerZoom,        setBannerZoom]        = useState(1);
  const [bannerCroppedArea, setBannerCroppedArea] = useState<Area | null>(null);
  const [bannerUploading,   setBannerUploading]   = useState(false);

  const onBannerCropComplete = useCallback((_: Area, px: Area) => setBannerCroppedArea(px), []);

  function onBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { setBannerCropSrc(r.result as string); setBannerCrop({ x: 0, y: 0 }); setBannerZoom(1); };
    r.readAsDataURL(file);
    e.target.value = "";
  }

  async function confirmBannerCrop() {
    if (!bannerCropSrc || !bannerCroppedArea || !user?.id) return;
    setBannerUploading(true);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = bannerCropSrc;
      });
      // Canvas com proporção 16:9 para combinar com o banner na página pública
      const canvas = document.createElement("canvas");
      canvas.width = 1280; canvas.height = 720;
      canvas.getContext("2d")!.drawImage(
        img,
        bannerCroppedArea.x, bannerCroppedArea.y, bannerCroppedArea.width, bannerCroppedArea.height,
        0, 0, 1280, 720,
      );
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const fetchRes = await fetch(dataUrl);
      const blob = await fetchRes.blob();
      const path = `${user.id}/banner.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      // Salva direto no banco — a página pública verá imediatamente
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ banner_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (dbErr) throw dbErr;
      setPub((s) => ({ ...s, bannerUrl: publicUrl }));
      setBannerCropSrc(null);
      // Invalida o cache da página pública
      await saveSettingsFn({
        data: {
          ...pub,
          bannerUrl: publicUrl,
          uiSettings: { accent: data.accent, font: data.font, theme: data.theme, highContrast: data.highContrast },
        },
      }).catch(() => {/* silent — cache invalidation best-effort */});
      qc.invalidateQueries({ queryKey: ["public-profile-settings"] });
      toast.success("Banner salvo! A página pública já está atualizada.");
    } catch {
      toast.error("Erro ao processar banner.");
    } finally {
      setBannerUploading(false);
    }
  }

  // ── Logo crop ─────────────────────────────────────────────────
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc,      setCropSrc]      = useState<string | null>(null);
  const [crop,         setCrop]         = useState({ x: 0, y: 0 });
  const [zoom,         setZoom]         = useState(1);
  const [croppedArea,  setCroppedArea]  = useState<Area | null>(null);
  const [cropLoading,  setCropLoading]  = useState(false);

  const SHAPE_ASPECT: Record<LogoShape, number> = { square: 1, wide: 3 };
  const SHAPE_CANVAS: Record<LogoShape, { w: number; h: number }> = {
    square: { w: 256, h: 256 },
    wide:   { w: 512, h: 171 },
  };

  const onCropComplete = useCallback((_: Area, px: Area) => setCroppedArea(px), []);

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { setCropSrc(r.result as string); setCrop({ x: 0, y: 0 }); setZoom(0.5); };
    r.readAsDataURL(file);
    e.target.value = "";
  }

  async function confirmCrop() {
    if (!cropSrc || !croppedArea) return;
    setCropLoading(true);
    try {
      const shape = data.business.logoShape;
      const { w, h } = SHAPE_CANVAS[shape];
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = cropSrc;
      });
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(
        img,
        croppedArea.x, croppedArea.y, croppedArea.width, croppedArea.height,
        0, 0, w, h,
      );
      const dataUrl = canvas.toDataURL("image/png");
      setData((d) => ({ ...d, business: { ...d.business, logo: dataUrl } }));
      setCropSrc(null);
    } finally {
      setCropLoading(false);
    }
  }

  async function saveAll() {
    setSaving(true);
    try {
      // If logo is a fresh data URL, upload to Supabase and save the public URL back
      let logoToSave = data.business.logo;
      if (logoToSave.startsWith("data:") && user?.id) {
        const res  = await fetch(logoToSave);
        const blob = await res.blob();
        const path = `${user.id}/logo.png`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { contentType: "image/png", upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        const { error: dbErr } = await supabase
          .from("profiles")
          .update({ cover_url: publicUrl, updated_at: new Date().toISOString() })
          .eq("id", user.id);
        if (dbErr) throw dbErr;
        logoToSave = publicUrl;
        setData((d) => ({ ...d, business: { ...d.business, logo: publicUrl } }));
      } else if (!logoToSave && user?.id) {
        // Logo was removed — clear cover_url
        await supabase.from("profiles").update({ cover_url: null }).eq("id", user.id);
      }

      // Save personalization to localStorage (cache local)
      savePersonalization({ ...data, business: { ...data.business, logo: logoToSave } });
      applyPersonalization(data);
      // Save public profile + ui_settings to Supabase
      await saveSettingsFn({
        data: {
          ...pub,
          uiSettings: {
            accent:      data.accent,
            font:        data.font,
            theme:       data.theme,
            highContrast: data.highContrast,
          },
        },
      });
      qc.invalidateQueries({ queryKey: ["public-profile-settings"] });
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const initials = data.business.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <MobileShell>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/mais" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Ajustes
          </p>
          <h1 className="truncate font-display text-lg font-bold">Personalização</h1>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-5 pb-32 pt-5">
        {/* Logo + nome */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-base font-bold">Logo do negócio</h2>
            <p className="text-xs text-muted-foreground">
              Aparece no seu link público e nas comunicações.
            </p>
          </div>

          {/* Formato da logo */}
          <div className="space-y-2">
            <Label className="text-xs">Formato da logo</Label>
            <div className="grid grid-cols-2 gap-2">
              {([ { id: "square", label: "Quadrado", hint: "1:1" }, { id: "wide", label: "Retangular", hint: "3:1" } ] as const).map((s) => {
                const active = data.business.logoShape === s.id;
                return (
                  <button key={s.id} type="button"
                    onClick={() => setData((d) => ({ ...d, business: { ...d.business, logoShape: s.id, logo: "" } }))}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition",
                      active ? "border-primary bg-primary/10" : "border-border bg-secondary/40",
                    )}
                  >
                    {/* miniatura visual do formato */}
                    <div className={cn(
                      "rounded border-2 bg-primary/30",
                      s.id === "square" ? "h-8 w-8" : "h-5 w-14",
                      active ? "border-primary" : "border-muted-foreground/40",
                    )} />
                    <span className="text-xs font-semibold">{s.label}</span>
                    <span className="text-[10px] text-muted-foreground">{s.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview + ações */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex shrink-0 items-center justify-center overflow-hidden text-xl font-bold text-white shadow-glow",
                data.business.logoShape === "square"
                  ? "h-20 w-20 rounded-2xl"
                  : "h-14 w-40 rounded-xl",
              )}
              style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-glow))" }}
            >
              {data.business.logo ? (
                <img src={data.business.logo} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <span className={data.business.logoShape === "wide" ? "text-lg" : "text-2xl"}>{initials || "S"}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
              <button type="button" onClick={() => logoInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 text-xs font-semibold"
              >
                <Upload className="h-3.5 w-3.5" />
                {data.business.logo ? "Trocar logo" : "Enviar logo"}
              </button>
              {data.business.logo && (
                <button type="button"
                  onClick={() => setData((d) => ({ ...d, business: { ...d.business, logo: "" } }))}
                  className="text-[11px] font-semibold text-destructive"
                >
                  remover
                </button>
              )}
            </div>
          </div>

        </section>

        {/* Tema */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-base font-bold">Tema e cores</h2>
            <p className="text-xs text-muted-foreground">
              Defina como o app aparece para você.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "light", label: "Claro", icon: Sun },
                { id: "dark", label: "Escuro", icon: Moon },
                { id: "auto", label: "Auto", icon: Monitor },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              const active = data.theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setData((d) => ({ ...d, theme: t.id }))}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border p-3 text-xs font-semibold transition",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/40 text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Cor de destaque</Label>
            <div className="flex flex-wrap gap-3">
              {ACCENTS.map((a) => {
                const active = data.accent === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      setData((d) => ({ ...d, accent: a.id }));
                      // Sincroniza themeColor do perfil público com a cor do accent
                      setPub((p) => ({ ...p, themeColor: a.primary }));
                    }}
                    aria-label={a.label}
                    className={cn(
                      "relative h-10 w-10 rounded-full ring-offset-2 ring-offset-card transition",
                      active && "ring-2 ring-foreground",
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${a.primary}, ${a.glow})`,
                    }}
                  >
                    {active && (
                      <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Fonte de títulos</Label>
            <div className="grid grid-cols-3 gap-2">
              {FONTS.map((f) => {
                const active = data.font === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setData((d) => ({ ...d, font: f.id }))}
                    className={cn(
                      "rounded-2xl border p-3 text-center transition",
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/40",
                    )}
                  >
                    <p
                      className="text-2xl font-bold"
                      style={{ fontFamily: f.stack }}
                    >
                      Aa
                    </p>

                    <p className="text-[10px] font-semibold text-muted-foreground">
                      {f.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Acessibilidade */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-base font-bold">Acessibilidade</h2>
            <p className="text-xs text-muted-foreground">
              Ajustes para melhorar a leitura e a navegação.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setData((d) => ({ ...d, highContrast: !d.highContrast }))
            }
            aria-pressed={data.highContrast}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition",
              data.highContrast
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/40",
            )}
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  data.highContrast ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
                )}
                aria-hidden="true"
              >
                <Eye className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Alto contraste
                </span>
                <span className="block text-xs text-muted-foreground">
                  Bordas marcadas, foco visível e texto reforçado.
                </span>
              </span>
            </span>
            <span
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full border transition",
                data.highContrast ? "border-primary bg-primary" : "border-border bg-card",
              )}
            >
              <span
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-all",
                  data.highContrast ? "left-[22px]" : "left-1",
                )}
              />
            </span>
          </button>
        </section>

        <p className="px-1 text-[11px] text-muted-foreground">
          Horários, notificações e pagamentos ficam nos seus respectivos menus em
          <strong> Mais</strong>.
        </p>

        {/* ── Perfil Público (Supabase) ──────────────────────── */}
        <section className="space-y-5 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-base font-bold">Perfil público</h2>
            <p className="text-xs text-muted-foreground">
              Configurações visíveis no seu link de agendamento.
            </p>
          </div>

          {/* Link público */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Link público</Label>
            {!editingSlug ? (
              <div className="flex items-center gap-2 rounded-2xl bg-secondary/40 px-3 py-2.5">
                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs">
                  <span className="text-muted-foreground">suaagenda.pro/agendar/</span>
                  <span className="font-semibold">{slug}</span>
                </span>
                <button type="button" onClick={copyLink}
                  className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:text-primary"
                  aria-label="Copiar link"
                >
                  {linkCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button type="button" onClick={startEditSlug}
                  className="shrink-0 text-xs font-semibold text-primary underline underline-offset-2"
                >
                  Editar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center overflow-hidden rounded-2xl border border-border bg-card shadow-card focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0">
                  <span className="shrink-0 border-r border-border/60 bg-secondary/40 px-2.5 py-2.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                    /agendar/
                  </span>
                  <input type="text" autoFocus value={slugInput}
                    onChange={(e) => handleSlugInput(e.target.value)}
                    placeholder="meu-link" maxLength={30}
                    className="flex-1 bg-transparent px-2.5 py-2.5 text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <AnimatePresence mode="wait">
                  {slugStatus === "too-short" && (
                    <motion.p key="short" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="text-xs font-medium text-amber-500">
                      ⚠️ Mínimo de 8 caracteres ({slugInput.length}/8)
                    </motion.p>
                  )}
                  {slugStatus === "checking" && (
                    <motion.p key="checking" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Verificando...
                    </motion.p>
                  )}
                  {slugStatus === "available" && (
                    <motion.p key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="text-xs font-medium text-emerald-600">✅ Disponível!</motion.p>
                  )}
                  {slugStatus === "taken" && (
                    <motion.div key="taken" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="space-y-1.5">
                      <p className="text-xs font-medium text-destructive">❌ Este link já está em uso</p>
                      {slugSuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {slugSuggestions.map((s) => (
                            <button key={s} type="button" onClick={() => handleSlugInput(s)}
                              className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary transition hover:bg-primary/20">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={confirmSlug}
                    disabled={slugStatus !== "available" || savingSlug}
                    className="rounded-xl gradient-primary text-white shadow-glow disabled:opacity-50 h-8 text-xs">
                    {savingSlug ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirmar"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingSlug(false)} className="rounded-xl h-8 text-xs">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Banner da página pública */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Banner da página pública</Label>
            <p className="text-[11px] text-muted-foreground">
              Imagem de fundo do topo do seu link de agendamento. Se não enviar, usamos um banner padrão.
            </p>
            {pub.bannerUrl ? (
              <div className="relative overflow-hidden rounded-2xl border border-border">
                <img src={pub.bannerUrl} alt="Banner" className="h-24 w-full object-cover" />
                <button type="button"
                  onClick={() => setPub((s) => ({ ...s, bannerUrl: "" }))}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
                  aria-label="Remover banner"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/40 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card shadow-card">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">Nenhum banner enviado</p>
                  <p className="text-[10px] text-muted-foreground">Banner padrão será usado</p>
                </div>
              </div>
            )}
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={onBanner} />
            <button type="button" onClick={() => bannerInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 text-xs font-semibold"
            >
              <Upload className="h-3.5 w-3.5" />
              {pub.bannerUrl ? "Trocar banner" : "Enviar banner"}
            </button>
          </div>

          {/* Nome do negócio */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="business-name" className="text-xs">Nome do negócio</Label>
              <button type="button" onClick={() => setShowNameHelp((v) => !v)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition hover:text-primary"
                aria-label="Ajuda sobre nome do negócio">
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
            <AnimatePresence>
              {showNameHelp && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }} className="overflow-hidden">
                  <p className="rounded-xl bg-primary/8 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
                    Nome exibido como <strong>nome da empresa</strong> na página pública.{" "}
                    Se vazio, usa seu <strong>nome pessoal</strong>.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <Input id="business-name" maxLength={120} placeholder="Ex: StudioZERO21"
              value={pub.businessName}
              onChange={(e) => setPub((s) => ({ ...s, businessName: e.target.value }))}
            />
            <p className="text-[11px] text-muted-foreground">Aparece como destaque na sua página pública.</p>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {[
              { key: "showPrices"    as const, icon: DollarSign,    label: "Mostrar preços",              desc: "Clientes veem o valor de cada serviço." },
              { key: "showPortfolio" as const, icon: ImageIcon,       label: "Mostrar portfólio",           desc: "Fotos dos seus trabalhos aparecem no perfil." },
              { key: "acceptOnline"  as const, icon: CalendarCheck,  label: "Aceitar agendamentos online", desc: "Desative para mostrar o perfil sem booking." },
            ].map(({ key, icon: Icon, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <Switch
                  checked={pub[key]}
                  onCheckedChange={(v) => setPub((s) => ({ ...s, [key]: v }))}
                />
              </div>
            ))}
          </div>

          {/* Mensagem de boas-vindas */}
          <div className="space-y-1.5">
            <Label htmlFor="welcome" className="text-xs">Mensagem de boas-vindas</Label>
            <Textarea
              id="welcome"
              rows={2}
              maxLength={300}
              placeholder="Ex: Bem-vinda ao Studio! Escolha seu serviço abaixo 💅"
              value={pub.welcomeMessage}
              onChange={(e) => setPub((s) => ({ ...s, welcomeMessage: e.target.value }))}
            />
          </div>

          {/* Política de cancelamento */}
          <div className="space-y-1.5">
            <Label htmlFor="cancel-policy" className="text-xs">Política de cancelamento</Label>
            <Textarea
              id="cancel-policy"
              rows={2}
              maxLength={600}
              placeholder="Ex: Cancelamentos com menos de 24h de antecedência não serão reembolsados."
              value={pub.cancellationPolicy}
              onChange={(e) => setPub((s) => ({ ...s, cancellationPolicy: e.target.value }))}
            />
          </div>

          {/* Template da página pública */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold">Template da página pública</Label>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Escolha o layout do seu link de agendamento. O preview mostra hero, serviços e portfólio de cada tema.
              </p>
            </div>

            {THEME_CATEGORY_ORDER.map((category) => {
              const themesInCat = Object.values(THEMES).filter((t) => t.category === category);
              if (themesInCat.length === 0) return null;
              return (
                <div key={category} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {category}
                    </span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {themesInCat.map((t) => (
                      <TemplatePreviewCard
                        key={t.id}
                        theme={t}
                        selected={pub.templateId === t.id}
                        onSelect={() => setPub((s) => ({ ...s, templateId: t.id }))}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </section>

      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-5 pb-5">
        <Button
          onClick={saveAll}
          disabled={saving || loadingPub}
          size="lg"
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow disabled:opacity-60"
        >
          {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Salvar tudo
        </Button>
      </div>

      {/* ── Crop Dialog ── */}
      <Dialog open={!!cropSrc} onOpenChange={(o) => !o && setCropSrc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajuste sua logo</DialogTitle>
          </DialogHeader>

          <div className={cn(
            "relative w-full overflow-hidden rounded-2xl bg-secondary/60",
            data.business.logoShape === "wide" ? "h-40" : "h-64",
          )}>
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                minZoom={0.1}
                maxZoom={5}
                aspect={SHAPE_ASPECT[data.business.logoShape]}
                cropShape="rect"
                showGrid={false}
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="space-y-2 pt-1">
            <Label className="text-xs">Zoom</Label>
            <Slider min={0.1} max={5} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
            <p className="text-center text-[11px] text-muted-foreground">
              Arraste para reposicionar · Use o zoom para ajustar o enquadramento.
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCropSrc(null)}>Cancelar</Button>
            <Button onClick={confirmCrop} disabled={cropLoading} className="gradient-primary text-white">
              {cropLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Usar logo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de crop do banner — fora do MobileShell para não sofrer clipping */}
      <Dialog open={!!bannerCropSrc} onOpenChange={(o) => !o && setBannerCropSrc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustar banner</DialogTitle>
          </DialogHeader>
          <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-secondary/60">
            {bannerCropSrc && (
              <Cropper
                image={bannerCropSrc}
                crop={bannerCrop}
                zoom={bannerZoom}
                aspect={16 / 9}
                minZoom={0.3}
                maxZoom={3}
                restrictPosition={false}
                onCropChange={setBannerCrop}
                onZoomChange={setBannerZoom}
                onCropComplete={onBannerCropComplete}
              />
            )}
          </div>
          <div className="space-y-2 pt-1">
            <Label className="text-xs">Zoom</Label>
            <Slider min={0.3} max={3} step={0.05} value={[bannerZoom]}
              onValueChange={([v]) => setBannerZoom(v)} className="w-full" />
            <p className="text-center text-[11px] text-muted-foreground">
              Arraste para reposicionar · Use o zoom para ajustar o enquadramento.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBannerCropSrc(null)}>Cancelar</Button>
            <Button onClick={confirmBannerCrop} disabled={bannerUploading} className="gradient-primary text-white">
              {bannerUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Usar banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}
