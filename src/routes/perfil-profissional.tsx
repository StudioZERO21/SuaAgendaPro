import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Save, Camera, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Cropper, { type Area } from "react-easy-crop";
import { MobileShell } from "@/components/mobile-shell";
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

export const Route = createFileRoute("/perfil-profissional")({
  head: () => ({
    meta: [
      { title: "Perfil do profissional — SuaAgenda.Pro" },
      { name: "description", content: "Edite seus dados pessoais como profissional." },
    ],
  }),
  component: PerfilProfissionalPage,
});

// ── Constants ─────────────────────────────────────────────────

const SPECIALTIES = [
  "Lash Designer", "Cabeleireira", "Manicure",
  "Designer de Sobrancelhas", "Maquiadora", "Esteticista",
  "Depilação", "Outro",
];

const LOCAL_KEY = "sa.perfil-extras";

// Fields that don't have a DB column — persisted to localStorage only
type LocalExtras = {
  instagram:       string;
  experience:      string;
  phoneIsWhatsapp: boolean;
  whatsapp:        string;
};

const EXTRA_DEFAULTS: LocalExtras = {
  instagram:       "",
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
        <section className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full text-3xl font-bold text-white shadow-glow" style={{ background: "linear-gradient(135deg,#fb7185,#f472b6)" }}>
              {photo ? (
                <img src={photo} alt="Foto do perfil" className="h-full w-full object-cover" />
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
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
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
          <div className="space-y-3 rounded-2xl bg-secondary/40 p-4">
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
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold">Atuação</h2>

          <div className="space-y-1.5">
            <Label>Especialidade</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((s) => (
                <button key={s} onClick={() => setSpecialty(s)}
                  className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", specialty === s ? "border-primary bg-primary text-white" : "border-border bg-secondary/60 text-foreground")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="experience">Anos de experiência</Label>
              <Input id="experience" type="number" min={0} value={extras.experience}
                onChange={(e) => setExtras((ex) => ({ ...ex, experience: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" value={extras.instagram} placeholder="@seu_perfil"
                onChange={(e) => setExtras((ex) => ({ ...ex, instagram: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Sobre você</Label>
            <Textarea id="bio" rows={5} maxLength={400} value={bio} onChange={(e) => setBio(e.target.value)} />
            <p className="text-right text-[10px] text-muted-foreground">{bio.length}/400</p>
          </div>
        </section>

        {/* ── Configurações da agenda online ── */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
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
      </main>

      {/* ── Save button ── */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-5 pb-5">
        <Button onClick={handleSave} disabled={saving} size="lg" className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow disabled:opacity-60">
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
          <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-black">
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
