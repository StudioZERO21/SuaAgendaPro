import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { localTzSuffix } from "@/lib/availability";
import { PhoneInputBR } from "@/components/ui/phone-input";
import {
  getPublicSlots,
  createPublicBooking,
  createMpPreferenceAndBooking,
  createMpPixPaymentAndBooking,
  createPublicPixBooking,
  cancelPendingPublicBooking,
  lookupClientByPhone,
  type PublicPixSettings,
} from "@/lib/public-booking.functions";
import { buildPixPayload, normalizePixKey } from "@/lib/pix";
import { categoryMeta } from "@/lib/services-store";
import {
  formatPublicPrice as formatPrice,
  type PublicService,
} from "@/lib/public-page-types";
import { hexToHsl } from "@/lib/themes";

/* ------------------------ Theme context ------------------------ */

export type PublicBookingTheme = {
  primary: string;
  ctaBg: string;
  ctaText: string;
  bg: string;
  card: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  tagBg: string;
  serviceIcon: string;
  headingFont: string;
  bodyFont: string;
  cardRadius: string;
  btnRadius: string;
};

const DEFAULT_BOOKING_THEME: PublicBookingTheme = {
  primary: "#ec4899",
  ctaBg: "#ec4899",
  ctaText: "#ffffff",
  bg: "#ffffff",
  card: "#ffffff",
  surface: "#f5f5f5",
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5e5e5",
  tagBg: "rgba(236,72,153,0.1)",
  serviceIcon: "#ec4899",
  headingFont: "'Playfair Display', serif",
  bodyFont: "'Lato', sans-serif",
  cardRadius: "12px",
  btnRadius: "12px",
};

const BookingThemeContext = createContext<PublicBookingTheme>(DEFAULT_BOOKING_THEME);

function useBookingTheme() {
  return useContext(BookingThemeContext);
}

function buildBookingCssVars(theme: PublicBookingTheme): React.CSSProperties {
  return {
    backgroundColor: theme.bg,
    color: theme.text,
    fontFamily: theme.bodyFont,
    "--primary": hexToHsl(theme.primary),
    "--primary-foreground": hexToHsl(theme.ctaText),
    "--background": hexToHsl(theme.bg),
    "--foreground": hexToHsl(theme.text),
    "--card": hexToHsl(theme.card),
    "--card-foreground": hexToHsl(theme.text),
    "--popover": hexToHsl(theme.card),
    "--popover-foreground": hexToHsl(theme.text),
    "--secondary": hexToHsl(theme.surface),
    "--secondary-foreground": hexToHsl(theme.text),
    "--muted": hexToHsl(theme.surface),
    "--muted-foreground": hexToHsl(theme.textMuted),
    "--border": hexToHsl(theme.border),
    "--input": hexToHsl(theme.border),
    "--ring": hexToHsl(theme.primary),
    "--gradient-primary": `linear-gradient(135deg, ${theme.ctaBg} 0%, ${theme.primary} 100%)`,
    "--gradient-soft": `linear-gradient(135deg, ${theme.primary}22 0%, ${theme.primary}11 100%)`,
    "--shadow-glow": `0 10px 30px -10px ${theme.ctaBg}66`,
  } as React.CSSProperties;
}

function ctaButtonStyle(theme: PublicBookingTheme): React.CSSProperties {
  return {
    background: theme.ctaBg,
    color: theme.ctaText,
    borderRadius: theme.btnRadius,
  };
}

/* ------------------------ Booking flow ------------------------ */

type Step = 1 | 2 | 3 | 4;

type DayItem = { date: Date; key: string; day: string; weekday: string; month: string };

