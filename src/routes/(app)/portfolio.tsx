import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ImagePlus,
  X,
  Pencil,
  ArrowUp,
  ArrowDown,
  Tag,
  Loader2,
  CropIcon,
  Check,
} from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";
import { MobileShell } from "@/components/mobile-shell";
import { LazyImage } from "@/components/ui/lazy-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  usePortfolio,
  useAddPortfolioItem,
  useUpdatePortfolioItem,
  useDeletePortfolioItem,
  useReorderPortfolio,
  MAX_PORTFOLIO_ITEMS,
  type UIPortfolioItem,
} from "@/hooks/usePortfolio";

export const Route = createFileRoute("/(app)/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfólio — SuaAgenda.Pro" },
      { name: "description", content: "Divulgue até 10 trabalhos com fotos 9:16." },
    ],
  }),
  component: PortfolioPage,
});

const TARGET_W = 720;
const TARGET_H = 1280; // 9:16
const ASPECT = TARGET_W / TARGET_H; // 0.5625

const CAT_KEY = "sa.portfolio-categories";
const DEFAULT_CATS = ["Cabelo", "Unhas", "Cílios", "Sobrancelhas", "Maquiagem", "Outro"];

function loadCats(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CAT_KEY) ?? "null") ?? DEFAULT_CATS;
  } catch {
    return DEFAULT_CATS;
  }
}

function saveCats(cats: string[]) {
  try {
    localStorage.setItem(CAT_KEY, JSON.stringify(cats));
  } catch {}
}

async function cropToBlob(src: string, pixelCrop: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    TARGET_W,
    TARGET_H,
  );
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("canvas empty"))), "image/jpeg", 0.82),
  );
}

