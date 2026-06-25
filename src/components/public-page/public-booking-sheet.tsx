import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  QrCode,
  ShieldCheck,
  Timer,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PhoneInputBR } from "@/components/ui/phone-input";
import {
  getPublicSlots,
  createPublicBooking,
  createMpPreferenceAndBooking,
  lookupClientByPhone,
  type PublicPixSettings,
} from "@/lib/public-booking.functions";
import { buildPixPayload, normalizePixKey } from "@/lib/pix";
import { categoryMeta } from "@/lib/services-store";
import {
  formatPublicPrice as formatPrice,
  type PublicService,
} from "@/lib/public-page-types";
/* ------------------------ Booking flow ------------------------ */

type Step = 1 | 2 | 3 | 4;

type DayItem = { date: Date; key: string; day: string; weekday: string; month: string };

function getNextAvailableDays(
  openDays: number[],
  scheduleBlocks: { start_date: string; end_date: string }[],
  n = 14,
): DayItem[] {
  const out: DayItem[] = [];
  const wd = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const mo = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const openSet = new Set(openDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let offset = 0;
  while (out.length < n && offset < 120) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    offset++;

    // pula dias de semana sem funcionamento
    if (!openSet.has(d.getDay())) continue;

    // pula dias dentro de bloqueios/travamentos
    const key = d.toISOString().slice(0, 10);
    const blocked = scheduleBlocks.some((b) => key >= b.start_date && key <= b.end_date);
    if (blocked) continue;

    out.push({
      date: d,
      key,
      day: String(d.getDate()).padStart(2, "0"),
      weekday: wd[d.getDay()],
      month: mo[d.getMonth()],
    });
  }
  return out;
}

