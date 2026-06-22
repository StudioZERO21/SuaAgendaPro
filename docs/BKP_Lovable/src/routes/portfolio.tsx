import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
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
  loadPortfolio,
  savePortfolio,
  loadCategories,
  saveCategories,
  MAX_PORTFOLIO_ITEMS,
  type PortfolioItem,
} from "@/lib/portfolio-store";

export const Route = createFileRoute("/portfolio")({
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

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function cropTo916(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext("2d")!;
  const targetRatio = TARGET_W / TARGET_H;
  const srcRatio = img.width / img.height;
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;
  if (srcRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);
  return canvas.toDataURL("image/jpeg", 0.8);
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function PortfolioPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [preview, setPreview] = useState<PortfolioItem | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(loadPortfolio());
    setCategories(loadCategories());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePortfolio(items);
  }, [items, hydrated]);

  useEffect(() => {
    if (hydrated) saveCategories(categories);
  }, [categories, hydrated]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (items.length >= MAX_PORTFOLIO_ITEMS) {
      toast.error(`Limite de ${MAX_PORTFOLIO_ITEMS} fotos.`);
      return;
    }
    try {
      const img = await fileToImage(file);
      const src = cropTo916(img);
      const novo: PortfolioItem = {
        id: uid(),
        src,
        title: "",
        category: categories[0] ?? "Outro",
        description: "",
      };
      setItems((prev) => [novo, ...prev]);
      setEditing(novo);
      toast.success("Foto ajustada para 9:16 e otimizada.");
    } catch {
      toast.error("Não foi possível processar a imagem.");
    }
  };

  const save = (it: PortfolioItem) => {
    setItems((prev) => prev.map((p) => (p.id === it.id ? it : p)));
    setEditing(null);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    setEditing(null);
    setPreview(null);
    toast.success("Foto removida.");
  };

  const move = (id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
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
    // Re-aponta itens dessa categoria para a primeira disponível
    setItems((prev) =>
      prev.map((p) =>
        p.category === name
          ? { ...p, category: categories.find((c) => c !== name) ?? "Outro" }
          : p,
      ),
    );
  };

  return (
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
          Envie até {MAX_PORTFOLIO_ITEMS} fotos. Imagens ajustadas em 9:16 e comprimidas
          automaticamente. Use as setas para reorganizar — a ordem aqui é a mesma da
          sua página pública.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />

        {items.length === 0 ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-5 flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card text-muted-foreground transition hover:bg-secondary/60"
          >
            <ImagePlus className="h-10 w-10 text-primary" />
            <span className="text-sm font-semibold">Adicionar primeira foto</span>
            <span className="text-[11px]">JPG ou PNG · ajuste 9:16</span>
          </button>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card"
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
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Reorder */}
                <div className="absolute left-2 top-2 flex flex-col gap-1.5">
                  <button
                    onClick={() => move(it.id, -1)}
                    disabled={idx === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur disabled:opacity-30"
                    aria-label="Mover para cima"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move(it.id, 1)}
                    disabled={idx === items.length - 1}
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
                className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card text-muted-foreground transition hover:bg-secondary/60"
              >
                <Plus className="h-7 w-7 text-primary" />
                <span className="text-xs font-semibold">Adicionar</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Editor */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Detalhes da foto</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="mx-auto aspect-[9/16] w-40 overflow-hidden rounded-xl border border-border bg-secondary">
                <img src={editing.src} alt="" className="h-full w-full object-cover" />
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
            >
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </Button>
            <Button
              onClick={() => editing && save(editing)}
              className="gradient-primary text-white shadow-glow"
            >
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
                <img src={preview.src} alt="" className="h-full w-full object-cover" />
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
  );
}
