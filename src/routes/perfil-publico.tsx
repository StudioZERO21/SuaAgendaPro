import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Plus, Save, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ACTIVE_PROFILE_SLUG,
  GALLERY_GRADIENTS,
  profileStore,
  useProfile,
} from "@/lib/profile-store";
import type { PublicReview } from "@/lib/public-profiles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/perfil-publico")({
  head: () => ({
    meta: [
      { title: "Perfil público — SuaAgenda.Pro" },
      { name: "description", content: "Edite seu perfil público e galeria." },
    ],
  }),
  component: PerfilPublicoPage,
});

const EMOJIS = ["👁️", "✨", "💖", "🌸", "💅", "👑", "💄", "💇‍♀️", "🪒", "🌟", "🦄", "🪞"];

function PerfilPublicoPage() {
  const navigate = useNavigate();
  const profile = useProfile(ACTIVE_PROFILE_SLUG);

  const [name, setName] = useState(profile?.name ?? "");
  const [tagline, setTagline] = useState(profile?.tagline ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [rating, setRating] = useState(profile?.rating ?? 5);
  const [reviewsCount, setReviewsCount] = useState(profile?.reviewsCount ?? 0);
  const [highlights, setHighlights] = useState<string[]>(profile?.highlights ?? []);
  const [newHighlight, setNewHighlight] = useState("");

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [pickEmoji, setPickEmoji] = useState(EMOJIS[0]);
  const [pickGradient, setPickGradient] = useState(GALLERY_GRADIENTS[0]);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<PublicReview | null>(null);

  if (!profile) {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <p className="text-muted-foreground">Perfil não encontrado.</p>
        </div>
      </MobileShell>
    );
  }

  function save() {
    profileStore.update(ACTIVE_PROFILE_SLUG, {
      name: name.trim() || profile!.name,
      tagline: tagline.trim(),
      bio: bio.trim(),
      rating: Math.max(0, Math.min(5, Number(rating) || 0)),
      reviewsCount: Math.max(0, Math.floor(Number(reviewsCount) || 0)),
      highlights,
    });
    toast.success("Perfil atualizado!");
  }

  function addHighlight() {
    const v = newHighlight.trim();
    if (!v) return;
    setHighlights((h) => [...h, v]);
    setNewHighlight("");
  }

  function addGalleryItem() {
    profileStore.addGalleryItem(ACTIVE_PROFILE_SLUG, {
      emoji: pickEmoji,
      gradient: pickGradient,
    });
    setGalleryOpen(false);
    toast.success("Foto adicionada à galeria");
  }

  function openNewReview() {
    setEditingReview({
      id: `r${Date.now()}`,
      name: "",
      initials: "",
      rating: 5,
      text: "",
      date: "agora",
    });
    setReviewOpen(true);
  }

  function saveReview() {
    if (!editingReview) return;
    const name = editingReview.name.trim();
    if (!name || !editingReview.text.trim()) {
      toast.error("Preencha nome e texto da avaliação");
      return;
    }
    const initials =
      editingReview.initials.trim() ||
      name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    profileStore.upsertReview(ACTIVE_PROFILE_SLUG, { ...editingReview, name, initials });
    setReviewOpen(false);
    setEditingReview(null);
    toast.success("Avaliação salva");
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Studio
          </p>
          <h1 className="truncate font-display text-lg font-bold">Perfil público</h1>
        </div>
        <Link
          to="/agendar/$slug"
          params={{ slug: profile.slug }}
          className="flex h-9 items-center gap-1 rounded-full bg-secondary px-3 text-xs font-semibold"
        >
          Ver <ExternalLink className="h-3 w-3" />
        </Link>
      </header>

      <main className="flex-1 space-y-6 px-5 pb-32 pt-5">
        {/* Identity */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold">Identidade</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Especialidade</Label>
            <Input
              id="tagline"
              placeholder="Ex.: Lash Designer · Estúdio Rosé"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={5}
              maxLength={400}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <p className="text-right text-[10px] text-muted-foreground">{bio.length}/400</p>
          </div>
        </section>

        {/* Highlights */}
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold">Destaques</h2>
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div
                key={`${h}-${i}`}
                className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2"
              >
                <span className="flex-1 text-sm">{h}</span>
                <button
                  onClick={() => setHighlights((arr) => arr.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Novo destaque…"
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())}
            />
            <Button
              type="button"
              onClick={addHighlight}
              className="h-10 shrink-0 rounded-2xl gradient-primary px-3 text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Rating */}
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Avaliação</h2>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-primary" fill="currentColor" />
              <span className="font-bold">{Number(rating).toFixed(1)}</span>
              <span className="text-muted-foreground">· {reviewsCount} avaliações</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rating">Nota média</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min={0}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reviews-count">Nº de avaliações</Label>
              <Input
                id="reviews-count"
                type="number"
                min={0}
                value={reviewsCount}
                onChange={(e) => setReviewsCount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Depoimentos</h3>
              <button
                onClick={openNewReview}
                className="flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <Plus className="h-3 w-3" /> Adicionar
              </button>
            </div>
            {profile.reviews.length === 0 && (
              <p className="rounded-2xl bg-secondary/40 px-3 py-4 text-center text-xs text-muted-foreground">
                Nenhum depoimento ainda.
              </p>
            )}
            {profile.reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-border/60 bg-background p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-xs font-bold text-white">
                    {r.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{r.name}</p>
                      <div className="flex">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-primary" fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.text}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setEditingReview(r);
                        setReviewOpen(true);
                      }}
                      className="text-[11px] font-semibold text-primary"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        profileStore.removeReview(ACTIVE_PROFILE_SLUG, r.id);
                        toast.success("Removido");
                      }}
                      className="text-muted-foreground"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Galeria</h2>
            <button
              onClick={() => setGalleryOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {profile.gallery.map((g) => (
              <div
                key={g.id}
                className="relative flex aspect-square items-center justify-center rounded-2xl text-3xl shadow-card"
                style={{ background: g.gradient }}
              >
                <span>{g.emoji}</span>
                <button
                  onClick={() => {
                    profileStore.removeGalleryItem(ACTIVE_PROFILE_SLUG, g.id);
                    toast.success("Removido");
                  }}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition active:scale-95"
                  aria-label="Remover foto"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {profile.gallery.length === 0 && (
              <p className="col-span-3 rounded-2xl bg-secondary/40 px-3 py-6 text-center text-xs text-muted-foreground">
                Sua galeria está vazia.
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Sticky save */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-5 pb-5">
        <Button
          onClick={save}
          size="lg"
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow"
        >
          <Save className="mr-2 h-5 w-5" /> Salvar alterações
        </Button>
      </div>

      {/* Add gallery dialog */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Nova foto da galeria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="flex h-32 items-center justify-center rounded-2xl text-5xl shadow-card"
              style={{ background: pickGradient }}
            >
              <span>{pickEmoji}</span>
            </div>
            <div>
              <Label className="mb-2 block">Ícone</Label>
              <div className="grid grid-cols-6 gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setPickEmoji(e)}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-xl bg-secondary text-xl transition",
                      pickEmoji === e && "ring-2 ring-primary",
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Cor</Label>
              <div className="grid grid-cols-4 gap-2">
                {GALLERY_GRADIENTS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setPickGradient(g)}
                    className={cn(
                      "h-12 rounded-xl transition",
                      pickGradient === g && "ring-2 ring-primary ring-offset-2",
                    )}
                    style={{ background: g }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGalleryOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addGalleryItem} className="gradient-primary text-white">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review dialog */}
      <Dialog
        open={reviewOpen}
        onOpenChange={(v) => {
          setReviewOpen(v);
          if (!v) setEditingReview(null);
        }}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Depoimento</DialogTitle>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome da cliente</Label>
                <Input
                  value={editingReview.name}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nota</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={editingReview.rating}
                    onChange={(e) =>
                      setEditingReview({
                        ...editingReview,
                        rating: Math.max(1, Math.min(5, Number(e.target.value))),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input
                    value={editingReview.date}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, date: e.target.value })
                    }
                    placeholder="há 2 dias"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Depoimento</Label>
                <Textarea
                  rows={4}
                  value={editingReview.text}
                  onChange={(e) =>
                    setEditingReview({ ...editingReview, text: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveReview} className="gradient-primary text-white">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}
