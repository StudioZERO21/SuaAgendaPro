import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Camera, Upload, X, Loader2, Plus, Share2, Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import Cropper, { type Area } from "react-easy-crop";
import { MobileShell } from "@/components/mobile-shell";
import { LazyImage } from "@/components/ui/lazy-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/usePerfil";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { PhoneInputBR } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROFESSIONAL_SPECIALTIES } from "@/lib/professional-specialties";
import { validatePassword, STRENGTH_COLOR, STRENGTH_LABEL } from "@/lib/password-security";
import { changeUserPassword, requestPasswordReset } from "@/lib/user-password.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/(app)/perfil-profissional")({
  head: () => ({
    meta: [
      { title: "Perfil do profissional — SuaAgenda.Pro" },
      { name: "description", content: "Edite seus dados pessoais como profissional." },
    ],
  }),
  component: PerfilProfissionalPage,
});

// ── Constants ─────────────────────────────────────────────────

const SPECIALTIES = [...PROFESSIONAL_SPECIALTIES];

const LOCAL_KEY = "sa.perfil-extras";

const SOCIAL_NETWORKS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok",    label: "TikTok"    },
  { id: "facebook",  label: "Facebook"  },
  { id: "youtube",   label: "YouTube"   },
  { id: "pinterest", label: "Pinterest" },
  { id: "twitter",   label: "Twitter / X" },
  { id: "linkedin",  label: "LinkedIn"  },
];

type SocialLink = { network: string; handle: string };

// Fields that don't have a DB column — persisted to localStorage only
type LocalExtras = {
  experience:      string;
  phoneIsWhatsapp: boolean;
  whatsapp:        string;
};

const EXTRA_DEFAULTS: LocalExtras = {
  experience:      "",
  phoneIsWhatsapp: true,
  whatsapp:        "",
};

function loadExtras(): LocalExtras {
  if (typeof window === "undefined") return EXTRA_DEFAULTS;
  try {
    return { ...EXTRA_DEFAULTS, ...JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}") };
  } catch { return EXTRA_DEFAULTS; }
}

// ── Helpers ───────────────────────────────────────────────────

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

async function getCroppedImage(src: string, area: Area): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
  });
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.9);
}

// ── Page ─────────────────────────────────────────────────────