export function BookingSheet({
  open,
  onOpenChange,
  services,
  preselect,
  professionalName,
  professionalSlug,
  professionalId,
  professionalPhone,
  pix,
  mpConnected,
  scheduleBlocks,
  openDays,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  services: PublicService[];
  preselect?: PublicService;
  professionalName: string;
  professionalSlug: string;
  professionalId: string;
  professionalPhone: string;
  pix: PublicPixSettings;
  mpConnected: boolean;
  scheduleBlocks: { start_date: string; end_date: string; reason: string }[];
  openDays: number[];
}) {
  const [step, setStep] = useState<Step>(preselect ? 2 : 1);
  const [service, setService] = useState<PublicService | undefined>(preselect);
  const [date, setDate] = useState<string | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [done, setDone] = useState(false);



  const days = useMemo(
    () => getNextAvailableDays(openDays, scheduleBlocks, 14),
    [openDays, scheduleBlocks],
  );

  // Fetch real availability when date or service changes
  useEffect(() => {
    if (!date || !service) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setTime(undefined);
    getPublicSlots(professionalId, date, service.duration)
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => { cancelled = true; };
  }, [date, service, professionalId]);

  function reset() {
    setStep(1);
    setService(undefined);
    setDate(undefined);
    setTime(undefined);
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    // mantém aceite de políticas persistido entre agendamentos
    setDone(false);
  }

  function handleClose(v: boolean) {
    onOpenChange(v);
    if (!v) setTimeout(reset, 300);
  }

  function next() {
    setStep((s) => (Math.min(4, s + 1) as Step));
  }
  function back() {
    setStep((s) => (Math.max(1, s - 1) as Step));
  }

  function confirm() {
    setPaymentOpen(true);
  }

  async function handlePaymentConfirmed() {
    if (!service || !date || !time) return;
    try {
      await createPublicBooking({
        data: {
          professionalId,
          serviceId: service.id,
          scheduledAt: `${date}T${time}:00`,
          durationMinutes: service.duration,
          priceCents: service.price_cents,
          clientName: name,
          clientPhone: phone,
          clientEmail: email,
          notes,
        },
      });
      setPaymentOpen(false);
      setDone(true);
      toast.success("Agendamento confirmado!", {
        description: "Enviamos a confirmação para o seu WhatsApp.",
        duration: 6000,
      });
    } catch {
      setPaymentOpen(false);
      toast.error("Não foi possível confirmar o agendamento. Tente novamente.");
    }
  }

  function handlePaymentExpired() {
    setPaymentOpen(false);
    toast.error("Tempo esgotado", {
      description: "O slot foi liberado. Faça um novo agendamento.",
    });
    setTimeout(() => handleClose(false), 100);
  }

  // Initialize step when preselect changes
  if (open && preselect && !service) {
    setService(preselect);
    setStep(2);
  }

  return (
    <>
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl p-0">
        {done ? (
          <SuccessView
            service={service!}
            date={date!}
            time={time!}
            name={name}
            professionalName={professionalName}
            onClose={() => handleClose(false)}
          />
        ) : (
          <>
            <SheetHeader className="sticky top-0 z-10 border-b border-border/60 bg-card/95 px-5 pb-3 pt-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <button
                  onClick={step === 1 ? () => handleClose(false) : back}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <SheetTitle className="font-display text-base">Novo agendamento</SheetTitle>
                <div className="w-9" />
              </div>
              <Stepper step={step} />
            </SheetHeader>

            <div className="px-5 py-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                >
                  {step === 1 && (
                    <StepServices
                      services={services}
                      value={service}
                      onChange={(s) => {
                        setService(s);
                        next();
                      }}
                    />
                  )}
                  {step === 2 && (
                    <StepDateTime
                      days={days}
                      date={date}
                      time={time}
                      slots={slots}
                      loadingSlots={loadingSlots}
                      onDate={setDate}
                      onTime={setTime}
                    />
                  )}
                  {step === 3 && (
                    <StepDetails
                      professionalId={professionalId}
                      name={name}
                      phone={phone}
                      email={email}
                      notes={notes}
                      onName={setName}
                      onPhone={setPhone}
                      onEmail={setEmail}
                      onNotes={setNotes}
                    />
                  )}
                  {step === 4 && service && date && time && (
                    <StepReview
                      service={service}
                      date={date}
                      time={time}
                      name={name}
                      phone={phone}
                      email={email}
                      notes={notes}
                      accepted={acceptedPolicy}
                      onAcceptedChange={setAcceptedPolicy}
                      onOpenPolicy={() => setPolicyOpen(true)}
                      pix={pix}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {step > 1 && (
              <div className="sticky bottom-0 border-t border-border/60 bg-card/95 px-5 py-4 backdrop-blur">
                {step === 4 ? (
                  <Button
                    onClick={confirm}
                    size="lg"
                    disabled={!acceptedPolicy}
                    className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow disabled:opacity-50"
                  >
                    <Wallet className="mr-2 h-5 w-5" /> Pagar sinal e confirmar
                  </Button>
                ) : (
                  <Button
                    onClick={next}
                    size="lg"
                    disabled={
                      (step === 2 && (!date || !time)) ||
                      (step === 3 && (!name.trim() || phone.replace(/\D/g, "").length < 10 || (email.length > 0 && !isValidEmail(email))))
                    }
                    className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow disabled:opacity-50"
                  >
                    Continuar <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
    <PolicyDialog open={policyOpen} onOpenChange={setPolicyOpen} professionalName={professionalName} />
    {service && (
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={(v) => {
          if (!v && paymentOpen) {
            // fechar manualmente = cancelar pagamento e liberar slot
            handlePaymentExpired();
          } else {
            setPaymentOpen(v);
          }
        }}
        service={service}
        clientName={name}
        clientPhone={phone}
        clientEmail={email}
        clientNotes={notes}
        date={date ?? ""}
        time={time ?? ""}
        professionalName={professionalName}
        professionalSlug={professionalSlug}
        professionalId={professionalId}
        professionalPhone={professionalPhone}
        pix={pix}
        mpConnected={mpConnected}
        onConfirmed={handlePaymentConfirmed}
        onExpired={handlePaymentExpired}
      />
    )}
    </>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Serviço", "Data", "Dados", "Revisão"];
  return (
    <div className="mt-3 flex items-center gap-1.5">
      {labels.map((l, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={l} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "h-1.5 w-full rounded-full transition-all",
                done || active ? "bg-primary" : "bg-secondary",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {l}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StepServices({
  services,
  value,
  onChange,
}: {
  services: PublicService[];
  value?: PublicService;
  onChange: (s: PublicService) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold">Escolha o serviço</h3>
      <p className="mt-1 text-sm text-muted-foreground">Você pode reagendar quando precisar.</p>
      <div className="mt-4 space-y-2">
        {services.map((s) => {
          const cat = categoryMeta(s.category);
          const selected = value?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onChange(s)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-card transition active:scale-[0.99]",
                selected ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-primary/40",
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-soft text-xl">
                {cat.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{s.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {s.duration} min
                </div>
              </div>
              <div className="font-display text-lg font-bold text-gradient">{formatPrice(s.price)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDateTime({
  days,
  date,
  time,
  slots,
  loadingSlots,
  onDate,
  onTime,
}: {
  days: DayItem[];
  date?: string;
  time?: string;
  slots: string[];
  loadingSlots: boolean;
  onDate: (k: string) => void;
  onTime: (t: string) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold">Quando você quer vir?</h3>
      <p className="mt-1 text-sm text-muted-foreground">Próximas datas disponíveis.</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma data disponível nos próximos meses.</p>
        )}
        {days.map((d) => {
          const selected = d.key === date;
          return (
            <button
              key={d.key}
              onClick={() => onDate(d.key)}
              className={cn(
                "flex min-w-[64px] flex-col items-center gap-0.5 rounded-2xl border px-3 py-3 text-center transition active:scale-95",
                selected
                  ? "border-primary gradient-primary text-white shadow-glow"
                  : "border-border/60 bg-card hover:border-primary/40",
              )}
            >
              <span className={cn("text-[10px] font-semibold tracking-wider", selected ? "text-white/80" : "text-muted-foreground")}>
                {d.weekday}
              </span>
              <span className="font-display text-xl font-bold leading-none">{d.day}</span>
              <span className={cn("text-[10px]", selected ? "text-white/80" : "text-muted-foreground")}>{d.month}</span>
            </button>
          );
        })}
      </div>

      <h4 className="mt-6 mb-3 text-sm font-semibold">Horários disponíveis</h4>
      {loadingSlots ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : !date ? (
        <p className="text-sm text-muted-foreground">Selecione uma data para ver os horários.</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum horário disponível nesta data.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((t) => {
            const selected = t === time;
            return (
              <button
                key={t}
                onClick={() => onTime(t)}
                className={cn(
                  "rounded-2xl border py-3 text-sm font-semibold transition active:scale-95",
                  selected
                    ? "border-primary gradient-primary text-white shadow-glow"
                    : "border-border/60 bg-card hover:border-primary/40",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepDetails({
  professionalId,
  name,
  phone,
  email,
  notes,
  onName,
  onPhone,
  onEmail,
  onNotes,
}: {
  professionalId: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  onEmail: (v: string) => void;
  onNotes: (v: string) => void;
}) {
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneReady = phoneDigits.length >= 10;
  const emailInvalid = email.length > 0 && !isValidEmail(email);

  // Lookup automático com debounce quando phone >= 10 dígitos
  useEffect(() => {
    if (!phoneReady) {
      setLookupStatus("idle");
      onName("");
      onEmail("");
      return;
    }
    setLookupStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const result = await lookupClientByPhone({ data: { professionalId, phone: phoneDigits } });
        if (result) {
          onName(result.name);
          onEmail(result.email ?? "");
          setLookupStatus("found");
        } else {
          setLookupStatus("notfound");
        }
      } catch {
        setLookupStatus("notfound");
      }
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneDigits]);

  const isFound = lookupStatus === "found";
  const isLoading = lookupStatus === "loading";
  const otherFieldsDisabled = !phoneReady || isLoading || isFound;

  return (
    <div>
      <h3 className="font-display text-xl font-bold">Seus dados</h3>
      <p className="mt-1 text-sm text-muted-foreground">Para confirmarmos seu agendamento via WhatsApp.</p>
      <div className="mt-4 space-y-4">

        {/* WhatsApp — sempre habilitado, campo principal */}
        <div>
          <Label htmlFor="b-phone">WhatsApp</Label>
          <div className="relative">
            <PhoneInputBR id="b-phone" value={phone} onChange={onPhone} className="mt-1" />
            {isLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </span>
            )}
          </div>
          {isFound && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Cliente identificado — dados preenchidos automaticamente
            </p>
          )}
        </div>

        {/* Nome */}
        <div>
          <Label htmlFor="b-name" className={cn(!phoneReady && "text-muted-foreground/40")}>
            Nome completo
          </Label>
          <Input
            id="b-name"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder={!phoneReady ? "Informe o WhatsApp primeiro" : "Seu nome"}
            disabled={otherFieldsDisabled}
            className={cn("mt-1 h-12 rounded-2xl", isFound && "cursor-default opacity-60")}
          />
        </div>

        {/* E-mail */}
        <div>
          <Label htmlFor="b-email" className={cn(!phoneReady && "text-muted-foreground/40")}>
            E-mail <span className="text-muted-foreground/60 font-normal">(opcional)</span>
          </Label>
          <Input
            id="b-email"
            type="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder={!phoneReady ? "Informe o WhatsApp primeiro" : "voce@exemplo.com"}
            disabled={otherFieldsDisabled}
            inputMode="email"
            autoComplete="email"
            className={cn("mt-1 h-12 rounded-2xl", isFound && "cursor-default opacity-60")}
          />
          {emailInvalid && !isFound && (
            <p className="mt-1 text-xs text-destructive">Informe um e-mail válido.</p>
          )}
        </div>

        {/* Observações — liberado assim que nome for preenchido, mesmo para clientes conhecidos */}
        <div>
          <Label htmlFor="b-notes" className={cn(!phoneReady && "text-muted-foreground/40")}>
            Observações <span className="text-muted-foreground/60 font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="b-notes"
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            placeholder={!phoneReady ? "Informe o WhatsApp primeiro" : "Alguma preferência, alergia ou recado?"}
            disabled={!phoneReady || isLoading}
            className="mt-1 min-h-[88px] rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}

function StepReview({
  service,
  date,
  time,
  name,
  phone,
  email,
  notes,
  accepted,
  onAcceptedChange,
  onOpenPolicy,
  pix,
}: {
  service: PublicService;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  accepted: boolean;
  onAcceptedChange: (v: boolean) => void;
  onOpenPolicy: () => void;
  pix: PublicPixSettings;
}) {
  const d = new Date(date + "T00:00:00");
  const fmt = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return (
    <div>
      <h3 className="font-display text-xl font-bold">Tudo certo?</h3>
      <p className="mt-1 text-sm text-muted-foreground">Revise antes de confirmar.</p>

      <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 shadow-card">
        <div className="gradient-soft p-5">
          <Badge variant="secondary" className="bg-white/70">{categoryMeta(service.category).label}</Badge>
          <div className="mt-2 font-display text-2xl font-bold">{service.name}</div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {service.duration} min</span>
            <span>·</span>
            <span className="font-semibold text-gradient">{formatPrice(service.price)}</span>
          </div>
        </div>
        <div className="divide-y divide-border/60 bg-card">
          <Row icon={<CalendarDays className="h-4 w-4" />} label="Data" value={fmt.charAt(0).toUpperCase() + fmt.slice(1)} />
          <Row icon={<Clock className="h-4 w-4" />} label="Horário" value={time} />
          <Row icon={<User className="h-4 w-4" />} label="Cliente" value={name} />
          <Row icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={phone} />
          {email && <Row icon={<Mail className="h-4 w-4" />} label="E-mail" value={email} />}
          {notes && <Row icon={<MessageCircle className="h-4 w-4" />} label="Observações" value={notes} />}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-card">
        <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/40 px-5 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-white">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sinal para reservar
            </div>
            <div className="text-sm font-semibold text-foreground">
              {pix?.enabled && pix?.key
                ? `PIX pessoal · ${pix.beneficiaryName || "profissional"}`
                : "Pagamento via Mercado Pago"}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-muted-foreground">Sinal (30%)</span>
          <span className="font-display text-xl font-bold text-gradient">
            {formatPrice(Math.round(service.price_cents * 0.3) / 100)}
          </span>
        </div>
        <div className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
          O restante de <strong className="text-foreground">{formatPrice(service.price - Math.round(service.price_cents * 0.3) / 100)}</strong> é pago no atendimento.
        </div>
      </div>


      <div className="mt-5 rounded-3xl border border-border/60 bg-card p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="b-policy"
            checked={accepted}
            onCheckedChange={(v) => onAcceptedChange(v === true)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="b-policy" className="cursor-pointer text-sm font-medium leading-snug">
              Li e concordo com as políticas de agendamento.
            </Label>
            <button
              type="button"
              onClick={onOpenPolicy}
              aria-haspopup="dialog"
              aria-controls="booking-policy-dialog"
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <FileText className="h-4 w-4" aria-hidden="true" /> Ler políticas de agendamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyDialog({
  open,
  onOpenChange,
  professionalName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  professionalName: string;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="booking-policy-dialog"
        aria-labelledby="booking-policy-title"
        aria-describedby="booking-policy-desc"
        onOpenAutoFocus={(e) => {
          // Foco inicial no botão "Entendi" — mais útil que o X de fechar
          e.preventDefault();
          confirmRef.current?.focus();
        }}
        className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle id="booking-policy-title" className="font-display text-xl">
            Políticas de agendamento
          </DialogTitle>
          <DialogDescription id="booking-policy-desc">
            Regras combinadas com {professionalName} para garantir um atendimento tranquilo para todos.
            Use Tab para navegar e Esc para fechar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm leading-relaxed text-foreground">
          <section aria-labelledby="pol-cancel">
            <h4 id="pol-cancel" className="mb-1 font-semibold text-foreground">Cancelamento</h4>
            <p className="text-muted-foreground">
              Cancelamentos devem ser feitos com no mínimo <strong>24 horas</strong> de antecedência.
              Cancelamentos fora do prazo podem gerar uma taxa de 50% do valor do serviço.
            </p>
          </section>
          <section aria-labelledby="pol-resched">
            <h4 id="pol-resched" className="mb-1 font-semibold text-foreground">Reagendamento</h4>
            <p className="text-muted-foreground">
              Você pode reagendar gratuitamente até <strong>12 horas</strong> antes do horário marcado,
              sujeito à disponibilidade na agenda.
            </p>
          </section>
          <section aria-labelledby="pol-noshow">
            <h4 id="pol-noshow" className="mb-1 font-semibold text-foreground">Não comparecimento (no-show)</h4>
            <p className="text-muted-foreground">
              Em caso de falta sem aviso prévio, será cobrada uma taxa de <strong>100%</strong> do valor
              do serviço para garantir um novo agendamento.
            </p>
          </section>
          <section aria-labelledby="pol-late">
            <h4 id="pol-late" className="mb-1 font-semibold text-foreground">Atrasos</h4>
            <p className="text-muted-foreground">
              Tolerância de <strong>15 minutos</strong>. Após esse período, o atendimento poderá ser
              reduzido ou remarcado para preservar os horários seguintes.
            </p>
          </section>
          <section aria-labelledby="pol-confirm">
            <h4 id="pol-confirm" className="mb-1 font-semibold text-foreground">Confirmação</h4>
            <p className="text-muted-foreground">
              Você receberá uma confirmação via WhatsApp e e-mail. Responda à mensagem de
              confirmação para garantir seu horário.
            </p>
          </section>
        </div>
        <div className="pt-2">
          <Button
            ref={confirmRef}
            onClick={() => onOpenChange(false)}
            className="h-12 w-full rounded-2xl gradient-primary text-white"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}


function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function SuccessView({
  service,
  date,
  time,
  name,
  professionalName,
  onClose,
}: {
  service: PublicService;
  date: string;
  time: string;
  name: string;
  professionalName: string;
  onClose: () => void;
}) {
  const d = new Date(date + "T00:00:00");
  const fmt = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return (
    <div className="px-6 pb-8 pt-10 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-white shadow-glow"
      >
        <CheckCircle2 className="h-10 w-10" />
      </motion.div>
      <h3 className="mt-5 font-display text-2xl font-bold">Agendamento solicitado!</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {name?.split(" ")[0] || "Você"}, seu horário com <span className="font-semibold">{professionalName}</span> está reservado.
        <br />Enviamos a confirmação para seu WhatsApp e e-mail.
      </p>

      <div className="mx-auto mt-6 max-w-sm rounded-3xl border border-border/60 gradient-soft p-5 text-left shadow-card">
        <div className="font-display text-lg font-bold">{service.name}</div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="capitalize">{fmt}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary" /> {time} · {service.duration} min
        </div>
      </div>

      <div className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Sinal de <strong className="text-foreground">{formatPrice(Math.round(service.price_cents * 0.3) / 100)}</strong> pago via PIX pessoal.
      </div>

      <Button
        onClick={onClose}
        size="lg"
        className="mt-6 h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow"
      >
        Concluir
      </Button>
    </div>
  );
}

function PaymentDialog({
  open,
  onOpenChange,
  service,
  clientName,
  clientPhone,
  clientEmail,
  clientNotes,
  date,
  time,
  professionalName,
  professionalSlug,
  professionalId,
  professionalPhone,
  pix,
  mpConnected,
  onConfirmed,
  onExpired,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service: PublicService;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientNotes: string;
  date: string;
  time: string;
  professionalName: string;
  professionalSlug: string;
  professionalId: string;
  professionalPhone: string;
  pix: PublicPixSettings;
  mpConnected: boolean;
  onConfirmed: () => void;
  onExpired: () => void;
}) {
  const hasPix = pix?.enabled && !!pix?.key;
  const defaultMethod: "mp" | "pix" = mpConnected ? "mp" : hasPix ? "pix" : "mp";

  const TOTAL_SECONDS = 10 * 60;
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [processing, setProcessing] = useState(false);
  const [mpLoading, setMpLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [payMethod, setPayMethod] = useState<"mp" | "pix">(defaultMethod);

  // valor em reais (consistente com o resto da UI)
  const depositValue = Math.round(service.price_cents * 0.3) / 100;
  const depositCents = Math.round(service.price_cents * 0.3);

  const pixPayload = useMemo(() => {
    if (!pix?.enabled || !pix?.key) return null;
    return buildPixPayload({
      key: normalizePixKey(pix.keyType, pix.key),
      name: pix.beneficiaryName || professionalName,
      city: pix.city || "BRASIL",
      amount: depositValue,
      description: `Sinal ${service.name}`.slice(0, 50),
    });
  }, [pix, professionalName, depositValue, service.name]);

  // reset ao abrir
  useEffect(() => {
    if (open) {
      setRemaining(TOTAL_SECONDS);
      setProcessing(false);
      setMpLoading(false);
      setCopied(false);
      setPayMethod(defaultMethod);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleMpPay() {
    setMpLoading(true);
    try {
      const { initPoint } = await createMpPreferenceAndBooking({
        data: {
          professionalId,
          serviceId: service.id,
          scheduledAt: `${date}T${time}:00`,
          durationMinutes: service.duration,
          priceCents: service.price_cents,
          depositCents,
          clientName,
          clientPhone,
          clientEmail,
          notes: clientNotes,
          slug: professionalSlug,
          origin: window.location.origin,
        },
      });
      window.location.href = initPoint;
    } catch {
      toast.error("Não foi possível criar a cobrança. Tente novamente.");
      setMpLoading(false);
    }
  }

  // QR code real (lado cliente)
  useEffect(() => {
    if (!open || !pixPayload) { setQrDataUrl(null); return; }
    import("qrcode").then(({ default: QRCode }) => {
      QRCode.toDataURL(pixPayload, { width: 200, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    });
  }, [open, pixPayload]);

  // contador
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { window.clearInterval(id); onExpired(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, onExpired]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = (remaining / TOTAL_SECONDS) * 100;
  const urgent = remaining <= 60;
  const firstName = clientName?.split(" ")[0] || "Você";

  // Link WhatsApp para enviar comprovante (PIX)
  const proDigits = professionalPhone?.replace(/\D/g, "") || "";
  const waNumber = proDigits.startsWith("55") ? proDigits : `55${proDigits}`;
  const waComprovanteLink = proDigits
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Olá! Sou ${clientName} e acabei de realizar o pagamento do sinal para ${service.name}. Segue meu comprovante:`,
      )}`
    : null;

  async function copyPix() {
    if (!pixPayload) return;
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  function handleConfirm() {
    setProcessing(true);
    setTimeout(() => onConfirmed(), 600);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto rounded-3xl p-0 sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="relative">
          {/* Barra de progresso topo */}
          <div className="h-1.5 w-full bg-secondary">
            <div
              className={cn("h-full transition-all duration-1000 ease-linear", urgent ? "bg-destructive" : "gradient-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="px-6 pb-6 pt-5">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="font-display text-lg">Pagamento do sinal</DialogTitle>
                  <DialogDescription className="text-xs">
                    {payMethod === "mp"
                      ? "Mercado Pago — pagamento automático"
                      : hasPix
                        ? `PIX pessoal · ${pix.beneficiaryName || professionalName}`
                        : "Confirme com o profissional"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Timer */}
            <div
              className={cn("mt-4 flex items-center justify-between rounded-2xl border px-4 py-3", urgent ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border/60 bg-secondary/40")}
              role="status" aria-live="polite"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Timer className="h-4 w-4" /> Slot reservado por
              </div>
              <div className="font-display text-xl font-bold tabular-nums">{mm}:{ss}</div>
            </div>

            {/* Valor */}
            <div className="mt-4 flex items-center justify-between rounded-2xl gradient-soft px-4 py-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sinal a pagar</div>
                <div className="text-xs text-muted-foreground">{service.name}</div>
              </div>
              <div className="font-display text-2xl font-bold text-gradient">{formatPrice(depositValue)}</div>
            </div>

            {/* Abas de método (só mostra se os dois estão disponíveis) */}
            {mpConnected && hasPix && (
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-1">
                <button
                  type="button"
                  onClick={() => setPayMethod("mp")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition",
                    payMethod === "mp" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <CreditCard className="h-3.5 w-3.5" /> Mercado Pago
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod("pix")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition",
                    payMethod === "pix" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <QrCode className="h-3.5 w-3.5" /> PIX
                </button>
              </div>
            )}

            {/* ── Mercado Pago ── */}
            {payMethod === "mp" && (
              <div className="mt-4 flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#009EE3]/10">
                  <CreditCard className="h-8 w-8 text-[#009EE3]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Pagar com Mercado Pago</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Você será redirecionado para o ambiente seguro do Mercado Pago para concluir o pagamento.
                    Ao voltar, seu agendamento será confirmado automaticamente.
                  </p>
                </div>
                <Button
                  onClick={handleMpPay}
                  disabled={mpLoading || remaining === 0}
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-[#009EE3] text-sm font-bold text-white hover:bg-[#0082bd] disabled:opacity-60"
                >
                  {mpLoading ? "Aguarde…" : <><CreditCard className="mr-2 h-4 w-4" /> Pagar {formatPrice(depositValue)} via Mercado Pago</>}
                </Button>
              </div>
            )}

            {/* ── PIX ── */}
            {payMethod === "pix" && (
              <>
                <div className="mt-4 flex flex-col items-center rounded-3xl border border-border/60 bg-card p-5">
                  {hasPix ? (
                    qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code PIX" className="h-[176px] w-[176px] rounded-xl" />
                    ) : (
                      <div className="flex h-[176px] w-[176px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 text-muted-foreground">
                        <QrCode className="h-16 w-16 animate-pulse" />
                      </div>
                    )
                  ) : (
                    <div className="flex h-[176px] w-[176px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 text-muted-foreground">
                      <QrCode className="h-16 w-16 opacity-40" />
                    </div>
                  )}
                  {hasPix ? (
                    <>
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        Abra o app do seu banco e escaneie o QR Code,<br />ou copie o código PIX abaixo.
                      </p>
                      <button type="button" onClick={copyPix}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary/70">
                        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copiado!" : "Copiar código PIX"}
                      </button>
                    </>
                  ) : (
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      O profissional ainda não configurou uma chave PIX. Entre em contato para combinar o pagamento.
                    </p>
                  )}
                </div>

                {hasPix && waComprovanteLink && (
                  <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-border/60 bg-secondary/40 px-4 py-3">
                    <p className="text-xs font-medium text-foreground">
                      Após pagar, envie o comprovante para confirmarmos seu agendamento:
                    </p>
                    <a href={waComprovanteLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-sm">
                      <MessageCircle className="h-4 w-4" /> Enviar comprovante pelo WhatsApp
                    </a>
                  </div>
                )}

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {firstName}, após enviar o comprovante seu agendamento será confirmado manualmente.
                  Se o tempo expirar, o slot será liberado.
                </p>

                {hasPix && (
                  <Button onClick={handleConfirm} disabled={processing || remaining === 0} size="lg"
                    className="mt-5 h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow disabled:opacity-60">
                    {processing ? "Registrando…" : <><Check className="mr-2 h-5 w-5" /> Já enviei o comprovante</>}
                  </Button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-3 w-full rounded-xl py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancelar e liberar o horário
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}