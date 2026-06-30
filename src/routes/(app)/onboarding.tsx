import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Sparkles, Scissors, Store, Check,
  Eye, Heart, Flame, Flower2, Star, Brush,
  User, Link2, DollarSign, Clock, AlertCircle,
  Plus, X, Share2, MapPin, Loader2, Home,
  Camera, PawPrint, Stethoscope, SmilePlus, UserRound, PenTool,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/mobile-shell";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PhoneInputBR } from "@/components/ui/phone-input";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug, isSlugAvailable } from "@/lib/auth";
import { ACCENTS, applyPersonalization, loadPersonalization, savePersonalization, type AccentId } from "@/lib/personalization";

export const Route = createFileRoute("/(app)/onboarding")({
  head: () => ({
    meta: [
      { title: "Boas-vindas — SuaAgenda.Pro" },
      { name: "description", content: "Personalize seu studio em 3 passos." },
    ],
  }),
  component: OnboardingPage,
});

const niches = [
  { id: "Lash & Brow",        label: "Lash & Brow",       Icon: Eye },
  { id: "Manicure e Pedicure",label: "Manicure",          Icon: Sparkles },
  { id: "Cabelo",             label: "Cabelo",            Icon: Scissors },
  { id: "Estética Facial",    label: "Estética facial",   Icon: Flower2 },
  { id: "Estética Corporal",  label: "Estética corporal", Icon: Heart },
  { id: "Maquiagem",          label: "Maquiagem",         Icon: Brush },
  { id: "Depilação",          label: "Depilação",         Icon: Flame },
  { id: "Fotografia",         label: "Fotografia",        Icon: Camera },
  { id: "Pet Shop",           label: "Pet Shop",          Icon: PawPrint },
  { id: "Veterinário",        label: "Veterinário",       Icon: Stethoscope },
  { id: "Dentista",           label: "Dentista",          Icon: SmilePlus },
  { id: "Barbeiro",           label: "Barbeiro",          Icon: UserRound },
  { id: "Tatuagem",           label: "Tatuagem",          Icon: PenTool },
  { id: "Outro",              label: "Outro",             Icon: Star },
];

const SOCIAL_NETWORKS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok",    label: "TikTok" },
  { id: "facebook",  label: "Facebook" },
  { id: "youtube",   label: "YouTube" },
  { id: "pinterest", label: "Pinterest" },
  { id: "twitter",   label: "Twitter / X" },
  { id: "linkedin",  label: "LinkedIn" },
];

type SocialLink = { network: string; handle: string };

const durations = [
  { value: "30",  label: "30 min" },
  { value: "45",  label: "45 min" },
  { value: "60",  label: "1 hora" },
  { value: "90",  label: "1h 30" },
  { value: "120", label: "2 horas" },
];

