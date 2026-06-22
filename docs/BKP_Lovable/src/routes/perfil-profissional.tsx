import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Save, Camera, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Cropper, { type Area } from "react-easy-crop";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/perfil-profissional")({
  head: () => ({
    meta: [
      { title: "Perfil do profissional — SuaAgenda.Pro" },
      { name: "description", content: "Edite seus dados pessoais como profissional." },
    ],
  }),
  component: PerfilProfissionalPage,
});

const STORAGE_KEY = "sa.perfil-profissional";
const SPECIALTIES = [
  "Lash Designer",
  "Cabeleireira",
  "Manicure",
  "Designer de Sobrancelhas",
  "Maquiadora",
  "Esteticista",
  "Depilação",
  "Outro",
];

type ProfData = {
  name: string;
  email: string;
  phone: string;
  phoneIsWhatsapp: boolean;
  whatsapp: string;
  specialty: string;
  experience: string;
  bio: string;
  instagram: string;
  photo: string; // data URL or ""
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
};

const DEFAULTS: ProfData = {
  name: "Bia Lash",
  email: "bia@suaagenda.pro",
  phone: "(11) 99999-0000",
  phoneIsWhatsapp: true,
  whatsapp: "",
  specialty: "Lash Designer",
  experience: "3",
  bio: "Apaixonada por realçar a beleza natural com técnicas modernas e seguras.",
  instagram: "@bialash",
  photo: "",
  address: {
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  },
};

function load(): ProfData {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      address: { ...DEFAULTS.address, ...(parsed.address ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return d;
}

async function getCroppedImage(src: string, area: Area): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.9);
}

function PerfilProfissionalPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ProfData>(DEFAULTS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    setData(load());
  }, []);

  function set<K extends keyof ProfData>(key: K, value: ProfData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }
  function setAddr<K extends keyof ProfData["address"]>(key: K, value: ProfData["address"][K]) {
    setData((d) => ({ ...d, address: { ...d.address, [key]: value } }));
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const onCropComplete = useCallback((_a: Area, areaPx: Area) => {
    setCroppedArea(areaPx);
  }, []);

  async function confirmCrop() {
    if (!cropSrc || !croppedArea) return;
    try {
      const url = await getCroppedImage(cropSrc, croppedArea);
      set("photo", url);
      setCropSrc(null);
      toast.success("Foto ajustada");
    } catch {
      toast.error("Não foi possível recortar a foto");
    }
  }

  async function lookupCep(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();
      if (json.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setData((d) => ({
        ...d,
        address: {
          ...d.address,
          street: json.logradouro || d.address.street,
          neighborhood: json.bairro || d.address.neighborhood,
          city: json.localidade || d.address.city,
          state: json.uf || d.address.state,
          complement: json.complemento || d.address.complement,
        },
      }));
      toast.success("Endereço preenchido");
    } catch {
      toast.error("Falha ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  }

  function save() {
    if (!data.name.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    toast.success("Perfil atualizado!");
  }

  const initials = getInitials(data.name);

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
            Conta
          </p>
          <h1 className="truncate font-display text-lg font-bold">Perfil do profissional</h1>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-5 pb-32 pt-5">
        {/* Foto / Avatar */}
        <section className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="relative">
            <div
              className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full text-3xl font-bold text-white shadow-glow"
              style={{ background: "linear-gradient(135deg,#fb7185,#f472b6)" }}
            >
              {data.photo ? (
                <img src={data.photo} alt="Foto do perfil" className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            {data.photo && (
              <button
                onClick={() => set("photo", "")}
                className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-background shadow-md ring-1 ring-border"
                aria-label="Remover foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 rounded-full"
          >
            {data.photo ? <Camera className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {data.photo ? "Alterar foto" : "Enviar foto"}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Sem foto, mostramos suas iniciais: <span className="font-semibold">{initials}</span>
          </p>
        </section>

        {/* Dados pessoais */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold">Dados pessoais</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={data.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
            <label className="mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Checkbox
                checked={data.phoneIsWhatsapp}
                onCheckedChange={(v) => set("phoneIsWhatsapp", Boolean(v))}
              />
              Este telefone também é WhatsApp
            </label>
          </div>
          {!data.phoneIsWhatsapp && (
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={data.whatsapp}
                placeholder="(11) 90000-0000"
                onChange={(e) => set("whatsapp", e.target.value)}
              />
            </div>
          )}

          {/* Endereço */}
          <div className="space-y-3 rounded-2xl bg-secondary/40 p-4">
            <h3 className="text-sm font-bold">Endereço do estabelecimento</h3>
            <div className="space-y-1.5">
              <Label htmlFor="cep">CEP</Label>
              <div className="flex gap-2">
                <Input
                  id="cep"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={data.address.cep}
                  onChange={(e) => setAddr("cep", formatCep(e.target.value))}
                  onBlur={(e) => lookupCep(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => lookupCep(data.address.cep)}
                  disabled={cepLoading}
                >
                  {cepLoading ? "..." : "Buscar"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Informe o CEP para preencher rua, bairro e cidade automaticamente.
              </p>
            </div>
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={data.address.street}
                  onChange={(e) => setAddr("street", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={data.address.number}
                  onChange={(e) => setAddr("number", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                placeholder="Sala, andar, referência..."
                value={data.address.complement}
                onChange={(e) => setAddr("complement", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={data.address.neighborhood}
                onChange={(e) => setAddr("neighborhood", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-[1fr_80px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={data.address.city}
                  onChange={(e) => setAddr("city", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">UF</Label>
                <Input
                  id="state"
                  maxLength={2}
                  value={data.address.state}
                  onChange={(e) => setAddr("state", e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Profissional */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold">Atuação</h2>
          <div className="space-y-1.5">
            <Label>Especialidade</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  onClick={() => set("specialty", s)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    data.specialty === s
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-secondary/60 text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="experience">Anos de experiência</Label>
              <Input
                id="experience"
                type="number"
                min={0}
                value={data.experience}
                onChange={(e) => set("experience", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={data.instagram}
                placeholder="@seu_perfil"
                onChange={(e) => set("instagram", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Sobre você</Label>
            <Textarea
              id="bio"
              rows={5}
              maxLength={400}
              value={data.bio}
              onChange={(e) => set("bio", e.target.value)}
            />
            <p className="text-right text-[10px] text-muted-foreground">{data.bio.length}/400</p>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-5 pb-5">
        <Button
          onClick={save}
          size="lg"
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow"
        >
          <Save className="mr-2 h-5 w-5" /> Salvar alterações
        </Button>
      </div>

      {/* Crop Dialog */}
      <Dialog open={!!cropSrc} onOpenChange={(o) => !o && setCropSrc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajuste sua foto</DialogTitle>
          </DialogHeader>
          <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-black">
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="space-y-2 pt-2">
            <Label className="text-xs">Zoom</Label>
            <Slider
              min={1}
              max={3}
              step={0.05}
              value={[zoom]}
              onValueChange={(v) => setZoom(v[0])}
            />
            <p className="text-center text-[11px] text-muted-foreground">
              Arraste para reposicionar e use o zoom para ajustar o corte.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCropSrc(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmCrop} className="gradient-primary text-white">
              Usar foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}