function PortfolioPage() {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = usePortfolio();
  const addItem    = useAddPortfolioItem();
  const updateItem = useUpdatePortfolioItem();
  const deleteItem = useDeletePortfolioItem();
  const reorder    = useReorderPortfolio();

  const [categories, setCategories] = useState<string[]>([]);
  const [editing, setEditing]       = useState<UIPortfolioItem | null>(null);
  const [preview, setPreview]       = useState<UIPortfolioItem | null>(null);
  const [catOpen, setCatOpen]       = useState(false);
  const [newCat, setNewCat]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Crop states
  const [cropSrc, setCropSrc]                       = useState<string | null>(null);
  const [crop, setCrop]                             = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                             = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels]   = useState<Area | null>(null);
  const [processing, setProcessing]                 = useState(false);

  useEffect(() => { setCategories(loadCats()); }, []);
  useEffect(() => { if (categories.length > 0) saveCats(categories); }, [categories]);

  const isBusy = addItem.isPending || deleteItem.isPending || reorder.isPending;

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (items.length >= MAX_PORTFOLIO_ITEMS) {
      toast.error(`Limite de ${MAX_PORTFOLIO_ITEMS} fotos.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const confirmCrop = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await cropToBlob(cropSrc, croppedAreaPixels);
      const dataUrl = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(blob);
      });
      setCropSrc(null);
      const novo = await addItem.mutateAsync({ dataUrl, currentCount: items.length });
      setEditing({ ...novo, category: categories[0] ?? "Outro" });
      toast.success("Foto enviada com sucesso!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Não foi possível processar a imagem.");
    } finally {
      setProcessing(false);
    }
  };

  const save = async (it: UIPortfolioItem) => {
    try {
      await updateItem.mutateAsync({ id: it.id, title: it.title, description: it.description });
      setEditing(null);
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      setEditing(null);
      setPreview(null);
      toast.success("Foto removida.");
    } catch {
      toast.error("Erro ao remover foto.");
    }
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = items.findIndex((p) => p.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    reorder.mutate(next.map((item, idx) => ({ id: item.id, order_index: idx })));
  };

  const addCategory = () => {
    const name = newCat.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast.error("Categoria já existe.");
      return;
    }
    setCategories((c) => [...c, name]);
    setNewCat("");
    toast.success("Categoria adicionada.");
  };

  const removeCategory = (name: string) => {
    if (categories.length <= 1) {
      toast.error("Mantenha ao menos 1 categoria.");
      return;
    }
    setCategories((c) => c.filter((x) => x !== name));
  };

  return (
    <>
      <MobileShell>
        <header className="flex items-center gap-2 px-5 pt-6">
          <button
            onClick={() => navigate({ to: "/mais" })}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Studio
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight">Portfólio</h1>
          </div>
          <button
            onClick={() => setCatOpen(true)}
            className="flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-semibold"
            aria-label="Gerenciar categorias"
          >
            <Tag className="h-3.5 w-3.5" /> Categorias
          </button>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            {items.length}/{MAX_PORTFOLIO_ITEMS}
          </span>
        </header>

        <main className="mt-5 flex-1 px-5 pb-8">
          <p className="text-xs text-muted-foreground">
            Envie até {MAX_PORTFOLIO_ITEMS} fotos. Ajuste o enquadramento antes de salvar.
            Use as setas para reorganizar a ordem da sua página pública.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />

          {isLoading ? (
            <div className="mt-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isBusy}
              className="mt-5 flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-border bg-card text-muted-foreground transition hover:bg-secondary/60 disabled:opacity-60"
            >
              {addItem.isPending ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              ) : (
                <ImagePlus className="h-10 w-10 text-primary" />
              )}
              <span className="text-sm font-semibold">Adicionar primeira foto</span>
              <span className="text-[11px]">JPG ou PNG · formato 9:16</span>
            </button>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className="group relative overflow-hidden rounded-md border border-border bg-card shadow-card"
                >
                  <button
                    onClick={() => setPreview(it)}
                    className="block w-full"
                    aria-label="Ver foto"
                  >
                    <div className="aspect-[9/16] w-full overflow-hidden bg-secondary">
                      <img
                        src={it.src}
                        alt={it.title || "Trabalho"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </button>

                  {/* Top-right actions */}
                  <div className="absolute right-2 top-2 flex flex-col gap-1.5">
                    <button
                      onClick={() => setEditing(it)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      disabled={deleteItem.isPending}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur disabled:opacity-50"
                      aria-label="Excluir"
                    >
                      {deleteItem.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Reorder */}
                  <div className="absolute left-2 top-2 flex flex-col gap-1.5">
                    <button
                      onClick={() => move(it.id, -1)}
                      disabled={idx === 0 || isBusy}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur disabled:opacity-30"
                      aria-label="Mover para cima"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => move(it.id, 1)}
                      disabled={idx === items.length - 1 || isBusy}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur disabled:opacity-30"
                      aria-label="Mover para baixo"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-2.5 text-white">
                    <p className="truncate text-xs font-semibold">
                      {it.title || "Sem título"}
                    </p>
                    <p className="truncate text-[10px] uppercase tracking-wider text-white/80">
                      {it.category}
                    </p>
                  </div>
                </div>
              ))}

              {items.length < MAX_PORTFOLIO_ITEMS && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={addItem.isPending}
                  className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-card text-muted-foreground transition hover:bg-secondary/60 disabled:opacity-60"
                >
                  {addItem.isPending ? (
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  ) : (
                    <Plus className="h-7 w-7 text-primary" />
                  )}
                  <span className="text-xs font-semibold">Adicionar</span>
                </button>
              )}
            </div>
          )}
        </main>

        {/* Editor de detalhes */}
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Detalhes da foto</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div className="mx-auto aspect-[9/16] w-40 overflow-hidden rounded-xl border border-border bg-secondary">
                  <LazyImage src={editing.src} alt="" width={120} height={120} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t">Título</Label>
                  <Input
                    id="t"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    placeholder="Ex.: Volume russo marrom"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={editing.category}
                    onValueChange={(v) => setEditing({ ...editing, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d">Descrição</Label>
                  <Textarea
                    id="d"
                    rows={3}
                    value={editing.description}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                    placeholder="Conte um pouco sobre esse trabalho..."
                  />
                </div>
              </div>
            )}
            <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => editing && remove(editing.id)}
                disabled={deleteItem.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Excluir
              </Button>
              <Button
                onClick={() => editing && save(editing)}
                disabled={updateItem.isPending}
                className="gradient-primary text-white shadow-glow"
              >
                {updateItem.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview */}
        <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
          <DialogContent className="max-w-sm p-0">
            {preview && (
              <div className="relative">
                <button
                  onClick={() => setPreview(null)}
                  className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="aspect-[9/16] w-full overflow-hidden rounded-t-lg bg-black">
                  <LazyImage src={preview.src} alt="" width={120} height={120} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-1 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {preview.category}
                  </p>
                  <h3 className="font-display text-lg font-bold">
                    {preview.title || "Sem título"}
                  </h3>
                  {preview.description && (
                    <p className="text-sm text-muted-foreground">{preview.description}</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manage Categories */}
        <Dialog open={catOpen} onOpenChange={setCatOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Categorias</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Nova categoria"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                />
                <Button onClick={addCategory} className="gradient-primary text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {categories.map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2"
                  >
                    <span className="text-sm font-medium">{c}</span>
                    <button
                      onClick={() => removeCategory(c)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remover ${c}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCatOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MobileShell>

      {/* ── Crop dialog — fora do MobileShell para evitar overflow-hidden ── */}
      <Dialog open={!!cropSrc} onOpenChange={(o) => !o && setCropSrc(null)}>
        <DialogContent className="max-w-sm gap-0 overflow-hidden p-0">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="h-4 w-4 text-primary" />
              Ajustar enquadramento
            </DialogTitle>
            <p className="text-[12px] text-muted-foreground">
              Arraste para posicionar · Pinça ou slider para zoom
            </p>
          </DialogHeader>

          {/* Crop area 9:16 */}
          <div className="relative w-full" style={{ aspectRatio: `${TARGET_W}/${TARGET_H}` }}>
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: { borderRadius: 0 },
                  cropAreaStyle: { border: "2px solid hsl(var(--primary))" },
                }}
              />
            )}
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="text-[11px] font-semibold text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-primary"
            />
          </div>

          <div className="flex gap-2 border-t border-border px-5 py-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCropSrc(null)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmCrop}
              disabled={processing}
              className="flex-1 gradient-primary text-white shadow-glow"
            >
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {processing ? "Salvando…" : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