type Form = {
  display_name: string;
  phone: string;
  bio: string;
  slug: string;
  specialty: string;
  service_name: string;
  service_price: string;
  service_duration: string;
  cep: string;
  street: string;
  street_number: string;
  address_complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

const INITIAL: Form = {
  display_name: "",
  phone: "",
  bio: "",
  slug: "",
  specialty: "",
  service_name: "",
  service_price: "",
  service_duration: "60",
  cep: "",
  street: "",
  street_number: "",
  address_complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(INITIAL);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [otherSpecialty, setOtherSpecialty] = useState("");
  const [slugError, setSlugError] = useState("");
  const [slugChecking, setSlugChecking] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [saving, setSaving] = useState(false);
  const [accent, setAccent] = useState<AccentId>("rose");
  const totalSteps = 4;

  // Reflete a cor já salva (caso o usuário volte ao onboarding)
  useEffect(() => { setAccent(loadPersonalization().accent); }, []);

  // Escolhe a cor do tema: aplica na hora e salva — tudo daqui pra frente segue a cor
  function chooseAccent(id: AccentId) {
    setAccent(id);
    const next = { ...loadPersonalization(), accent: id };
    savePersonalization(next);
    applyPersonalization(next);
  }

  // Pre-fill display_name from user metadata
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const name = data.user.user_metadata?.full_name || "";
        if (name) {
          setForm((f) => ({
            ...f,
            display_name: f.display_name || name,
            slug: f.slug || generateSlug(name),
          }));
        }
      }
    });
  }, []);

  function set(field: keyof Form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addSocialLink() {
    setSocialLinks((links) => [...links, { network: "instagram", handle: "" }]);
  }

  function removeSocialLink(index: number) {
    setSocialLinks((links) => links.filter((_, i) => i !== index));
  }

  function updateSocialLink(index: number, field: keyof SocialLink, value: string) {
    setSocialLinks((links) =>
      links.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  }

  async function handleCepChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    set("cep", formatted);
    setCepError("");

    if (digits.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (data.erro) {
          setCepError("CEP não encontrado. Verifique e tente novamente.");
          setForm((f) => ({ ...f, street: "", neighborhood: "", city: "", state: "" }));
        } else {
          setForm((f) => ({
            ...f,
            street:       data.logradouro || "",
            neighborhood: data.bairro      || "",
            city:         data.localidade  || "",
            state:        data.uf          || "",
          }));
        }
      } catch {
        setCepError("Erro ao buscar CEP. Verifique sua conexão.");
      } finally {
        setCepLoading(false);
      }
    } else {
      setForm((f) => ({ ...f, street: "", neighborhood: "", city: "", state: "" }));
    }
  }

  // Auto-generate slug when name changes
  function handleNameChange(name: string) {
    set("display_name", name);
    set("slug", generateSlug(name));
    setSlugError("");
  }

  // Validate slug uniqueness
  const checkSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 4) return;
    setSlugChecking(true);
    const { data: { user } } = await supabase.auth.getUser();
    const available = await isSlugAvailable(slug, user?.id);
    setSlugChecking(false);
    if (!available) {
      setSlugError("Este endereço já está em uso. Escolha outro.");
    } else {
      setSlugError("");
    }
  }, []);

  function handleSlugChange(raw: string) {
    const clean = raw.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
    set("slug", clean);
    setSlugError("");
  }

  // ---------- Step validation ----------
  function canProceed(): boolean {
    if (step === 0) {
      return (
        form.display_name.trim().length >= 3 &&
        form.slug.length >= 4 &&
        !slugError &&
        !slugChecking
      );
    }
    if (step === 1) {
      if (form.specialty === "Outro") return otherSpecialty.trim().length >= 3;
      return form.specialty.length > 0;
    }
    if (step === 2) {
      const price = parseFloat(form.service_price.replace(",", "."));
      return form.service_name.trim().length > 0 && !isNaN(price) && price > 0;
    }
    if (step === 3) {
      const digits = form.cep.replace(/\D/g, "");
      if (digits.length === 0) return true; // endereço opcional
      return digits.length === 8 && !!form.city && !cepError && !cepLoading;
    }
    return true;
  }

  // ---------- Save & navigate ----------
  async function finish() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sem sessão");

      // Validate slug one more time
      const available = await isSlugAvailable(form.slug, user.id);
      if (!available) {
        setSlugError("Este endereço já está em uso. Escolha outro.");
        setStep(0);
        setSaving(false);
        return;
      }

      const priceCents = Math.round(parseFloat(form.service_price.replace(",", ".")) * 100);

      // 1. Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name:         form.display_name.trim(),
          slug:                 form.slug,
          phone:                form.phone.trim() || null,
          bio:                  form.bio.trim() || null,
          specialty:            form.specialty === "Outro" ? otherSpecialty.trim() : form.specialty,
          social_links:         socialLinks.filter((l) => l.handle.trim()),
          cep:                  form.cep || null,
          street:               form.street || null,
          street_number:        form.street_number || null,
          address_complement:   form.address_complement || null,
          neighborhood:         form.neighborhood || null,
          city:                 form.city || null,
          state:                form.state || null,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2. Create first service
      const { error: serviceError } = await supabase
        .from("services")
        .insert({
          professional_id:  user.id,
          name:             form.service_name.trim(),
          price_cents:      priceCents,
          duration_minutes: parseInt(form.service_duration),
          is_active:        true,
        });

      if (serviceError) throw serviceError;

      // 3. Create default working hours (Mon-Fri 9h-18h, Sat 9h-14h)
      const defaultHours = [
        { day_of_week: 1, is_open: true,  start_time: "09:00", end_time: "18:00", break_start: "12:00", break_end: "13:00" },
        { day_of_week: 2, is_open: true,  start_time: "09:00", end_time: "18:00", break_start: "12:00", break_end: "13:00" },
        { day_of_week: 3, is_open: true,  start_time: "09:00", end_time: "18:00", break_start: "12:00", break_end: "13:00" },
        { day_of_week: 4, is_open: true,  start_time: "09:00", end_time: "18:00", break_start: "12:00", break_end: "13:00" },
        { day_of_week: 5, is_open: true,  start_time: "09:00", end_time: "18:00", break_start: "12:00", break_end: "13:00" },
        { day_of_week: 6, is_open: true,  start_time: "09:00", end_time: "14:00", break_start: null,    break_end: null },
        { day_of_week: 0, is_open: false, start_time: null,    end_time: null,    break_start: null,    break_end: null },
      ].map((h) => ({ ...h, professional_id: user.id }));

      const { error: hoursError } = await supabase
        .from("working_hours")
        .upsert(defaultHours, { onConflict: "professional_id,day_of_week" });

      if (hoursError) throw hoursError;

      toast.success("Studio pronto! Bora atender ✨");
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (step === 0) {
      // Check slug before proceeding
      if (slugError || slugChecking) return;
      const { data: { user } } = await supabase.auth.getUser();
      const available = await isSlugAvailable(form.slug, user?.id);
      if (!available) {
        setSlugError("Este endereço já está em uso. Escolha outro.");
        return;
      }
    }
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      await finish();
    }
  }

  function back() {
    if (step === 0) navigate({ to: "/cadastro" });
    else setStep((s) => s - 1);
  }

  return (
    <MobileShell>
      <div className="relative flex flex-1 flex-col px-6 pt-6">
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full gradient-hero opacity-70 blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between">
          <button
            onClick={back}
            className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Passo {step + 1} de {totalSteps}
          </span>
          <div className="w-10" />
        </div>

        {/* Progress bar */}
        <div className="relative mt-3 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                i <= step ? "gradient-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="relative mt-8 flex flex-1 flex-col">
          <AnimatePresence mode="wait">

            {/* ── PASSO 1: Dados do Studio ── */}
            {step === 0 && (
              <motion.div
                key="s0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-1 flex-col"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-md gradient-soft text-primary">
                  <Store className="h-5 w-5" />
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold leading-tight">
                  Vamos conhecer seu <span className="text-gradient italic">trabalho</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Essas informações aparecem no seu link público.
                </p>

                {/* Cor do app — primeira escolha, aplicada na hora */}
                <div className="mt-6 rounded-md border border-border bg-card p-4 shadow-card">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Escolha a cor do seu app
                  </Label>
                  <div className="mt-2.5 flex flex-wrap gap-2.5">
                    {ACCENTS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => chooseAccent(a.id)}
                        aria-label={a.label}
                        title={a.label}
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-full transition",
                          accent === a.id ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card" : "hover:scale-105",
                        )}
                        style={{ background: `linear-gradient(135deg, ${a.primary}, ${a.glow})` }}
                      >
                        {accent === a.id && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2.5 text-xs text-muted-foreground">
                    Dá pra mudar quando quiser em <strong>Mais → Personalização</strong>.
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Seu nome ou nome do studio
                    </Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={form.display_name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Ex: Studio Joana Beauty"
                        className="h-14 rounded-md border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Slug */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Seu endereço público
                    </Label>
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={form.slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        onBlur={() => checkSlug(form.slug)}
                        placeholder="seu-nome"
                        className={cn(
                          "h-14 rounded-md border-border bg-card pl-11 pr-4 text-base shadow-card focus-visible:ring-primary font-mono",
                          slugError && "border-red-400 focus-visible:ring-red-400",
                        )}
                      />
                    </div>
                    {slugError ? (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" /> {slugError}
                      </p>
                    ) : form.slug ? (
                      <p className="text-xs text-muted-foreground">
                        suaagenda.pro/agendar/<span className="font-semibold text-primary">{form.slug}</span>
                      </p>
                    ) : null}
                  </div>

                  {/* Redes Sociais */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Redes Sociais (opcional)
                    </Label>
                    <div className="space-y-2">
                      {socialLinks.map((link, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex flex-1 h-14 items-center rounded-md border border-border bg-card shadow-card overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0">
                            <Share2 className="pointer-events-none ml-4 h-4 w-4 shrink-0 text-muted-foreground" />
                            <Select
                              value={link.network}
                              onValueChange={(v) => updateSocialLink(i, "network", v)}
                            >
                              <SelectTrigger className="h-full w-32 shrink-0 border-0 border-x border-border/60 rounded-none bg-secondary/40 text-xs font-semibold focus:ring-0 focus:ring-offset-0 ml-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SOCIAL_NETWORKS.map((n) => (
                                  <SelectItem key={n.id} value={n.id}>
                                    {n.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <input
                              value={link.handle}
                              onChange={(e) => updateSocialLink(i, "handle", e.target.value)}
                              placeholder="@seuestudio"
                              className="flex-1 h-full bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSocialLink(i)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {socialLinks.length < 6 && (
                        <button
                          type="button"
                          onClick={addSocialLink}
                          className="flex w-full h-14 items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar rede social
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      WhatsApp (opcional)
                    </Label>
                    <PhoneInputBR
                      value={form.phone}
                      onChange={(v) => set("phone", v)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PASSO 2: Especialidade ── */}
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-1 flex-col"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-md gradient-soft text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold leading-tight">
                  Qual é a sua <span className="text-gradient italic">especialidade?</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escolha a área que melhor descreve seu trabalho.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {niches.map((n) => {
                    const active = form.specialty === n.id;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          set("specialty", n.id);
                          if (n.id !== "Outro") setOtherSpecialty("");
                        }}
                        className={cn(
                          "relative flex items-center gap-3 rounded-md border p-4 text-left transition-all",
                          active
                            ? "border-primary bg-secondary shadow-glow"
                            : "border-border bg-card shadow-card hover:border-primary/40",
                        )}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
                          <n.Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold">{n.label}</span>
                        {active && (
                          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full gradient-primary text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {form.specialty === "Outro" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Qual é a sua especialidade?
                      </Label>
                      <div className="relative mt-2">
                        <Sparkles className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          autoFocus
                          value={otherSpecialty}
                          onChange={(e) => setOtherSpecialty(e.target.value)}
                          placeholder="Ex: Nail Designer, Micropigmentação…"
                          className="h-14 rounded-md border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── PASSO 3: Primeiro Serviço ── */}
            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-1 flex-col"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-md gradient-soft text-primary">
                  <Scissors className="h-5 w-5" />
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold leading-tight">
                  Cadastre seu <span className="text-gradient italic">primeiro serviço</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você pode adicionar quantos quiser depois.
                </p>

                <div className="mt-6 space-y-4">
                  {/* Nome do serviço */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Nome do serviço
                    </Label>
                    <Input
                      value={form.service_name}
                      onChange={(e) => set("service_name", e.target.value)}
                      placeholder="Ex: Manicure Completa, Escova, Sobrancelha…"
                      className="h-14 rounded-md border-border bg-card text-base shadow-card focus-visible:ring-primary"
                    />
                  </div>

                  {/* Preço */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Valor cobrado (R$)
                    </Label>
                    <div className="relative">
                      <DollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={form.service_price}
                        onChange={(e) => set("service_price", e.target.value.replace(/[^0-9,\.]/g, ""))}
                        placeholder="120,00"
                        className="h-14 rounded-md border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Duração */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Duração
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {durations.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => set("service_duration", d.value)}
                          className={cn(
                            "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                            form.service_duration === d.value
                              ? "border-primary gradient-primary text-white shadow-glow"
                              : "border-border bg-card text-foreground hover:border-primary/40",
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-md gradient-soft p-4 text-sm text-secondary-foreground">
                  <p className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <strong>Quase lá!</strong> Vamos configurar seu horário padrão (seg–sex 9h–18h).
                      Você pode personalizar tudo depois.
                    </span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── PASSO 4: Endereço ── */}
            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-1 flex-col"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-md gradient-soft text-primary">
                  <Home className="h-5 w-5" />
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold leading-tight">
                  Onde fica o seu <span className="text-gradient italic">studio?</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Digite o CEP e preenchemos o resto para você.
                </p>

                <div className="mt-6 space-y-4">
                  {/* CEP */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      CEP
                    </Label>
                    <div className="relative">
                      {cepLoading
                        ? <Loader2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
                        : <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      }
                      <Input
                        inputMode="numeric"
                        value={form.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className={cn(
                          "h-14 rounded-md border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary font-mono tracking-widest",
                          cepError && "border-red-400 focus-visible:ring-red-400",
                        )}
                      />
                    </div>
                    {cepError && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" /> {cepError}
                      </p>
                    )}
                  </div>

                  <AnimatePresence>
                    {form.city && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        {/* Logradouro */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Logradouro
                          </Label>
                          <Input
                            value={form.street}
                            onChange={(e) => set("street", e.target.value)}
                            placeholder="Rua, Avenida…"
                            className="h-14 rounded-md border-border bg-card text-base shadow-card focus-visible:ring-primary"
                          />
                        </div>

                        {/* Número + Complemento */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Número
                            </Label>
                            <Input
                              value={form.street_number}
                              onChange={(e) => set("street_number", e.target.value)}
                              placeholder="123"
                              className="h-14 rounded-md border-border bg-card text-base shadow-card focus-visible:ring-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Complemento
                            </Label>
                            <Input
                              value={form.address_complement}
                              onChange={(e) => set("address_complement", e.target.value)}
                              placeholder="Sala 2, Apto…"
                              className="h-14 rounded-md border-border bg-card text-base shadow-card focus-visible:ring-primary"
                            />
                          </div>
                        </div>

                        {/* Bairro */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Bairro
                          </Label>
                          <Input
                            value={form.neighborhood}
                            onChange={(e) => set("neighborhood", e.target.value)}
                            placeholder="Bairro"
                            className="h-14 rounded-md border-border bg-card text-base shadow-card focus-visible:ring-primary"
                          />
                        </div>

                        {/* Cidade + UF readonly */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2 space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Cidade
                            </Label>
                            <Input
                              value={form.city}
                              readOnly
                              className="h-14 rounded-md border-border bg-secondary/50 text-base shadow-card cursor-default opacity-70"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              UF
                            </Label>
                            <Input
                              value={form.state}
                              readOnly
                              className="h-14 rounded-md border-border bg-secondary/50 text-center text-base shadow-card cursor-default uppercase opacity-70"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!form.city && !cepLoading && (
                    <p className="text-center text-xs text-muted-foreground">
                      Você pode pular este passo e preencher depois nas configurações.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={next}
            disabled={!canProceed() || saving}
            size="lg"
            className="mb-10 mt-8 h-14 rounded-md gradient-primary text-base font-semibold shadow-glow disabled:opacity-50"
          >
            {saving
              ? "Salvando..."
              : step === totalSteps - 1
              ? "Acessar minha agenda"
              : "Continuar"}
            {!saving && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}
