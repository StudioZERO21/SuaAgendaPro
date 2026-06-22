import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Sparkles,
  Trash2,
  Check,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileShell } from "@/components/mobile-shell";
import { servicesStore, serviceCategories } from "@/lib/services-store";
import type { Service, ServiceCategory } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ServiceFormProps = {
  serviceId?: string;
};

export function ServiceForm({ serviceId }: ServiceFormProps) {
  const navigate = useNavigate();
  const existing = serviceId ? servicesStore.getById(serviceId) : undefined;
  const editing = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? "");
  const [duration, setDuration] = useState<string>(existing ? String(existing.duration) : "60");
  const [price, setPrice] = useState<string>(existing ? String(existing.price) : "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState<ServiceCategory>(existing?.category ?? "lash");

  useEffect(() => {
    if (serviceId && !existing) {
      toast.error("Serviço não encontrado");
      navigate({ to: "/servicos" });
    }
  }, [serviceId, existing, navigate]);

  const durationNum = Number(duration);
  const priceNum = Number(price.toString().replace(",", "."));
  const valid = name.trim().length > 1 && durationNum > 0 && priceNum > 0;

  function handleSave() {
    if (!valid) {
      toast.error("Preencha nome, duração e preço");
      return;
    }
    const payload: Omit<Service, "id"> = {
      name: name.trim(),
      duration: durationNum,
      price: priceNum,
      description: description.trim() || undefined,
      category,
    };
    if (editing && existing) {
      servicesStore.update(existing.id, payload);
      toast.success("Serviço atualizado ✨");
    } else {
      servicesStore.create(payload);
      toast.success("Serviço criado ✨");
    }
    navigate({ to: "/servicos" });
  }

  function handleDelete() {
    if (!existing) return;
    servicesStore.remove(existing.id);
    toast.success("Serviço removido");
    navigate({ to: "/servicos" });
  }

  return (
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
                  {name || "Nome do serviço"}
                </p>
                <p className="text-xs text-white/80">
                  {durationNum > 0 ? `${durationNum} min` : "—"} ·{" "}
                  {priceNum > 0 ? `R$ ${priceNum.toFixed(2).replace(".", ",")}` : "R$ —"}
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Form */}
        <main className="mt-6 flex-1 space-y-5 px-5 pb-32">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nome do serviço
            </Label>
            <Input
              autoFocus={!editing}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Volume Brasileiro"
              className="h-14 rounded-2xl border-border bg-card text-base shadow-card focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Duração (min)
              </Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  inputMode="numeric"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="60"
                  className="h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Preço (R$)
              </Label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9.,]/g, ""))}
                  placeholder="120"
                  className="h-14 rounded-2xl border-border bg-card pl-11 text-base shadow-card focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Duration presets */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {[30, 45, 60, 90, 120].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDuration(String(m))}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  Number(duration) === m
                    ? "gradient-primary border-transparent text-white shadow-glow"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {m} min
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categoria
            </Label>
            <div className="grid grid-cols-2 gap-2.5">
              {serviceCategories.map((c) => {
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all",
                      active
                        ? "border-primary bg-secondary shadow-glow"
                        : "border-border bg-card shadow-card hover:border-primary/40",
                    )}
                  >
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-xs font-semibold">{c.label}</span>
                    {active && (
                      <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full gradient-primary text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Descrição (opcional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que está incluso, observações..."
              rows={3}
              className="resize-none rounded-2xl border-border bg-card text-sm shadow-card focus-visible:ring-primary"
            />
          </div>

          {editing && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-card py-3.5 text-sm font-semibold text-destructive transition hover:bg-destructive/5"
            >
              <Trash2 className="h-4 w-4" />
              Remover serviço
            </button>
          )}
        </main>

        {/* Sticky save */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 backdrop-blur-xl">
          <div className="mx-auto max-w-md">
            <Button
              onClick={handleSave}
              disabled={!valid}
              size="lg"
              className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold shadow-glow disabled:opacity-50"
            >
              <Scissors className="mr-2 h-4 w-4" />
              {editing ? "Salvar alterações" : "Criar serviço"}
            </Button>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
