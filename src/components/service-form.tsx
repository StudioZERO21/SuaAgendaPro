import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft, Clock, DollarSign, Sparkles, Trash2, Scissors,
  AlertCircle, Percent, ToggleLeft,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function ServiceForm({ serviceId }: ServiceFormProps) {
  const navigate = useNavigate();
  const editing = Boolean(serviceId);

  const { data: existing, isLoading } = useService(serviceId ?? "");
  const createService  = useCreateService();
  const updateService  = useUpdateService();
  const deleteService  = useDeleteService();

  const [name, setName]                = useState("");
  const [description, setDescription]  = useState("");
  const [priceRaw, setPriceRaw]        = useState("");
  const [duration, setDuration]        = useState(60);
  const [depositType, setDepositType]  = useState<"none" | "percent" | "fixed">("none");
  const [depositValue, setDepositValue]= useState("");
  const [errors, setErrors]            = useState<Record<string, string>>({});

  // Populate form when editing
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

  const previewDeposit = () => {
    if (depositType === "none") return null;
    if (depositType === "percent") {
      const pct = Number(depositValue) || 0;
      const val = (priceCents * pct) / 100 / 100;
      return `${pct}% = R$ ${val.toFixed(2).replace(".", ",")}`;
    }
    if (depositCents > 0) {
      return `Fixo: R$ ${(depositCents / 100).toFixed(2).replace(".", ",")}`;
    }
    return null;
  };

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
    if (priceCents <= 0) {
      setErrors({ price_raw: "Preço deve ser maior que zero" });
      return;
    }
    setErrors({});

    const payload = {
      name:             name.trim(),
      description:      description.trim() || null,
      price_cents:      priceCents,
      duration_minutes: duration,
      deposit_type:     depositType,
      deposit_value:    depositCents,
      is_active:        true,
    };

    try {
      if (editing && existing) {
        await updateService.mutateAsync({ id: existing.id, ...payload });
        toast.success("Serviço atualizado ✨");
      } else {
        await createService.mutateAsync(payload);
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
                  {depositType !== "none" && previewDeposit() && (
                    <> · Sinal: {previewDeposit()}</>
                  )}
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
                { id: "none",    label: "Nenhum",  Icon: ToggleLeft },
                { id: "percent", label: "Percentual", Icon: Percent },
                { id: "fixed",   label: "Fixo R$", Icon: DollarSign },
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
                {previewDeposit() && (
                  <p className="text-xs font-medium text-primary">{previewDeposit()}</p>
                )}
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
              disabled={isSaving}
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
  );
}