function PerfilProfissionalPage() {
  const navigate = useNavigate();
  const { user }       = useAuth();
  const { data: prof, isLoading } = useProfile();
  const updateProfile  = useUpdateProfile();
  const uploadAvatar   = useUploadAvatar();

  // DB-backed fields (local state mirrors DB)
  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [bio,       setBio]       = useState("");
  const [specialty, setSpecialty] = useState("Lash Designer");
  const [city,      setCity]      = useState("");
  const [state,     setState]     = useState("");
  const [cep,           setCep]           = useState("");
  const [street,        setStreet]        = useState("");
  const [streetNumber,  setStreetNumber]  = useState("");
  const [addrComplement,setAddrComplement]= useState("");
  const [neighborhood,  setNeighborhood]  = useState("");
  const [photo,     setPhoto]     = useState(""); // URL or data URL
  const [showPrices,   setShowPrices]   = useState(true);
  const [acceptOnline, setAcceptOnline] = useState(true);

  // Specialty editing mode
  const [editingSpecialty, setEditingSpecialty] = useState(false);
  const [editChip,         setEditChip]         = useState("");
  const [otherSpecialty,   setOtherSpecialty]   = useState("");

  function startEditSpecialty() {
    const isStandard = SPECIALTIES.filter((s) => s !== "Outro").includes(specialty);
    setEditChip(isStandard ? specialty : "Outro");
    setOtherSpecialty(isStandard ? "" : specialty);
    setEditingSpecialty(true);
  }

  function confirmSpecialty() {
    const final = editChip === "Outro" ? otherSpecialty.trim() : editChip;
    if (!final) return;
    setSpecialty(final);
    setEditingSpecialty(false);
  }

  // Segurança — troca de senha
  const [secCurPwd,    setSecCurPwd]    = useState("");
  const [secNewPwd,    setSecNewPwd]    = useState("");
  const [secConfPwd,   setSecConfPwd]   = useState("");
  const [showSecPwd,   setShowSecPwd]   = useState(false);
  const [secSaving,    setSecSaving]    = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetReason,  setResetReason]  = useState("");
  const [resetSent,    setResetSent]    = useState(false);

  const secValidation = validatePassword(secNewPwd);
  const secStrengthPct = secNewPwd.length === 0 ? 0 : Math.max(15, (secValidation.score + 1) * 25);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!secValidation.valid) { toast.error(secValidation.errors[0]); return; }
    if (secNewPwd !== secConfPwd) { toast.error("As senhas não coincidem."); return; }
    if (secNewPwd === secCurPwd) { toast.error("A nova senha deve ser diferente da atual."); return; }
    setSecSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");
      await changeUserPassword({
        data: { currentPassword: secCurPwd, newPassword: secNewPwd },
        headers: { authorization: `Bearer ${token}` },
      });
      toast.success("Senha alterada com sucesso! Faça login novamente.");
      setSecCurPwd(""); setSecNewPwd(""); setSecConfPwd("");
      await supabase.auth.signOut();
      navigate({ to: "/login", replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar senha.");
    } finally { setSecSaving(false); }
  }

  async function handleRequestReset() {
    setResetLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sessão expirada.");
      await requestPasswordReset({
        data: { reason: resetReason.trim() || undefined },
        headers: { authorization: `Bearer ${token}` },
      });
      setResetSent(true);
      toast.success("Solicitação enviada! O time irá analisar e enviar um link por email.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao solicitar reset.");
    } finally { setResetLoading(false); }
  }

  // DB-backed social links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  // localStorage-only extras
  const [extras, setExtras] = useState<LocalExtras>(EXTRA_DEFAULTS);

  // Populate from DB on first load
  useEffect(() => {
    if (!prof) return;
    setName(prof.display_name ?? "");
    setPhone(prof.phone ?? "");
    setBio(prof.bio ?? "");
    setSpecialty(prof.specialty ?? "Lash Designer");
    setCity(prof.city ?? "");
    setState(prof.state ?? "");
    setCep(prof.cep ?? "");
    setStreet(prof.street ?? "");
    setStreetNumber(prof.street_number ?? "");
    setAddrComplement(prof.address_complement ?? "");
    setNeighborhood(prof.neighborhood ?? "");
    setSocialLinks(Array.isArray(prof.social_links) ? (prof.social_links as SocialLink[]) : []);
    setPhoto(prof.avatar_url ?? "");
    setShowPrices(prof.show_prices);
    setAcceptOnline(prof.accept_online);
    setExtras(loadExtras());
  }, [prof]);

  // ── Photo crop ────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc]       = useState<string | null>(null);
  const [crop, setCrop]             = useState({ x: 0, y: 0 });
  const [zoom, setZoom]             = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem"); return; }
    const reader = new FileReader();
    reader.onload = () => { setCropSrc(reader.result as string); setCrop({ x: 0, y: 0 }); setZoom(1); };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const onCropComplete = useCallback((_a: Area, areaPx: Area) => setCroppedArea(areaPx), []);

  async function confirmCrop() {
    if (!cropSrc || !croppedArea) return;
    try {
      const dataUrl = await getCroppedImage(cropSrc, croppedArea);
      setCropSrc(null);
      // Upload to Supabase Storage
      const publicUrl = await uploadAvatar.mutateAsync(dataUrl);
      setPhoto(publicUrl);
      toast.success("Foto atualizada");
    } catch {
      toast.error("Não foi possível salvar a foto");
    }
  }

  // ── CEP lookup ────────────────────────────────────────────
  function addSocialLink() {
    const usedNetworks = new Set(socialLinks.map((l) => l.network));
    const next = SOCIAL_NETWORKS.find((n) => !usedNetworks.has(n.id));
    setSocialLinks((ls) => [...ls, { network: next?.id ?? "instagram", handle: "" }]);
  }
  function removeSocialLink(i: number) {
    setSocialLinks((ls) => ls.filter((_, idx) => idx !== i));
  }
  function updateSocialLink(i: number, field: keyof SocialLink, value: string) {
    setSocialLinks((ls) => ls.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }

  const [cepLoading, setCepLoading] = useState(false);

  async function lookupCep(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const json = await (await fetch(`https://viacep.com.br/ws/${digits}/json/`)).json();
      if (json.erro) { toast.error("CEP não encontrado"); return; }
      setStreet(json.logradouro  || street);
      setNeighborhood(json.bairro || neighborhood);
      setAddrComplement(json.complemento || addrComplement);
      setCity(json.localidade || city);
      setState(json.uf || state);
      toast.success("Endereço preenchido");
    } catch {
      toast.error("Falha ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  }

  // ── Save ──────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { toast.error("Informe seu nome"); return; }
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        display_name:       name.trim(),
        phone:              phone.trim()          || null,
        bio:                bio.trim()            || null,
        specialty:          specialty             || null,
        cep:                cep.trim()            || null,
        street:             street.trim()         || null,
        street_number:      streetNumber.trim()   || null,
        address_complement: addrComplement.trim() || null,
        neighborhood:       neighborhood.trim()   || null,
        city:               city.trim()           || null,
        state:              state.trim()          || null,
        social_links:       socialLinks.filter((l) => l.handle.trim()),
        show_prices:        showPrices,
        accept_online:      acceptOnline,
      });
      // Save non-DB extras to localStorage
      localStorage.setItem(LOCAL_KEY, JSON.stringify(extras));
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const initials = getInitials(name);
  const email    = user?.email ?? "";

  if (isLoading) {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileShell>
    );
  }

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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Conta</p>
          <h1 className="truncate font-display text-lg font-bold">Perfil do profissional</h1>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-5 pb-32 pt-5">
        {/* ── Foto ── */}
        <section className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 shadow-card">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full text-3xl font-bold text-white shadow-glow" style={{ background: "var(--gradient-primary)" }}>
              {photo ? (
                <LazyImage src={photo} alt="Foto do perfil" priority width={112} height={112} className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            {photo && (
              <button onClick={() => { setPhoto(""); updateProfile.mutate({ avatar_url: null }); }}
                className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-background shadow-md ring-1 ring-border"
                aria-label="Remover foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2 rounded-full" disabled={uploadAvatar.isPending}>
            {uploadAvatar.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : photo ? <Camera className="h-4 w-4" /> : <Upload className="h-4 w-4" />
            }
            {photo ? "Alterar foto" : "Enviar foto"}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Sem foto, mostramos suas iniciais: <span className="font-semibold">{initials}</span>
          </p>
        </section>

        {/* ── Dados pessoais ── */}
        <section className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold">Dados pessoais</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} readOnly className="opacity-60" />
            <p className="text-[10px] text-muted-foreground">Para alterar o e-mail, entre em contato com o suporte.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <PhoneInputBR id="phone" value={phone} onChange={setPhone} />
            <label className="mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Checkbox
                checked={extras.phoneIsWhatsapp}
                onCheckedChange={(v) => setExtras((ex) => ({ ...ex, phoneIsWhatsapp: Boolean(v) }))}
              />
              Este telefone também é WhatsApp
            </label>
          </div>

          {!extras.phoneIsWhatsapp && (
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <PhoneInputBR id="whatsapp" value={extras.whatsapp} onChange={(v) => setExtras((ex) => ({ ...ex, whatsapp: v }))} />
            </div>
          )}

          {/* Endereço */}
          <div className="space-y-3 rounded-md bg-secondary/40 p-4">
            <h3 className="text-sm font-bold">Endereço do estabelecimento</h3>
            <div className="space-y-1.5">
              <Label htmlFor="cep">CEP</Label>
              <div className="flex gap-2">
                <Input id="cep" inputMode="numeric" placeholder="00000-000" value={cep}
                  onChange={(e) => setCep(formatCep(e.target.value))}
                  onBlur={(e) => lookupCep(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={() => lookupCep(cep)} disabled={cepLoading}>
                  {cepLoading ? "..." : "Buscar"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">O CEP preenche rua, bairro e cidade automaticamente.</p>
            </div>
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="street">Rua</Label>
                <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="number">Número</Label>
                <Input id="number" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" placeholder="Sala, andar..." value={addrComplement} onChange={(e) => setAddrComplement(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            </div>
            <div className="grid grid-cols-[1fr_80px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">UF</Label>
                <Input id="state" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Atuação profissional ── */}
        <section className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold">Atuação</h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Especialidade</Label>
              {!editingSpecialty && (
                <button
                  type="button"
                  onClick={startEditSpecialty}
                  className="text-xs font-semibold text-primary underline underline-offset-2"
                >
                  Atualizar
                </button>
              )}
            </div>

            {!editingSpecialty ? (
              /* Display mode: show current specialty */
              <span className="inline-block rounded-full border border-primary bg-primary px-4 py-1.5 text-xs font-semibold text-white">
                {specialty || "Não definida"}
              </span>
            ) : (
              /* Edit mode: chips + optional text input */
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((s) => (
                    <button key={s} type="button" onClick={() => setEditChip(s)}
                      className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        editChip === s ? "border-primary bg-primary text-white" : "border-border bg-secondary/60 text-foreground")}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {editChip === "Outro" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <Input
                        autoFocus
                        value={otherSpecialty}
                        onChange={(e) => setOtherSpecialty(e.target.value)}
                        placeholder="Qual é a sua especialidade?"
                        className="rounded-xl"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={confirmSpecialty}
                    disabled={editChip === "Outro" && otherSpecialty.trim().length < 2}
                    className="rounded-xl gradient-primary text-white shadow-glow"
                  >
                    Confirmar
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingSpecialty(false)}
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="experience">Anos de experiência</Label>
            <Input id="experience" type="number" min={0} value={extras.experience}
              onChange={(e) => setExtras((ex) => ({ ...ex, experience: e.target.value }))}
              className="max-w-[140px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Sobre você</Label>
            <Textarea id="bio" rows={5} maxLength={400} value={bio} onChange={(e) => setBio(e.target.value)} />
            <p className="text-right text-[10px] text-muted-foreground">{bio.length}/400</p>
          </div>
        </section>

        {/* ── Redes Sociais ── */}
        <section className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Redes Sociais</h2>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Share2 className="h-3.5 w-3.5" /> {socialLinks.length} {socialLinks.length === 1 ? "rede" : "redes"}
            </span>
          </div>

          {socialLinks.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma rede social cadastrada.</p>
          )}

          <div className="space-y-3">
            {socialLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select value={link.network} onValueChange={(v) => updateSocialLink(i, "network", v)}>
                  <SelectTrigger className="w-[130px] shrink-0 rounded-xl border-border bg-secondary/50 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOCIAL_NETWORKS.map((n) => (
                      <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={link.handle}
                  onChange={(e) => updateSocialLink(i, "handle", e.target.value)}
                  placeholder="@usuario"
                  className="flex-1 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => removeSocialLink(i)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted-foreground transition hover:border-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {socialLinks.length < SOCIAL_NETWORKS.length && (
            <button
              type="button"
              onClick={addSocialLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" /> Adicionar rede social
            </button>
          )}
        </section>

        {/* ── Configurações da agenda online ── */}
        <section className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold">Agenda online</h2>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Aceitar agendamentos online</p>
              <p className="text-xs text-muted-foreground">Clientes podem agendar pela sua página pública.</p>
            </div>
            <Switch checked={acceptOnline} onCheckedChange={setAcceptOnline} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Mostrar preços</p>
              <p className="text-xs text-muted-foreground">Exibe os valores dos serviços na página pública.</p>
            </div>
            <Switch checked={showPrices} onCheckedChange={setShowPrices} />
          </div>
        </section>

        {/* ── Segurança — Troca de senha ── */}
        <section className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl gradient-primary">
              <Lock className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-display text-base font-bold">Segurança</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alterar senha</p>

            {/* Senha atual */}
            <div className="space-y-1.5">
              <Label htmlFor="sec-cur-pwd">Senha atual</Label>
              <div className="relative">
                <Input
                  id="sec-cur-pwd"
                  type={showSecPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={secCurPwd}
                  onChange={(e) => setSecCurPwd(e.target.value)}
                  className="pr-10 rounded-xl"
                  required
                />
                <button type="button" onClick={() => setShowSecPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showSecPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Nova senha */}
            <div className="space-y-1.5">
              <Label htmlFor="sec-new-pwd">Nova senha</Label>
              <div className="relative">
                <Input
                  id="sec-new-pwd"
                  type={showSecPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={secNewPwd}
                  onChange={(e) => setSecNewPwd(e.target.value)}
                  className="pr-10 rounded-xl"
                  required
                />
                <button type="button" onClick={() => setShowSecPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showSecPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Barra de força */}
              {secNewPwd.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex h-1.5 gap-1 overflow-hidden rounded-full">
                    {[0,1,2,3].map((i) => (
                      <div key={i} className={cn(
                        "h-full flex-1 rounded-full transition-all duration-300",
                        i <= secValidation.score ? STRENGTH_COLOR[secValidation.strength] : "bg-border"
                      )} />
                    ))}
                  </div>
                  <p className={cn("text-[11px] font-semibold",
                    secValidation.score <= 1 ? "text-destructive" :
                    secValidation.score === 2 ? "text-amber-600" : "text-emerald-600"
                  )}>
                    Força: {STRENGTH_LABEL[secValidation.strength]}
                  </p>

                  {/* Checklist de requisitos */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                    {[
                      [secValidation.checks.length,    "12+ caracteres"],
                      [secValidation.checks.uppercase, "Maiúscula (A-Z)"],
                      [secValidation.checks.lowercase, "Minúscula (a-z)"],
                      [secValidation.checks.number,    "Número (0-9)"],
                      [secValidation.checks.special,   "Símbolo (!@#...)"],
                      [secValidation.checks.notCommon, "Não é comum"],
                    ].map(([ok, label]) => (
                      <span key={label as string} className={cn(
                        "flex items-center gap-1 text-[11px]",
                        ok ? "text-emerald-600" : "text-muted-foreground"
                      )}>
                        {ok
                          ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                          : <XCircle className="h-3 w-3 shrink-0 text-border" />}
                        {label as string}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar nova senha */}
            <div className="space-y-1.5">
              <Label htmlFor="sec-conf-pwd">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="sec-conf-pwd"
                  type={showSecPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={secConfPwd}
                  onChange={(e) => setSecConfPwd(e.target.value)}
                  className={cn("pr-10 rounded-xl", secConfPwd && secConfPwd !== secNewPwd && "border-destructive focus-visible:ring-destructive")}
                  required
                />
                <button type="button" onClick={() => setShowSecPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showSecPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {secConfPwd && secConfPwd !== secNewPwd && (
                <p className="text-[11px] text-destructive">As senhas não coincidem.</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={secSaving || !secValidation.valid || secNewPwd !== secConfPwd || !secCurPwd}
              className="w-full rounded-xl gradient-primary text-white"
            >
              {secSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              Alterar senha
            </Button>
          </form>

          {/* Divisor */}
          <div className="border-t border-border" />

          {/* Reset de senha via super admin */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold">Não consegue acessar?</p>
            </div>
            {resetSent ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700 dark:bg-emerald-950/30">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p className="text-sm">Solicitação enviada! Você receberá um email assim que for aprovado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Esqueceu a senha? Solicite um reset — nossa equipe irá analisar e enviar um link por email.
                </p>
                <textarea
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Motivo (opcional): ex. esqueci minha senha..."
                  rows={2}
                  maxLength={300}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resetLoading}
                  onClick={handleRequestReset}
                  className="w-full rounded-xl"
                >
                  {resetLoading
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <ShieldAlert className="mr-2 h-4 w-4" />}
                  Solicitar reset de senha
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── Save button ── */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-5 pb-5">
        <Button onClick={handleSave} disabled={saving} size="lg" className="h-14 w-full rounded-md gradient-primary text-base font-semibold text-white shadow-glow disabled:opacity-60">
          {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Salvar alterações
        </Button>
      </div>

      {/* ── Crop Dialog ── */}
      <Dialog open={!!cropSrc} onOpenChange={(o) => !o && setCropSrc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajuste sua foto</DialogTitle>
          </DialogHeader>
          <div className="relative h-72 w-full overflow-hidden rounded-md bg-black">
            {cropSrc && (
              <Cropper
                image={cropSrc} crop={crop} zoom={zoom} aspect={1}
                cropShape="round" showGrid={false}
                onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="space-y-2 pt-2">
            <Label className="text-xs">Zoom</Label>
            <Slider min={1} max={3} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
            <p className="text-center text-[11px] text-muted-foreground">Arraste para reposicionar e use o zoom para ajustar o corte.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCropSrc(null)}>Cancelar</Button>
            <Button onClick={confirmCrop} disabled={uploadAvatar.isPending} className="gradient-primary text-white">
              {uploadAvatar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Usar foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}