/** Data local YYYY-MM-DD (evita deslocamento de fuso com toISOString). */
function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
    const key = localDateKey(d);
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
  theme,
  themeColors,
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
  theme?: PublicBookingTheme;
  /** @deprecated Use `theme` instead */
  themeColors?: PublicBookingTheme;
}) {
  const resolvedTheme = theme ?? themeColors ?? DEFAULT_BOOKING_THEME;
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
    getPublicSlots({
      data: {
        professionalId,
        date,
        durationMin: service.duration,
      },
    })
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .catch((err) => {
        console.error("[BookingSheet] slots:", err);
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
          scheduledAt: `${date}T${time}:00${localTzSuffix()}`,
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

  const cssVars = buildBookingCssVars(resolvedTheme);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const progressPct = Math.round((step / 4) * 100);

  const bookingModal = open ? createPortal(
    <BookingThemeContext.Provider value={resolvedTheme}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Novo agendamento"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 49,
          display: "flex",
          justifyContent: "center",
          background: resolvedTheme.bg,
        }}
      >
        <div
          style={{
            ...cssVars,
            width: "100%",
            maxWidth: 430,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {done ? (
            <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
              <SuccessView
                service={service!}
                date={date!}
                time={time!}
                name={name}
                professionalName={professionalName}
                onClose={() => handleClose(false)}
              />
            </div>
          ) : (
            <>
              {/* Header — fundo sólido do tema */}
              <div
                style={{
                  flexShrink: 0,
                  background: resolvedTheme.surface,
                  borderBottom: `1px solid ${resolvedTheme.border}`,
                  padding: "14px 18px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    type="button"
                    onClick={step === 1 ? () => handleClose(false) : back}
                    aria-label="Voltar"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "none",
                      background: resolvedTheme.card,
                      color: resolvedTheme.text,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span style={{ fontFamily: resolvedTheme.headingFont, color: resolvedTheme.text, fontSize: 15, fontWeight: 700 }}>
                    Novo agendamento
                  </span>
                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    aria-label="Fechar"
                    style={{ background: "transparent", border: "none", color: resolvedTheme.textMuted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}
                  >
                    ×
                  </button>
                </div>
                <Stepper step={step} />
              </div>

              {/* Barra de progresso */}
              <div style={{ height: 3, background: resolvedTheme.border, flexShrink: 0 }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: resolvedTheme.primary, transition: "width 0.3s ease" }} />
              </div>

              {/* Corpo scrollável */}
              <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "20px 18px" }}>
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
                <div
                  style={{
                    flexShrink: 0,
                    borderTop: `1px solid ${resolvedTheme.border}`,
                    background: resolvedTheme.surface,
                    padding: "14px 18px",
                  }}
                >
                  {step === 4 ? (
                    <Button
                      onClick={confirm}
                      size="lg"
                      disabled={!acceptedPolicy}
                      className="h-14 w-full text-base font-semibold disabled:opacity-50"
                      style={ctaButtonStyle(resolvedTheme)}
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
                      className="h-14 w-full text-base font-semibold disabled:opacity-50"
                      style={ctaButtonStyle(resolvedTheme)}
                    >
                      Continuar <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BookingThemeContext.Provider>,
    document.body,
  ) : null;

  return (
    <>
    {bookingModal}
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
        onPixReserved={() => {
          setPaymentOpen(false);
          setDone(true);
          toast.success("Horário reservado!", {
            description: "Envie o comprovante PIX pelo WhatsApp. O profissional confirmará em breve.",
            duration: 8000,
          });
        }}
      />
    )}
    </>
  );
}

function Stepper({ step }: { step: Step }) {
  const theme = useBookingTheme();
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
              style={{
                height: 6,
                width: "100%",
                borderRadius: 999,
                background: done || active ? theme.primary : theme.border,
                transition: "background 0.2s",
              }}
            />
            <span
              style={{
                fontFamily: theme.bodyFont,
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: active ? theme.primary : theme.textMuted,
              }}
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
  const theme = useBookingTheme();
  return (
    <div>
      <h3 style={{ fontFamily: theme.headingFont, color: theme.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Escolha o serviço</h3>
      <p style={{ fontFamily: theme.bodyFont, color: theme.textMuted, fontSize: 14, marginTop: 4 }}>Você pode reagendar quando precisar.</p>
      <div className="mt-4 space-y-2">
        {services.map((s) => {
          const cat = categoryMeta(s.category);
          const selected = value?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                gap: 12,
                borderRadius: theme.cardRadius,
                border: `1.5px solid ${selected ? theme.primary : theme.border}`,
                background: theme.card,
                padding: 14,
                textAlign: "left",
                cursor: "pointer",
                boxShadow: selected ? `0 0 0 2px ${theme.primary}33` : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  height: 48,
                  width: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: theme.cardRadius,
                  background: theme.tagBg,
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {cat.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div style={{ fontFamily: theme.bodyFont, color: theme.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: theme.textMuted }}>
                  <Clock size={12} /> {s.duration} min
                </div>
              </div>
              <div style={{ fontFamily: theme.headingFont, fontSize: 16, fontWeight: 700, color: theme.primary, flexShrink: 0 }}>
                {formatPrice(s.price)}
              </div>
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
  const theme = useBookingTheme();
  return (
    <div>
      <h3 style={{ fontFamily: theme.headingFont, color: theme.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Quando você quer vir?</h3>
      <p style={{ fontFamily: theme.bodyFont, color: theme.textMuted, fontSize: 14, marginTop: 4 }}>Próximas datas disponíveis.</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.length === 0 && (
          <p style={{ fontSize: 14, color: theme.textMuted }}>Nenhuma data disponível nos próximos meses.</p>
        )}
        {days.map((d) => {
          const selected = d.key === date;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onDate(d.key)}
              style={{
                display: "flex",
                minWidth: 64,
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                borderRadius: theme.cardRadius,
                border: `1.5px solid ${selected ? theme.primary : theme.border}`,
                background: selected ? theme.ctaBg : theme.card,
                color: selected ? theme.ctaText : theme.text,
                padding: "12px 10px",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", opacity: selected ? 0.85 : 1, color: selected ? theme.ctaText : theme.textMuted }}>
                {d.weekday}
              </span>
              <span style={{ fontFamily: theme.headingFont, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{d.day}</span>
              <span style={{ fontSize: 10, opacity: selected ? 0.85 : 1, color: selected ? theme.ctaText : theme.textMuted }}>{d.month}</span>
            </button>
          );
        })}
      </div>

      <h4 style={{ marginTop: 24, marginBottom: 12, fontSize: 14, fontWeight: 600, color: theme.text }}>Horários disponíveis</h4>
      {loadingSlots ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 48, borderRadius: theme.cardRadius, background: theme.surface, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : !date ? (
        <p style={{ fontSize: 14, color: theme.textMuted }}>Selecione uma data para ver os horários.</p>
      ) : slots.length === 0 ? (
        <p style={{ fontSize: 14, color: theme.textMuted }}>Nenhum horário disponível nesta data.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((t) => {
            const selected = t === time;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onTime(t)}
                style={{
                  borderRadius: theme.cardRadius,
                  border: `1.5px solid ${selected ? theme.primary : theme.border}`,
                  background: selected ? theme.ctaBg : theme.card,
                  color: selected ? theme.ctaText : theme.text,
                  padding: "12px 6px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
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
  const theme = useBookingTheme();
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
        if (result.found) {
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
  const otherFieldsDisabled = !phoneReady || isLoading;

  return (
    <div>
      <h3 style={{ fontFamily: theme.headingFont, color: theme.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Seus dados</h3>
      <p style={{ fontFamily: theme.bodyFont, color: theme.textMuted, fontSize: 14, marginTop: 4 }}>Para confirmarmos seu agendamento via WhatsApp.</p>
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
  const theme = useBookingTheme();
  const d = new Date(date + "T00:00:00");
  const fmt = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return (
    <div>
      <h3 style={{ fontFamily: theme.headingFont, color: theme.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Tudo certo?</h3>
      <p style={{ fontFamily: theme.bodyFont, color: theme.textMuted, fontSize: 14, marginTop: 4 }}>Revise antes de confirmar.</p>

      <div
        style={{
          marginTop: 16,
          overflow: "hidden",
          borderRadius: theme.cardRadius,
          border: `1px solid ${theme.border}`,
          boxShadow: `0 4px 16px ${theme.border}44`,
        }}
      >
        <div style={{ background: theme.tagBg, padding: 20 }}>
          <Badge variant="secondary" style={{ background: theme.card, color: theme.text }}>{categoryMeta(service.category).label}</Badge>
          <div style={{ marginTop: 8, fontFamily: theme.headingFont, fontSize: 22, fontWeight: 700, color: theme.text }}>{service.name}</div>
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: theme.textMuted }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={14} /> {service.duration} min</span>
            <span>·</span>
            <span style={{ fontWeight: 600, color: theme.primary }}>{formatPrice(service.price)}</span>
          </div>
        </div>
        <div style={{ background: theme.card, borderTop: `1px solid ${theme.border}` }}>
          <Row icon={<CalendarDays className="h-4 w-4" />} label="Data" value={fmt.charAt(0).toUpperCase() + fmt.slice(1)} />
          <Row icon={<Clock className="h-4 w-4" />} label="Horário" value={time} />
          <Row icon={<User className="h-4 w-4" />} label="Cliente" value={name} />
          <Row icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={phone} />
          {email && <Row icon={<Mail className="h-4 w-4" />} label="E-mail" value={email} />}
          {notes && <Row icon={<MessageCircle className="h-4 w-4" />} label="Observações" value={notes} />}
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          overflow: "hidden",
          borderRadius: theme.cardRadius,
          border: `1px solid ${theme.primary}33`,
          background: theme.card,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${theme.border}`, background: theme.surface, padding: "12px 20px" }}>
          <div style={{ display: "flex", height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: theme.ctaBg, color: theme.ctaText }}>
            <Wallet size={16} />
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
  const theme = useBookingTheme();
  const d = new Date(date + "T00:00:00");
  const fmt = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return (
    <div className="px-6 pb-8 pt-10 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        style={{
          margin: "0 auto",
          display: "flex",
          height: 80,
          width: 80,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: theme.ctaBg,
          color: theme.ctaText,
          boxShadow: `0 8px 24px ${theme.ctaBg}55`,
        }}
      >
        <CheckCircle2 size={40} />
      </motion.div>
      <h3 style={{ marginTop: 20, fontFamily: theme.headingFont, fontSize: 24, fontWeight: 700, color: theme.text }}>Agendamento solicitado!</h3>
      <p style={{ marginTop: 8, fontSize: 14, color: theme.textMuted, lineHeight: 1.6 }}>
        {name?.split(" ")[0] || "Você"}, seu horário com <span style={{ fontWeight: 600, color: theme.text }}>{professionalName}</span> está reservado.
        <br />Enviamos a confirmação para seu WhatsApp e e-mail.
      </p>

      <div
        style={{
          margin: "24px auto 0",
          maxWidth: 360,
          borderRadius: theme.cardRadius,
          border: `1px solid ${theme.border}`,
          background: theme.tagBg,
          padding: 20,
          textAlign: "left",
        }}
      >
        <div style={{ fontFamily: theme.headingFont, fontSize: 18, fontWeight: 700, color: theme.text }}>{service.name}</div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: theme.textMuted }}>
          <CalendarDays size={16} color={theme.primary} />
          <span className="capitalize">{fmt}</span>
        </div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: theme.textMuted }}>
          <Clock size={16} color={theme.primary} /> {time} · {service.duration} min
        </div>
      </div>

      <div
        style={{
          margin: "12px auto 0",
          maxWidth: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: theme.cardRadius,
          border: `1px solid ${theme.primary}33`,
          background: theme.surface,
          padding: "8px 16px",
          fontSize: 12,
          color: theme.textMuted,
        }}
      >
        <ShieldCheck size={16} color={theme.primary} />
        Sinal de <strong style={{ color: theme.text }}>{formatPrice(Math.round(service.price_cents * 0.3) / 100)}</strong> pago via PIX pessoal.
      </div>

      <Button
        onClick={onClose}
        size="lg"
        className="mt-6 h-14 w-full text-base font-semibold"
        style={ctaButtonStyle(theme)}
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
  onPixReserved,
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
  onPixReserved?: () => void;
}) {
  type PayMethod = "mp_pix" | "mp_card" | "pix_manual";
  const hasPix = pix?.enabled && !!pix?.key;
  const defaultMethod: PayMethod = mpConnected
    ? "mp_pix"
    : hasPix
      ? "pix_manual"
      : "mp_card";

  const TOTAL_SECONDS = 10 * 60;
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [processing, setProcessing] = useState(false);
  const [mpLoading, setMpLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [mpPixQrDataUrl, setMpPixQrDataUrl] = useState<string | null>(null);
  const [mpPixQrCode, setMpPixQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mpPixCopied, setMpPixCopied] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>(defaultMethod);
  const [pixAppointmentId, setPixAppointmentId] = useState<string | null>(null);
  const [mpPixAppointmentId, setMpPixAppointmentId] = useState<string | null>(null);
  const pixReservedRef = useRef(false);
  const mpPixReservedRef = useRef(false);
  const prevPayMethodRef = useRef<PayMethod>(defaultMethod);

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
      setMpPixCopied(false);
      setPayMethod(defaultMethod);
      setPixAppointmentId(null);
      setMpPixAppointmentId(null);
      setMpPixQrCode(null);
      setMpPixQrDataUrl(null);
      pixReservedRef.current = false;
      mpPixReservedRef.current = false;
      prevPayMethodRef.current = defaultMethod;
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cancela reserva ao trocar de método de pagamento
  useEffect(() => {
    if (!open || prevPayMethodRef.current === payMethod) return;
    const prev = prevPayMethodRef.current;
    const cancelId =
      prev === "pix_manual"
        ? pixAppointmentId
        : prev === "mp_pix"
          ? mpPixAppointmentId
          : null;
    if (cancelId) {
      cancelPendingPublicBooking({ data: { appointmentId: cancelId } }).catch(() => {});
    }
    if (prev === "pix_manual") {
      setPixAppointmentId(null);
      pixReservedRef.current = false;
    }
    if (prev === "mp_pix") {
      setMpPixAppointmentId(null);
      setMpPixQrCode(null);
      setMpPixQrDataUrl(null);
      mpPixReservedRef.current = false;
    }
    prevPayMethodRef.current = payMethod;
  }, [payMethod, open, pixAppointmentId, mpPixAppointmentId]);

  // PIX Mercado Pago: gera QR na tela (sem redirecionar)
  useEffect(() => {
    if (!open || payMethod !== "mp_pix" || !mpConnected || mpPixReservedRef.current) return;
    mpPixReservedRef.current = true;
    createMpPixPaymentAndBooking({
      data: {
        professionalId,
        serviceId: service.id,
        scheduledAt: `${date}T${time}:00${localTzSuffix()}`,
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
    })
      .then(({ appointmentId, qrCode, qrCodeBase64 }) => {
        setMpPixAppointmentId(appointmentId);
        setMpPixQrCode(qrCode);
        if (qrCodeBase64) {
          setMpPixQrDataUrl(`data:image/png;base64,${qrCodeBase64}`);
        }
      })
      .catch(() => {
        toast.error("Não foi possível gerar o PIX. Tente novamente.");
        onOpenChange(false);
      });
  }, [
    open,
    payMethod,
    mpConnected,
    professionalId,
    service.id,
    date,
    time,
    clientName,
    clientPhone,
    clientEmail,
    clientNotes,
    service.duration,
    service.price_cents,
    depositCents,
    professionalSlug,
    onOpenChange,
  ]);

  // QR MP a partir do código (fallback se base64 não vier)
  useEffect(() => {
    if (!open || !mpPixQrCode || mpPixQrDataUrl) return;
    import("qrcode").then(({ default: QRCode }) => {
      QRCode.toDataURL(mpPixQrCode, { width: 200, margin: 1 })
        .then(setMpPixQrDataUrl)
        .catch(() => setMpPixQrDataUrl(null));
    });
  }, [open, mpPixQrCode, mpPixQrDataUrl]);

  // PIX manual: reserva slot no servidor ao abrir (sem confirmação client-side)
  useEffect(() => {
    if (!open || payMethod !== "pix_manual" || !hasPix || pixReservedRef.current) return;
    pixReservedRef.current = true;
    createPublicPixBooking({
      data: {
        professionalId,
        serviceId: service.id,
        scheduledAt: `${date}T${time}:00${localTzSuffix()}`,
        durationMinutes: service.duration,
        priceCents: service.price_cents,
        clientName,
        clientPhone,
        clientEmail,
        notes: clientNotes,
      },
    })
      .then(({ appointmentId }) => setPixAppointmentId(appointmentId))
      .catch(() => {
        toast.error("Não foi possível reservar o horário.");
        onOpenChange(false);
      });
  }, [open, payMethod, hasPix, professionalId, service.id, date, time, clientName, clientPhone, clientEmail, clientNotes, service.duration, service.price_cents, onOpenChange]);

  async function handleMpPay() {
    setMpLoading(true);
    try {
      const { initPoint } = await createMpPreferenceAndBooking({
        data: {
          professionalId,
          serviceId: service.id,
          scheduledAt: `${date}T${time}:00${localTzSuffix()}`,
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
        if (r <= 1) {
          window.clearInterval(id);
          const expiredId = pixAppointmentId ?? mpPixAppointmentId;
          if (expiredId) {
            cancelPendingPublicBooking({ data: { appointmentId: expiredId } }).catch(() => {});
          }
          onExpired();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, onExpired, pixAppointmentId, mpPixAppointmentId]);

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

  async function copyMpPix() {
    if (!mpPixQrCode) return;
    try {
      await navigator.clipboard.writeText(mpPixQrCode);
      setMpPixCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setMpPixCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  function handleFreeConfirm() {
    setProcessing(true);
    onConfirmed();
  }

  const isFreeBooking = !mpConnected && !hasPix;

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
                    {payMethod === "mp_pix"
                      ? "PIX via Mercado Pago — confirmação automática"
                      : payMethod === "mp_card"
                        ? "Cartão de crédito ou débito"
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

            {/* Escolha do método de pagamento */}
            {mpConnected && (
              <div
                className={cn(
                  "mt-4 grid gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-1",
                  hasPix ? "grid-cols-3" : "grid-cols-2",
                )}
              >
                <button
                  type="button"
                  onClick={() => setPayMethod("mp_pix")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition",
                    payMethod === "mp_pix"
                      ? "bg-card shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <QrCode className="h-3.5 w-3.5 shrink-0" /> PIX
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod("mp_card")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition",
                    payMethod === "mp_card"
                      ? "bg-card shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <CreditCard className="h-3.5 w-3.5 shrink-0" /> Cartão
                </button>
                {hasPix && (
                  <button
                    type="button"
                    onClick={() => setPayMethod("pix_manual")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[10px] font-semibold transition sm:text-xs",
                      payMethod === "pix_manual"
                        ? "bg-card shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <QrCode className="h-3.5 w-3.5 shrink-0" /> PIX direto
                  </button>
                )}
              </div>
            )}

            {/* ── PIX Mercado Pago (QR na tela) ── */}
            {payMethod === "mp_pix" && (
              <>
                <div className="mt-4 flex flex-col items-center rounded-3xl border border-border/60 bg-card p-5">
                  {mpPixQrDataUrl ? (
                    <img
                      src={mpPixQrDataUrl}
                      alt="QR Code PIX Mercado Pago"
                      className="h-[176px] w-[176px] rounded-xl"
                    />
                  ) : (
                    <div className="flex h-[176px] w-[176px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 text-muted-foreground">
                      <QrCode className="h-16 w-16 animate-pulse" />
                    </div>
                  )}
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Escaneie o QR Code no app do banco ou copie o código PIX abaixo.
                  </p>
                  <button
                    type="button"
                    onClick={copyMpPix}
                    disabled={!mpPixQrCode}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary/70 disabled:opacity-50"
                  >
                    {mpPixCopied ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {mpPixCopied ? "Copiado!" : "Copiar código PIX"}
                  </button>
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {firstName}, assim que o pagamento for detectado, seu agendamento será
                  confirmado automaticamente. Se o tempo expirar, o horário será liberado.
                </p>
              </>
            )}

            {/* ── Cartão Mercado Pago (redireciona) ── */}
            {payMethod === "mp_card" && (
              <div className="mt-4 flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#009EE3]/10">
                  <CreditCard className="h-8 w-8 text-[#009EE3]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Pagar com cartão</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Você será redirecionado ao Mercado Pago para pagar com cartão de crédito
                    ou débito. Ao concluir, seu agendamento será confirmado automaticamente.
                  </p>
                </div>
                <Button
                  onClick={handleMpPay}
                  disabled={mpLoading || remaining === 0}
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-[#009EE3] text-sm font-bold text-white hover:bg-[#0082bd] disabled:opacity-60"
                >
                  {mpLoading ? (
                    "Aguarde…"
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" /> Pagar {formatPrice(depositValue)} com cartão
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* ── PIX manual (chave do profissional) ── */}
            {payMethod === "pix_manual" && (
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
                  {firstName}, após enviar o comprovante pelo WhatsApp, o profissional confirmará seu agendamento manualmente.
                  Se o tempo expirar, o slot será liberado.
                </p>

                {isFreeBooking && (
                  <Button onClick={handleFreeConfirm} disabled={processing || remaining === 0} size="lg"
                    className="mt-5 h-14 w-full rounded-2xl gradient-primary text-base font-semibold text-white shadow-glow disabled:opacity-60">
                    {processing ? "Registrando…" : <><Check className="mr-2 h-5 w-5" /> Confirmar agendamento</>}
                  </Button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => {
                const reservedId =
                  payMethod === "pix_manual"
                    ? pixAppointmentId
                    : payMethod === "mp_pix"
                      ? mpPixAppointmentId
                      : null;
                if (reservedId) {
                  onPixReserved?.();
                } else {
                  onOpenChange(false);
                }
              }}
              className="mt-3 w-full rounded-xl py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {(payMethod === "pix_manual" && pixAppointmentId) ||
              (payMethod === "mp_pix" && mpPixAppointmentId)
                ? payMethod === "pix_manual"
                  ? "Concluir — enviarei o comprovante"
                  : "Concluir — aguardando confirmação do PIX"
                : "Cancelar e liberar o horário"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}