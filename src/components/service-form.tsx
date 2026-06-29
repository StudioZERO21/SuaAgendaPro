import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft, Clock, DollarSign, Sparkles, Trash2, Scissors,
  AlertCircle, Percent, ToggleLeft, ImagePlus, X,
} from "lucide-react";
import { z } from "zod";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MobileShell } from "@/components/mobile-shell";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useService, useCreateService, useUpdateService, useDeleteService,
  formatDuration, parsePriceToCents,
} from "@/hooks/useServicos";
import { serviceCategories } from "@/lib/services-store";
import { supabase } from "@/integrations/supabase/client";
import { uploadBlob } from "@/lib/storage";

export type ServiceFormProps = {
  serviceId?: string;
};

const schema = z.object({
  name:             z.string().min(2, "Nome muito curto").max(100, "Nome muito longo"),
  description:      z.string().max(400, "Descrição muito longa").optional(),
  price_raw:        z.string().min(1, "Informe o preço"),
  duration_minutes: z.number().min(15, "Mínimo 15 min").max(480, "Máximo 8 horas"),
  deposit_type:     z.enum(["none", "percent", "fixed"]),
  deposit_value:    z.number().min(0),
});

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 150, 180];

// Card: ~200×176px displayed → 2× for retina
const CARD_W = 400;
const CARD_H = 352;
const CARD_ASPECT = CARD_W / CARD_H; // ≈ 1.136

async function cropAndProcess(src: string, crop: Area): Promise<{ blob: Blob; preview: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext("2d")!;

      // White/near-white base (matches card bg)
      ctx.fillStyle = "#f8f8f8";
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      // Bake 75% transparency: draw image at 25% opacity
      ctx.globalAlpha = 0.25;
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, CARD_W, CARD_H);
      ctx.globalAlpha = 1;

      // JPEG 60% quality → ~10–25 KB
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("toBlob failed")); return; }
          resolve({ blob, preview: canvas.toDataURL("image/jpeg", 0.6) });
        },
        "image/jpeg",
        0.6,
      );
    };
    img.src = src;
  });
}

