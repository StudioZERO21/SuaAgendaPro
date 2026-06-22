import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Sparkles, Scissors, Store, Check,
  Eye, Hand, Heart, Flame, Flower2, Star, Brush, MapPin,
  Phone, User, Link2, DollarSign, Clock, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/mobile-shell";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug, isSlugAvailable } from "@/lib/auth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Bem-vinda — SuaAgenda.Pro" },
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
  { id: "Outro",              label: "Outro",             Icon: Star },
];

const durations = [
  { value: "30",  label: "30 min" },
  { value: "45",  label: "45 min" },
  { value: "60",  label: "1 hora" },
  { value: "90",  label: "1h 30" },
  { value: "120", label: "2 horas" },
];

type Form = {
  display_name: string;
  city: string;
  state: string;
  phone: string;
  bio: string;
  slug: string;
  specialty: string;
  service_name: string;
  service_price: string;
  service_duration: string;
};

const INITIAL: Form = {
  display_name: "",
  city: "",
  state: "",
  phone: "",
  bio: "",
  slug: "",
  specialty: "",
  service_name: "",
  service_price: "",
  service_duration: "60",
};

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(INITIAL);
  const [slugError, setSlugError] = useState("");
  const [slugChecking, setSlugChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const totalSteps = 3;

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
    if (step === 1) return form.specialty.length > 0;
    if (step === 2) {
      const price = parseFloat(form.service_price.replace(",", "."));
      return form.service_name.trim().length > 0 && !isNaN(price) && price > 0;
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
          city:                 form.city.trim() || null,
          state:                form.state.trim().substring(0, 2).toUpperCase() || null,
          phone:                form.phone.trim() || null,
          bio:                  form.bio.trim() || null,
          specialty:            form.specialty,
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-soft text-primary">
                  <Store className="h-5 w-5" />
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold leading-tight">
                  Vamos conhecer seu <span className="text-gradient italic">trabalho</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Essas informações aparecem no seu link público.
                </p>

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
                        className="h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
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
                          "h-14 rounded-2xl border-border bg-card pl-11 pr-4 text-base shadow-card focus-visible:ring-primary font-mono",
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

                  {/* Cidade + Estado */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Cidade
                      </Label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={form.city}
                          onChange={(e) => set("city", e.target.value)}
                          placeholder="Onde você atende"
                          className="h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        UF
                      </Label>
                      <Input
                        value={form.state}
                        onChange={(e) => set("state", e.target.value.substring(0, 2).toUpperCase())}
                        placeholder="SP"
                        maxLength={2}
                        className="h-14 rounded-2xl border-border bg-card text-center text-base shadow-card focus-visible:ring-primary uppercase"
                      />
                    </div>
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      WhatsApp (opcional)
                    </Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
                      />
                    </div>
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-soft text-primary">
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
                        onClick={() => set("specialty", n.id)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-soft text-primary">
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
                      className="h-14 rounded-2xl border-border bg-card text-base shadow-card focus-visible:ring-primary"
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
                        className="h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
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

                <div className="mt-6 rounded-2xl gradient-soft p-4 text-sm text-secondary-foreground">
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
          </AnimatePresence>

          <Button
            onClick={next}
            disabled={!canProceed() || saving}
            size="lg"
            className="mb-10 mt-8 h-14 rounded-2xl gradient-primary text-base font-semibold shadow-glow disabled:opacity-50"
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