export function ServiceForm({ serviceId }: ServiceFormProps) {
  const navigate = useNavigate();
  const editing = Boolean(serviceId);

  const { data: existing, isLoading } = useService(serviceId ?? "");
  const createService  = useCreateService();
  const updateService  = useUpdateService();
  const deleteService  = useDeleteService();

  // Form fields
  const [name, setName]                   = useState("");
  const [description, setDescription]     = useState("");
  const [priceRaw, setPriceRaw]           = useState("");
  const [duration, setDuration]           = useState(60);
  const [depositType, setDepositType]     = useState<"none" | "percent" | "fixed">("none");
  const [depositValue, setDepositValue]   = useState("");
  const [category, setCategory]           = useState("other");
  const [categoryLabel, setCategoryLabel] = useState("");
  const [errors, setErrors]               = useState<Record<string, string>>({});

  // Image states
  const [imageUrl, setImageUrl]         = useState<string | null>(null);   // saved URL in DB
  const [imagePreview, setImagePreview] = useState<string | null>(null);   // processed preview
  const [imageBlob, setImageBlob]       = useState<Blob | null>(null);     // processed blob to upload

  // Crop states
  const [cropSrc, setCropSrc]                   = useState<string | null>(null);
  const [crop, setCrop]                         = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                         = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing]             = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description ?? "");
      setPriceRaw(String((existing.price_cents / 100).toFixed(2)).replace(".", ","));
      setDuration(existing.duration_minutes);
      setDepositType(existing.deposit_type as "none" | "percent" | "fixed");
      setDepositValue(
        existing.deposit_type === "none"
          ? ""
          : existing.deposit_type === "percent"
          ? String(existing.deposit_value)
          : String((existing.deposit_value / 100).toFixed(2)).replace(".", ","),
      );
      setCategory(existing.category || "other");
      setCategoryLabel(existing.category_label || "");
      setImageUrl(existing.image_url || null);
    }
  }, [existing]);

  useEffect(() => {
    if (editing && serviceId && !isLoading && !existing) {
      toast.error("Serviço não encontrado");
      navigate({ to: "/servicos" });
    }
  }, [editing, serviceId, isLoading, existing, navigate]);

  const priceCents = parsePriceToCents(priceRaw);
  const depositCents =
    depositType === "percent"
      ? Number(depositValue) || 0
      : depositType === "fixed"
      ? parsePriceToCents(depositValue)
      : 0;

  function previewDeposit() {
    if (depositType === "none") return null;
    if (depositType === "percent") {
      const pct = Number(depositValue) || 0;
      return `${pct}% = R$ ${((priceCents * pct) / 100 / 100).toFixed(2).replace(".", ",")}`;
    }
    if (depositCents > 0) return `Fixo: R$ ${(depositCents / 100).toFixed(2).replace(".", ",")}`;
    return null;
  }

  // Pick image → open crop dialog
  function onImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function confirmCrop() {
    if (!cropSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const { blob, preview } = await cropAndProcess(cropSrc, croppedAreaPixels);
      setImageBlob(blob);
      setImagePreview(preview);
      setImageUrl(null);
      setCropSrc(null);
    } catch {
      toast.error("Erro ao processar imagem");
    } finally {
      setProcessing(false);
    }
  }

  function removeImage() {
    setImageBlob(null);
    setImagePreview(null);
    setImageUrl(null);
  }

  async function uploadImage(id: string): Promise<string | null> {
    if (!imageBlob) return imageUrl;
    const url = await uploadBlob(imageBlob, "services", `${id}.jpg`);
    return `${url}?t=${Date.now()}`;
  }

  async function handleSave() {
    const result = schema.safeParse({
      name:             name.trim(),
      description:      description.trim() || undefined,
      price_raw:        priceRaw,
      duration_minutes: duration,
      deposit_type:     depositType,
      deposit_value:    depositCents,
    });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { if (!errs[i.path[0]]) errs[i.path[0]] = i.message; });
      setErrors(errs);
      return;
    }
    if (priceCents <= 0) { setErrors({ price_raw: "Preço deve ser maior que zero" }); return; }
    if (category === "other" && !categoryLabel.trim()) {
      setErrors({ categoryLabel: "Informe o nome da categoria" }); return;
    }
    setErrors({});

    const finalLabel = category === "other" ? categoryLabel.trim() : "";

    try {
      if (editing && existing) {
        const newImageUrl = await uploadImage(existing.id);
        await updateService.mutateAsync({
          id: existing.id,
          name:             name.trim(),
          description:      description.trim() || null,
          price_cents:      priceCents,
          duration_minutes: duration,
          deposit_type:     depositType,
          deposit_value:    depositCents,
          is_active:        true,
          category,
          category_label:   finalLabel || null,
          image_url:        newImageUrl,
        });
        toast.success("Serviço atualizado ✨");
      } else {
        const created = await createService.mutateAsync({
          name:             name.trim(),
          description:      description.trim() || null,
          price_cents:      priceCents,
          duration_minutes: duration,
          deposit_type:     depositType,
          deposit_value:    depositCents,
          is_active:        true,
          category,
          category_label:   finalLabel || null,
          image_url:        null,
        });
        if (imageBlob) {
          const newImageUrl = await uploadImage(created.id);
          if (newImageUrl) await updateService.mutateAsync({ id: created.id, image_url: newImageUrl });
        }
        toast.success("Serviço criado ✨");
      }
      navigate({ to: "/servicos" });
    } catch {
      toast.error("Erro ao salvar serviço. Tente novamente.");
    }
  }

  async function handleDelete() {
    if (!existing) return;
    try {
      await deleteService.mutateAsync(existing.id);
      toast.success("Serviço removido");
      navigate({ to: "/servicos" });
    } catch {
      toast.error("Erro ao remover serviço.");
    }
  }

  const isSaving = createService.isPending || updateService.isPending;
  const validPreview = name.trim().length > 0;
  const currentImage = imagePreview || imageUrl;

  if (editing && isLoading) {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MobileShell>
    );
  }

  return (
    <>
      <MobileShell>
        <div className="relative flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background/90 px-5 pb-3 pt-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate({ to: "/servicos" })}
                className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {editing ? "Editar" : "Novo"} serviço
              </p>
              <div className="w-10" />
            </div>
          </header>

          {/* Hero preview */}
          <section className="px-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl gradient-primary p-5 text-white shadow-glow"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold leading-tight">
                    {validPreview ? name : "Nome do serviço"}
                  </p>
                  <p className="text-xs text-white/80">
                    {duration > 0 ? formatDuration(duration) : "—"} ·{" "}
                    {priceCents > 0
                      ? `R$ ${(priceCents / 100).toFixed(2).replace(".", ",")}`
                      : "R$ —"}
                    {depositType !== "none" && previewDeposit() && <> · Sinal: {previewDeposit()}</>}
                  </p>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Form */}
          <main className="mt-6 flex-1 space-y-5 px-5 pb-32">

            {/* Nome */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nome do serviço *
              </Label>
              <Input
                autoFocus={!editing}
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                placeholder="Ex: Manicure Completa"
                maxLength={100}
                className={cn(
                  "h-14 rounded-2xl border-border bg-card text-base shadow-card focus-visible:ring-primary",
                  errors.name && "border-red-400",
                )}
              />
              {errors.name && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
            </div>

            {/* Categoria */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categoria
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {serviceCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setCategory(cat.id); setErrors((p) => ({ ...p, categoryLabel: "" })); }}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center text-[10px] font-semibold transition-all",
                      category === cat.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="leading-tight">{cat.id === "other" ? "Outro" : cat.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
              {category === "other" && (
                <div className="space-y-1.5">
                  <Input
                    value={categoryLabel}
                    onChange={(e) => { setCategoryLabel(e.target.value); setErrors((p) => ({ ...p, categoryLabel: "" })); }}
                    placeholder="Ex: Massagem, Bronzeamento, Laser..."
                    maxLength={60}
                    className={cn(
                      "h-12 rounded-xl border-border bg-card text-sm shadow-card focus-visible:ring-primary",
                      errors.categoryLabel && "border-red-400",
                    )}
                  />
                  {errors.categoryLabel && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />{errors.categoryLabel}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Imagem de fundo do card */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Imagem de fundo do card (opcional)
              </Label>
              {currentImage ? (
                <div className="relative overflow-hidden rounded-2xl border border-border/60">
                  {/* Preview na proporção real do card */}
                  <div className="relative w-full" style={{ aspectRatio: `${CARD_W}/${CARD_H}` }}>
                    <img src={currentImage} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                      <p className="text-[10px] text-white/80">Proporção real do card (transparência aplicada)</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex h-24 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-secondary/60"
                >
                  <ImagePlus className="h-5 w-5" />
                  Escolher e ajustar imagem
                </button>
              )}
              {currentImage && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Trocar imagem
                </button>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImagePick} />
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Preço (R$) *
              </Label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  inputMode="decimal"
                  value={priceRaw}
                  onChange={(e) => { setPriceRaw(e.target.value.replace(/[^0-9.,]/g, "")); setErrors((p) => ({ ...p, price_raw: "" })); }}
                  placeholder="120,00"
                  className={cn(
                    "h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary",
                    errors.price_raw && "border-red-400",
                  )}
                />
              </div>
              {errors.price_raw && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{errors.price_raw}</p>}
            </div>

            {/* Duração */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Duração *
              </Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  inputMode="numeric"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value.replace(/\D/g, "")) || 0)}
                  placeholder="60"
                  className="h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
                />
              </div>
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {DURATION_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDuration(m)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      duration === m
                        ? "gradient-primary border-transparent text-white shadow-glow"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {formatDuration(m)}
                  </button>
                ))}
              </div>
            </div>

            {/* Depósito */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
              <div>
                <p className="text-sm font-semibold">Sinal / Depósito</p>
                <p className="text-xs text-muted-foreground">Valor cobrado antecipadamente para confirmar o agendamento.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "none",    label: "Nenhum",    Icon: ToggleLeft },
                  { id: "percent", label: "Percentual", Icon: Percent },
                  { id: "fixed",   label: "Fixo R$",    Icon: DollarSign },
                ] as const).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setDepositType(id); setDepositValue(""); }}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition-all",
                      depositType === id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
              {depositType !== "none" && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {depositType === "percent" ? "Percentual (0–100)" : "Valor fixo (R$)"}
                  </Label>
                  <Input
                    inputMode="decimal"
                    value={depositValue}
                    onChange={(e) => setDepositValue(e.target.value.replace(/[^0-9.,]/g, ""))}
                    placeholder={depositType === "percent" ? "50" : "30,00"}
                    className="h-12 rounded-xl"
                  />
                  {previewDeposit() && <p className="text-xs font-medium text-primary">{previewDeposit()}</p>}
                </div>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Descrição (opcional)
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="O que está incluso, observações..."
                maxLength={400}
                rows={3}
                className="resize-none rounded-2xl border-border bg-card text-sm shadow-card focus-visible:ring-primary"
              />
              <p className="text-right text-[10px] text-muted-foreground">{description.length}/400</p>
            </div>

            {/* Delete */}
            {editing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-card py-3.5 text-sm font-semibold text-destructive transition hover:bg-destructive/5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Desativar serviço
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desativar serviço?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O serviço ficará oculto no agendamento público mas os registros históricos serão mantidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Desativar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </main>

          {/* Sticky save */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 backdrop-blur-xl">
            <div className="mx-auto max-w-md">
              <Button
                onClick={handleSave}
                disabled={isSaving || processing}
                size="lg"
                className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold shadow-glow disabled:opacity-50"
              >
                <Scissors className="mr-2 h-4 w-4" />
                {isSaving ? "Salvando..." : editing ? "Salvar alterações" : "Criar serviço"}
              </Button>
            </div>
          </div>
        </div>
      </MobileShell>

      {/* Crop dialog — fora do MobileShell para evitar overflow-hidden */}
      <Dialog open={!!cropSrc} onOpenChange={(o) => !o && setCropSrc(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="font-display text-lg">Ajustar imagem do card</DialogTitle>
          </DialogHeader>

          {/* Crop area — proporção real do card (400:352 ≈ 8:7) */}
          <div className="relative mx-4 overflow-hidden rounded-2xl bg-secondary/60" style={{ aspectRatio: `${CARD_W}/${CARD_H}` }}>
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={CARD_ASPECT}
                minZoom={0.5}
                maxZoom={4}
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          {/* Zoom slider */}
          <div className="px-5 pt-3">
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-1 text-center text-[10px] text-muted-foreground">
              Arraste para reposicionar · deslize para zoom
            </p>
          </div>

          <DialogFooter className="gap-2 px-5 pb-5 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setCropSrc(null)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl gradient-primary text-white"
              disabled={processing}
              onClick={confirmCrop}
            >
              {processing ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
