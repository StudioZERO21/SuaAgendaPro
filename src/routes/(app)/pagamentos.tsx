import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  History,
  Link2,
  QrCode,
  Search,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Unlink,
  X,
  XCircle,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { LazyImage } from "@/components/ui/lazy-image";
import { useClientes, type UIClient } from "@/hooks/useClientes";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useServices } from "@/hooks/useServicos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  createPaymentTransaction,
  disconnectMercadoPago,
  EMPTY_PAYMENT_SETTINGS,
  getPaymentSettings,
  listMercadoPagoOAuthAttempts,
  listPaymentTransactions,
  savePaymentSettings,
  startMercadoPagoOAuth,
  syncMercadoPagoTransactions,
  updatePaymentTransactionStatus,
  type PaymentSettings,
  type PaymentTransaction,
  type PixKeyType,
} from "@/lib/payments.functions";
import { buildPixPayload } from "@/lib/pix";

export const Route = createFileRoute("/(app)/pagamentos")({
  head: () => ({
    meta: [
      { title: "Pagamentos — SuaAgenda.Pro" },
      { name: "description", content: "Conecte o Mercado Pago e configure sua chave Pix." },
    ],
  }),
  component: PagamentosPage,
});

const PIX_TYPES: { value: PixKeyType; label: string; placeholder: string }[] = [
  { value: "cpf",      label: "CPF",       placeholder: "000.000.000-00" },
  { value: "cnpj",     label: "CNPJ",      placeholder: "00.000.000/0000-00" },
  { value: "email",    label: "E-mail",    placeholder: "voce@exemplo.com" },
  { value: "telefone", label: "Telefone",  placeholder: "(11) 99999-9999" },
  { value: "aleatoria",label: "Aleatória", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
];

// ── Máscaras de entrada ───────────────────────────────────────

function maskCpf(d: string) {
  const v = d.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 3) return v;
  if (v.length <= 6) return `${v.slice(0,3)}.${v.slice(3)}`;
  if (v.length <= 9) return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
  return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9)}`;
}

function maskCnpj(d: string) {
  const v = d.replace(/\D/g, "").slice(0, 14);
  if (v.length <= 2) return v;
  if (v.length <= 5) return `${v.slice(0,2)}.${v.slice(2)}`;
  if (v.length <= 8) return `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
  if (v.length <= 12) return `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
  return `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
}

function maskPhone(d: string) {
  const v = d.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 2) return v.length ? `(${v}` : "";
  if (v.length <= 6) return `(${v.slice(0,2)}) ${v.slice(2)}`;
  if (v.length <= 10) return `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`;
  return `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
}

function getDisplayKey(type: PixKeyType, key: string): string {
  switch (type) {
    case "cpf":      return maskCpf(key);
    case "cnpj":     return maskCnpj(key);
    case "telefone": {
      const digits = key.replace(/\D/g, "");
      // strip country code 55 if present
      const local = digits.length >= 12 && digits.startsWith("55") ? digits.slice(2) : digits;
      return maskPhone(local);
    }
    default: return key;
  }
}

function handleKeyInput(type: PixKeyType, inputValue: string): string {
  if (type === "cpf" || type === "cnpj" || type === "telefone") {
    return inputValue.replace(/\D/g, "");
  }
  return inputValue;
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function normalizeKey(type: PixKeyType, value: string) {
  const digits = value.replace(/\D/g, "");
  if (type === "cpf" || type === "cnpj") return digits;
  if (type === "telefone") {
    if (!digits) return "";
    // local (10–11 digits) → add +55; already has country code (12–13) → keep
    return digits.length <= 11 ? `+55${digits}` : `+${digits}`;
  }
  return value.trim();
}

function centsToCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseCurrencyToCents(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(".", "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
}

function statusLabel(status: PaymentTransaction["status"]) {
  switch (status) {
    case "paid":
      return "Pago";
    case "failed":
      return "Falhou";
    case "cancelled":
      return "Cancelado";
    case "refunded":
      return "Estornado";
    default:
      return "Pendente";
  }
}

function PagamentosPage() {
  const navigate = useNavigate();
  const fetchSettings = useServerFn(getPaymentSettings);
  const persistSettings = useServerFn(savePaymentSettings);
  const startOAuth = useServerFn(startMercadoPagoOAuth);
  const disconnectMpSecure = useServerFn(disconnectMercadoPago);
  const fetchTransactions = useServerFn(listPaymentTransactions);
  const createTransaction = useServerFn(createPaymentTransaction);
  const updateTransaction = useServerFn(updatePaymentTransactionStatus);
  const syncMp = useServerFn(syncMercadoPagoTransactions);
  const fetchAttempts = useServerFn(listMercadoPagoOAuthAttempts);
  const [cfg, setCfg] = useState<PaymentSettings>(EMPTY_PAYMENT_SETTINGS);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [attempts, setAttempts] = useState<
    Array<{ id: string; status: string; reason: string | null; created_at: string; completed_at: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [authBlocked, setAuthBlocked] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [amount, setAmount] = useState("");
  const [clientName, setClientName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [extraAmount, setExtraAmount] = useState("");
  const [showClientList, setShowClientList] = useState(false);
  const [connectingMp, setConnectingMp] = useState(false);
  const [pixConfirmOpen, setPixConfirmOpen] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [activeTransaction, setActiveTransaction] = useState<PaymentTransaction | null>(null);
  const { data: realClients = [] } = useClientes();
  const { data: realAppts = [] } = useAgendamentos();
  const { data: realServices = [] } = useServices();

  const refreshAttempts = () => {
    fetchAttempts()
      .then((rows) => setAttempts(rows as typeof attempts))
      .catch(() => {});
  };

  useEffect(() => {
    let active = true;
    try {
      localStorage.removeItem("sa.payments");
    } catch {}
    try {
      const params = new URLSearchParams(window.location.search);
      const mpParam = params.get("mp");
      if (mpParam === "success") {
        toast.success("Mercado Pago conectado com sucesso!", {
          description: "Sua conta está pronta para receber pagamentos.",
        });
      }
      if (mpParam === "error") {
        const reason = params.get("reason") || "";
        const messages: Record<string, { title: string; description: string }> = {
          not_configured: {
            title: "Integração indisponível",
            description: "As credenciais OAuth do app ainda não foram configuradas. Tente mais tarde.",
          },
          invalid_state: {
            title: "Sessão expirada",
            description: "O link de autorização expirou. Clique em conectar novamente.",
          },
          missing_params: {
            title: "Resposta incompleta",
            description: "O Mercado Pago não devolveu os dados esperados. Tente outra vez.",
          },
          exchange_failed: {
            title: "Não foi possível autorizar",
            description: "O Mercado Pago rejeitou a autorização. Verifique se autorizou todas as permissões.",
          },
          secret_save_failed: {
            title: "Erro ao salvar credenciais",
            description: "Não conseguimos guardar a conexão com segurança. Tente novamente.",
          },
          settings_save_failed: {
            title: "Erro ao salvar configuração",
            description: "Conexão autorizada, mas falhou ao atualizar suas preferências.",
          },
          access_denied: {
            title: "Autorização cancelada",
            description: "Você precisa autorizar o app para concluir a conexão.",
          },
        };
        const msg = messages[reason] ?? {
          title: "Falha ao conectar Mercado Pago",
          description: reason || "Tente novamente em instantes.",
        };
        toast.error(msg.title, { description: msg.description });
      }
      if (mpParam) {
        const url = new URL(window.location.href);
        url.searchParams.delete("mp");
        url.searchParams.delete("reason");
        window.history.replaceState({}, "", url.toString());
        // refresh OAuth attempts after the redirect-back
        setTimeout(() => {
          fetchAttempts()
            .then((rows) => setAttempts(rows as typeof attempts))
            .catch(() => {});
        }, 600);
      }
    } catch {}
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sess } = await supabase.auth.getSession();
      if (!active) return;
      if (!sess.session) {
        setAuthBlocked(true);
        setLoading(false);
        return;
      }
      try {
        const [settings, rows, attemptRows] = await Promise.all([
          fetchSettings(),
          fetchTransactions({ data: { limit: 30 } }),
          fetchAttempts().catch(() => [] as typeof attempts),
        ]);
        if (!active) return;
        setCfg(settings);
        setTransactions(rows);
        setAttempts(attemptRows as typeof attempts);
      } catch {
        if (!active) return;
        setAuthBlocked(true);
        toast.error("Entre na conta para salvar pagamentos com segurança.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchSettings, fetchTransactions, fetchAttempts]);

  const pix = cfg.pix;
  const mp = cfg.mercadoPago;

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return realClients.slice(0, 6);
    return realClients
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 8);
  }, [clientQuery, realClients]);

  const selectedClient = useMemo<UIClient | null>(
    () => realClients.find((c) => c.id === selectedClientId) ?? null,
    [selectedClientId, realClients],
  );

  const openItems = useMemo(() => {
    if (!selectedClientId) return [] as Array<{ id: string; serviceName: string; priceCents: number }>;
    return realAppts
      .filter((a) => a.clientId === selectedClientId && (a.status === "pendente" || a.status === "confirmado"))
      .map((a) => {
        const svc = realServices.find((s) => s.id === a.serviceId);
        return {
          id: a.id,
          serviceName: svc?.name ?? "Serviço",
          priceCents: a.priceCents,
        };
      });
  }, [selectedClientId, realAppts, realServices]);

  const selectedItemsCents = useMemo(
    () => openItems.filter((it) => selectedAppointments.includes(it.id)).reduce((s, it) => s + it.priceCents, 0),
    [openItems, selectedAppointments],
  );

  const extraCents = parseCurrencyToCents(extraAmount);
  const manualCents = parseCurrencyToCents(amount);
  const totalCents = selectedClient ? selectedItemsCents + extraCents : manualCents;
  const totalDescription = selectedClient
    ? openItems
        .filter((it) => selectedAppointments.includes(it.id))
        .map((it) => it.serviceName)
        .concat(extraCents > 0 ? ["Valor extra"] : [])
        .join(" + ") || serviceName
    : serviceName;
  const chargeClientName = selectedClient?.name || clientName;

  const pixPayload = useMemo(() => {
    if (!pix.enabled || !pix.key || !pix.beneficiaryName || !pix.city) return "";
    try {
      return buildPixPayload({
        key: normalizeKey(pix.keyType, pix.key),
        name: pix.beneficiaryName,
        city: pix.city,
        amount: totalCents > 0 ? totalCents / 100 : undefined,
      });
    } catch {
      return "";
    }
  }, [pix, totalCents]);

  useEffect(() => {
    if (!showQr || !pixPayload) return;
    QRCode.toDataURL(pixPayload, { width: 720, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [showQr, pixPayload]);

  const updatePix = (patch: Partial<PaymentSettings["pix"]>) =>
    setCfg((c) => ({ ...c, pix: { ...c.pix, ...patch } }));

  const activateMethod = async (method: "pix" | "mercado_pago") => {
    setSaving(true);
    try {
      const saved = await persistSettings({ data: { ...cfg, activePaymentMethod: method } });
      setCfg(saved);
      toast.success(
        method === "pix"
          ? "PIX pessoal ativado como método de pagamento."
          : "Mercado Pago ativado como método de pagamento.",
      );
    } catch {
      toast.error("Não foi possível salvar. Verifique se você está logada.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateMethod = async () => {
    setSaving(true);
    try {
      const saved = await persistSettings({ data: { ...cfg, activePaymentMethod: null } });
      setCfg(saved);
      toast.success("Método de pagamento desativado.");
    } catch {
      toast.error("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const savePix = async () => {
    setSaving(true);
    try {
      // pix.enabled = true sempre que há dados de PIX (o Switch foi removido)
      const data = { ...cfg, pix: { ...cfg.pix, enabled: !!(cfg.pix.key && cfg.pix.beneficiaryName && cfg.pix.city) } };
      const saved = await persistSettings({ data });
      setCfg(saved);
      toast.success("Dados do PIX salvos.");
    } catch {
      toast.error("Não foi possível salvar. Verifique se você está logada.");
    } finally {
      setSaving(false);
    }
  };

  const handlePixSaveClick = () => {
    if (pix.keyType === "email" && pix.key && !isValidEmail(pix.key)) {
      setEmailError("E-mail inválido. Verifique antes de salvar.");
      return;
    }
    setEmailError("");
    setPixConfirmOpen(true);
  };

  const connectMp = async () => {
    setConnectingMp(true);
    try {
      const result = await startOAuth({ data: { origin: window.location.origin } });
      if (!result.ok) {
        toast.error(
          "Conexão indisponível. As credenciais do app Mercado Pago ainda não foram configuradas.",
        );
        return;
      }
      window.location.href = result.url;
    } catch {
      toast.error("Não foi possível iniciar a conexão. Tente novamente.");
    } finally {
      setConnectingMp(false);
      refreshAttempts();
    }
  };

  const disconnectMp = async () => {
    setSaving(true);
    try {
      const saved = await disconnectMpSecure();
      setCfg(saved);
      toast.success("Mercado Pago desconectado.");
    } catch {
      toast.error("Não foi possível desconectar agora.");
    } finally {
      setSaving(false);
    }
  };

  const generateCharge = async () => {
    if (!chargeClientName.trim() || totalCents <= 0 || !pixPayload) {
      toast.error("Selecione a cliente, informe o valor e configure uma chave Pix válida.");
      return;
    }
    setSaving(true);
    try {
      const tx = await createTransaction({
        data: {
          clientName: chargeClientName,
          serviceName: totalDescription,
          amountCents: totalCents,
          method: "pix_manual",
          status: "pending",
          pixPayload,
        },
      });
      setTransactions((rows) => [tx, ...rows]);
      setActiveTransaction(tx);
      setShowQr(true);
    } catch {
      toast.error("Não foi possível registrar a cobrança.");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (tx: PaymentTransaction) => {
    try {
      const updated = await updateTransaction({ data: { id: tx.id, status: "paid" } });
      setTransactions((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
      setActiveTransaction(updated);
      toast.success("Pagamento marcado como recebido.");
    } catch {
      toast.error("Não foi possível atualizar o pagamento.");
    }
  };

  const syncMercadoPago = async () => {
    setSyncing(true);
    try {
      const result = await syncMp();
      if (result.unavailable) {
        toast.error("Mercado Pago indisponível no momento.");
        return;
      }
      const rows = await fetchTransactions({ data: { limit: 30 } });
      setTransactions(rows);
      toast.success(`${result.imported} transações sincronizadas.`);
    } catch {
      toast.error("Não foi possível sincronizar o Mercado Pago.");
    } finally {
      setSyncing(false);
    }
  };

  const copyPayload = async () => {
    if (!pixPayload) return;
    try {
      await navigator.clipboard.writeText(pixPayload);
      toast.success("Código Pix copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const pixReady = pix.enabled && !!pixPayload;
  const pendingTotal = transactions
    .filter((tx) => tx.status === "pending")
    .reduce((sum, tx) => sum + tx.amount_cents, 0);
  const paidTotal = transactions
    .filter((tx) => tx.status === "paid")
    .reduce((sum, tx) => sum + tx.amount_cents, 0);

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
            Conta
          </p>
          <h1 className="font-display text-2xl font-bold leading-tight">Pagamentos</h1>
        </div>
      </header>

      <main className="mt-5 flex-1 space-y-6 px-5 pb-8">
        {authBlocked && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm font-bold">Acesso seguro necessário</p>
            <p className="mt-1 text-xs leading-relaxed">
              Para proteger as credenciais do Mercado Pago e salvar o histórico, entre na conta do app.
            </p>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3">
          <section className="relative flex flex-col overflow-hidden rounded-xl bg-emerald-50 p-4 pb-2">
            <div className="absolute -bottom-3 -right-3 opacity-10">
              <Wallet className="h-20 w-20 text-emerald-700" />
            </div>
            <div className="flex flex-1 items-center justify-center">
              <p className="font-display text-5xl font-bold text-emerald-800">
                <span className="mr-3 text-sm">R$</span>
                {centsToCurrency(paidTotal).replace('R$', '').trim()}
              </p>
            </div>
            <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-wider text-emerald-700/20">
              Recebido
            </p>
          </section>
          <section className="relative flex flex-col overflow-hidden rounded-xl bg-red-50 p-4 pb-2">
            <div className="absolute -bottom-3 -right-3 opacity-10">
              <Clock className="h-20 w-20 text-red-700" />
            </div>
            <div className="flex flex-1 items-center justify-center">
              <p className="font-display text-5xl font-bold text-red-800">
                <span className="mr-3 text-sm">R$</span>
                {centsToCurrency(pendingTotal).replace('R$', '').trim()}
              </p>
            </div>
            <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-wider text-red-700/20">
              Pendente
            </p>
          </section>
        </div>

        <Tabs defaultValue="cobrar" className="w-full">
          <TabsList className="grid h-9 w-full grid-cols-3 rounded-full bg-secondary p-1 text-muted-foreground">
            <TabsTrigger
              value="cobrar"
              className="rounded-full px-3 text-xs font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card"
            >
              Cobrar
            </TabsTrigger>
            <TabsTrigger
              value="config"
              className="rounded-full px-3 text-xs font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card"
            >
              Configurar
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="rounded-full px-3 text-xs font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card"
            >
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cobrar" className="mt-5 space-y-4">
            <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-soft text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold">Pagamento no salão</p>
                  <p className="text-xs text-muted-foreground">Gere um QR Code com valor fechado.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  {selectedClient ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: selectedClient.color }}
                        >
                          {selectedClient.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{selectedClient.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{selectedClient.phone}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClientId(null);
                          setSelectedAppointments([]);
                          setExtraAmount("");
                          setClientQuery("");
                        }}
                        className="text-xs font-semibold text-primary"
                      >
                        Trocar
                      </button>
                    </div>
                  ) : (
                  <div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={clientQuery}
                        onChange={(e) => {
                          setClientQuery(e.target.value);
                          setShowClientList(true);
                          setClientName(e.target.value);
                        }}
                        onFocus={() => setShowClientList(true)}
                        placeholder="Buscar cliente por nome ou telefone"
                        className="pl-9"
                        maxLength={120}
                      />
                    </div>
                    {showClientList && filteredClients.length > 0 && (
                      <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-card shadow-card">
                        {filteredClients.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedClientId(c.id);
                              setClientName(c.name);
                              setShowClientList(false);
                              setClientQuery("");
                              const pending = realAppts
                                .filter((a) => a.clientId === c.id && (a.status === "pendente" || a.status === "confirmado"))
                                .map((a) => a.id);
                              setSelectedAppointments(pending);
                            }}
                            className="flex w-full items-center gap-2 border-b border-border/60 px-3 py-2 text-left last:border-0 hover:bg-secondary/50"
                          >
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
                              style={{ background: c.color }}
                            >
                              {c.initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{c.name}</p>
                              <p className="truncate text-[11px] text-muted-foreground">{c.phone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Não encontrou? Continue digitando o nome e use o valor manual abaixo.
                    </p>
                  </div>
                  )}
                </div>

                {selectedClient && (
                  <div className="space-y-2">
                    <Label>Serviços em aberto</Label>
                    {openItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-3 text-center text-xs text-muted-foreground">
                        Nenhum serviço pendente. Informe um valor manual abaixo.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {openItems.map((it) => {
                          const checked = selectedAppointments.includes(it.id);
                          return (
                            <button
                              key={it.id}
                              type="button"
                              onClick={() =>
                                setSelectedAppointments((prev) =>
                                  prev.includes(it.id) ? prev.filter((x) => x !== it.id) : [...prev, it.id],
                                )
                              }
                              className={`flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-left transition-all ${
                                checked
                                  ? "border-primary bg-primary/5"
                                  : "border-border bg-card hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                    checked
                                      ? "border-primary bg-primary text-white"
                                      : "border-border bg-card"
                                  }`}
                                >
                                  {checked && <Check className="h-3.5 w-3.5" />}
                                </div>
                                <p className="truncate text-sm font-semibold">{it.serviceName}</p>
                              </div>
                              <p className="text-sm font-bold text-primary">{centsToCurrency(it.priceCents)}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {selectedClient ? (
                  <div className="space-y-2">
                    <Label htmlFor="extraAmount">Valor extra (opcional)</Label>
                    <Input
                      id="extraAmount"
                      inputMode="decimal"
                      value={extraAmount}
                      onChange={(e) => setExtraAmount(e.target.value)}
                      placeholder="R$ 0,00"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Some um valor adicional (ex.: produto avulso ou gorjeta).
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="serviceName">Serviço</Label>
                      <Input id="serviceName" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Ex.: Volume brasileiro" maxLength={160} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chargeAmount">Valor a pagar</Label>
                      <Input id="chargeAmount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="R$ 0,00" className="font-display text-lg font-bold" />
                    </div>
                  </>
                )}

                {selectedClient && totalCents > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
                    <p className="font-display text-lg font-bold text-primary">{centsToCurrency(totalCents)}</p>
                  </div>
                )}

                <Button disabled={!pixReady || saving || loading || totalCents <= 0 || !chargeClientName.trim()} onClick={generateCharge} className="h-12 w-full rounded-2xl gradient-primary text-sm font-bold text-white shadow-glow disabled:opacity-50">
                  <QrCode className="mr-2 h-4 w-4" /> Gerar QR Code de pagamento
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="config" className="mt-5 space-y-6">

        {/* ── Banner: método ativo ── */}
        {(() => {
          const active = cfg.activePaymentMethod;
          const pixReady = !!(pix.key && pix.beneficiaryName && pix.city);
          const mpReady = mp.connected;
          if (!active) {
            return (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Nenhum método ativo</p>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                    {pixReady || mpReady
                      ? "Configure e ative um método abaixo para que clientes consigam pagar o sinal online."
                      : "Configure o PIX pessoal ou conecte o Mercado Pago para receber sinais de agendamento."}
                  </p>
                </div>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <Check className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Método ativo</p>
                <p className="font-display text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  {active === "pix" ? "PIX pessoal" : "Mercado Pago"}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  {active === "pix"
                    ? "Confirmação manual — o cliente envia o comprovante pelo WhatsApp."
                    : "Confirmação automática — o sistema aprova o agendamento assim que o pagamento é confirmado."}
                </p>
              </div>
              <Button size="sm" variant="outline" disabled={saving} onClick={deactivateMethod}
                className="h-8 shrink-0 rounded-full border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-100">
                Desativar
              </Button>
            </div>
          );
        })()}

        {/* Status da conta */}
        <AccountStatusCard
          connected={mp.connected}
          email={mp.accountEmail}
          pixEnabled={!!(pix.key && pix.beneficiaryName && pix.city)}
          lastAttempt={attempts[0] ?? null}
        />

        {/* ── Mercado Pago ── */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg,#00b1ea,#009ee3)" }}>
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold">Mercado Pago</p>
              <p className="text-xs text-muted-foreground">Receba por cartão, boleto e Pix — aprovação automática.</p>
            </div>
            {cfg.activePaymentMethod === "mercado_pago" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <Check className="h-3 w-3" /> Ativo
              </span>
            ) : mp.connected ? (
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">Conectado</span>
            ) : (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inativo</span>
            )}
          </div>
          <div className="flex items-start gap-2 border-t border-border bg-sky-50/60 px-4 py-2.5 dark:bg-sky-950/20">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
            <p className="text-[11px] text-sky-700 dark:text-sky-400">
              <span className="font-bold">Aprovação automática:</span> quando o cliente paga pelo Mercado Pago, o sistema confirma o agendamento sozinho, sem ação manual.
            </p>
          </div>
          <div className="border-t border-border bg-secondary/40 p-3">
            {mp.connected ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-muted-foreground">{mp.accountEmail || "Conta conectada"}</p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" disabled={saving} className="h-9 shrink-0 rounded-full text-xs">
                        <Unlink className="mr-1 h-3.5 w-3.5" /> Desconectar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Desconectar Mercado Pago?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A credencial OAuth será apagada. Se este era o método ativo, os clientes não conseguirão mais pagar pelo Mercado Pago.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={disconnectMp} className="bg-destructive text-white hover:bg-destructive/90">
                          Desconectar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                {cfg.activePaymentMethod !== "mercado_pago" && (
                  <Button onClick={() => activateMethod("mercado_pago")} disabled={saving}
                    className="h-10 w-full rounded-full bg-[#009EE3] text-sm font-semibold text-white hover:bg-[#0082bd]">
                    <Check className="mr-2 h-4 w-4" /> Ativar Mercado Pago
                  </Button>
                )}
              </div>
            ) : (
              <Button onClick={connectMp} disabled={connectingMp}
                className="h-10 w-full rounded-full gradient-primary text-sm font-semibold text-white shadow-glow">
                <Link2 className="mr-2 h-4 w-4" />
                {connectingMp ? "Redirecionando..." : "Conectar com Mercado Pago"}
              </Button>
            )}
          </div>
        </section>

        {/* Histórico de tentativas OAuth */}
        <AttemptsLog attempts={attempts} />

        {/* ── PIX pessoal ── */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-soft text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold">Chave PIX pessoal</p>
              <p className="text-xs text-muted-foreground">QR Code direto para sua conta — sem taxas do app.</p>
            </div>
            {cfg.activePaymentMethod === "pix" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <Check className="h-3 w-3" /> Ativo
              </span>
            ) : pix.key && pix.beneficiaryName ? (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Configurado</span>
            ) : (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inativo</span>
            )}
          </div>

          <div className="flex items-start gap-2 border-t border-border bg-amber-50/60 px-4 py-2.5 dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              <span className="font-bold">Aprovação manual:</span> você confirma o agendamento após verificar o comprovante enviado pelo cliente no WhatsApp.
            </p>
          </div>

          <div className="space-y-3 border-t border-border p-4">
            <div className="space-y-2">
              <Label>Tipo de chave</Label>
              <Select value={pix.keyType} onValueChange={(v: PixKeyType) => { updatePix({ keyType: v, key: "" }); setEmailError(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PIX_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix-key">Chave</Label>
              <Input
                id="pix-key"
                inputMode={pix.keyType === "email" ? "email" : pix.keyType === "aleatoria" ? "text" : "tel"}
                value={getDisplayKey(pix.keyType, pix.key)}
                onChange={(e) => { setEmailError(""); updatePix({ key: handleKeyInput(pix.keyType, e.target.value) }); }}
                onBlur={() => { if (pix.keyType === "email" && pix.key && !isValidEmail(pix.key)) setEmailError("E-mail inválido."); }}
                placeholder={PIX_TYPES.find((t) => t.value === pix.keyType)?.placeholder}
                className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {emailError && <p className="text-[11px] text-destructive">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ben">Nome do recebedor</Label>
              <Input id="ben" maxLength={25} value={pix.beneficiaryName}
                onChange={(e) => updatePix({ beneficiaryName: e.target.value })}
                placeholder="Exatamente como consta no banco" />
              <p className="text-[11px] text-muted-foreground">
                Use o nome exatamente como cadastrado no seu banco. Limite de 25 caracteres (BACEN).{" "}
                <span className="font-semibold text-foreground">{pix.beneficiaryName.length}/25</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" maxLength={15} value={pix.city}
                onChange={(e) => updatePix({ city: e.target.value })}
                placeholder="Ex.: São Paulo" />
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[11px] leading-snug text-amber-800 dark:text-amber-300">
                <span className="font-bold">Atenção:</span> a chave PIX é de sua exclusiva responsabilidade. Dados incorretos podem redirecionar pagamentos para outra pessoa.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePixSaveClick} disabled={saving || loading} variant="outline"
                className="h-11 flex-1 rounded-2xl text-sm font-semibold">
                {saving ? "Salvando..." : "Salvar dados"}
              </Button>
              {cfg.activePaymentMethod !== "pix" && pix.key && pix.beneficiaryName && pix.city && (
                <Button onClick={() => activateMethod("pix")} disabled={saving}
                  className="h-11 flex-1 rounded-2xl gradient-primary text-sm font-bold text-white shadow-glow">
                  <Check className="mr-1.5 h-4 w-4" /> Ativar PIX
                </Button>
              )}
            </div>
          </div>
        </section>
          </TabsContent>

          <TabsContent value="historico" className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold">Transações</p>
              <Button variant="outline" size="sm" onClick={syncMercadoPago} disabled={!mp.connected || syncing} className="h-9 rounded-full text-xs">
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> {syncing ? "Sincronizando" : "Sincronizar MP"}
              </Button>
            </div>
            {transactions.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-border bg-card/70 p-6 text-center">
                <History className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">Nenhuma transação ainda</p>
                <p className="mt-1 text-xs text-muted-foreground">As cobranças Pix e pagamentos do Mercado Pago aparecem aqui.</p>
              </section>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 8).map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} onMarkPaid={markPaid} />
                ))}
              </div>
            )}
            <Button asChild variant="outline" className="h-11 w-full rounded-2xl text-sm">
              <Link to="/transacoes">Ver histórico completo</Link>
            </Button>
          </TabsContent>
        </Tabs>
      </main>

      {/* Confirmação de chave Pix */}
      <AlertDialog open={pixConfirmOpen} onOpenChange={setPixConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Confirmar dados da chave Pix
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className="text-sm text-muted-foreground">
                  Verifique os dados abaixo. Pagamentos realizados pelos seus clientes serão direcionados para esta chave.
                </p>
                <div className="rounded-xl border border-border bg-secondary/50 p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Tipo</span>
                    <span className="font-semibold">{PIX_TYPES.find(t => t.value === pix.keyType)?.label}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Chave</span>
                    <span className="font-bold text-foreground break-all text-right">{getDisplayKey(pix.keyType, pix.key) || pix.key}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Recebedor</span>
                    <span className="font-semibold">{pix.beneficiaryName || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Cidade</span>
                    <span className="font-semibold">{pix.city || "—"}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-[11px] leading-snug text-amber-800 dark:text-amber-300">
                    Ao confirmar, você declara que as informações acima estão corretas e assume responsabilidade por eventuais pagamentos direcionados a esta chave.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Corrigir</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setPixConfirmOpen(false); savePix(); }}
              className="gradient-primary text-white shadow-glow"
            >
              Confirmar e salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Conexão Mercado Pago acontece via OAuth (redirect seguro) */}

      {/* QR Code fullscreen */}
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="max-w-sm p-0">
          <div className="relative p-6 pt-12">
            <button
              onClick={() => setShowQr(false)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Pagamento via Pix
            </p>
            <h3 className="mt-1 text-center font-display text-xl font-bold">
              Aponte a câmera
            </h3>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Mostre essa tela para a cliente fazer o pagamento.
            </p>

            <p className="mt-4 text-center font-display text-2xl font-bold text-gradient">
              {activeTransaction ? centsToCurrency(activeTransaction.amount_cents) : centsToCurrency(parseCurrencyToCents(amount))}
            </p>

            <div className="mx-auto mt-4 flex aspect-square w-full max-w-[280px] items-center justify-center rounded-2xl border border-border bg-card p-3">
              {qrDataUrl ? (
                <LazyImage src={qrDataUrl} alt="QR Code Pix" width={256} height={256} className="h-full w-full" />
              ) : (
                <p className="text-xs text-muted-foreground">Gerando QR Code...</p>
              )}
            </div>

            <p className="mt-3 text-center text-xs font-semibold">
              {activeTransaction?.client_name || pix.beneficiaryName || "Recebedor"}
            </p>
            <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
              {PIX_TYPES.find((t) => t.value === pix.keyType)?.label} ·{" "}
              {normalizeKey(pix.keyType, pix.key)}
            </p>

            <Button
              variant="outline"
              onClick={copyPayload}
              className="mt-4 h-11 w-full rounded-full text-sm"
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar código Pix
            </Button>
            {activeTransaction && activeTransaction.status !== "paid" && (
              <Button onClick={() => markPaid(activeTransaction)} className="mt-2 h-11 w-full rounded-full gradient-primary text-sm font-bold text-white shadow-glow">
                <Check className="mr-2 h-4 w-4" /> Marcar como recebido
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}

function TransactionRow({ tx, onMarkPaid }: { tx: PaymentTransaction; onMarkPaid: (tx: PaymentTransaction) => void }) {
  const isPaid = tx.status === "paid";
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold">{tx.client_name}</p>
          <p className="truncate text-xs text-muted-foreground">{tx.service_name || (tx.method === "mercado_pago" ? "Mercado Pago" : "Pix")}</p>
        </div>
        <Badge variant={isPaid ? "default" : "secondary"} className={isPaid ? "bg-emerald-600" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}>
          {statusLabel(tx.status)}
        </Badge>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="font-display text-lg font-bold">{centsToCurrency(tx.amount_cents)}</p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Clock className="h-3 w-3" /> {new Date(tx.created_at).toLocaleDateString("pt-BR")}
          </span>
          {!isPaid && (
            <Button size="sm" variant="outline" onClick={() => onMarkPaid(tx)} className="h-8 rounded-full text-xs">
              Recebido
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

type OAuthAttempt = {
  id: string;
  status: string;
  reason: string | null;
  created_at: string;
  completed_at: string | null;
};

const ATTEMPT_REASON_LABELS: Record<string, string> = {
  not_configured: "Credenciais OAuth não configuradas",
  invalid_state: "Sessão de autorização expirada",
  missing_params: "Resposta incompleta do Mercado Pago",
  exchange_failed: "Mercado Pago rejeitou a autorização",
  secret_save_failed: "Erro ao salvar credencial no servidor",
  settings_save_failed: "Erro ao atualizar suas preferências",
  access_denied: "Autorização cancelada pela usuária",
};

function attemptReasonLabel(reason: string | null) {
  if (!reason) return "Sem detalhes";
  return ATTEMPT_REASON_LABELS[reason] ?? reason;
}

function AccountStatusCard({
  connected,
  email,
  pixEnabled,
  lastAttempt,
}: {
  connected: boolean;
  email: string;
  pixEnabled: boolean;
  lastAttempt: OAuthAttempt | null;
}) {
  const dotColor = connected ? "bg-emerald-500" : "bg-muted-foreground/40";
  const statusLabel = connected ? "Conta ativa" : "Não conectada";
  const subtitle = connected
    ? email || "Mercado Pago autorizado via OAuth"
    : "Conecte o Mercado Pago para receber pagamentos online";

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="relative mt-1 flex h-3 w-3 shrink-0">
          {connected && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          )}
          <span className={`relative inline-flex h-3 w-3 rounded-full ${dotColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Status da conta
          </p>
          <p className="font-display text-lg font-bold leading-tight">{statusLabel}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatusChip
          ok={connected}
          okLabel="Mercado Pago"
          offLabel="Mercado Pago"
        />
        <StatusChip
          ok={pixEnabled}
          okLabel="Pix pessoal"
          offLabel="Pix pessoal"
        />
      </div>

      {lastAttempt && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary/60 p-3 text-[11px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <p className="truncate">
            Última tentativa:{" "}
            <span className="font-semibold text-foreground">
              {new Date(lastAttempt.created_at).toLocaleString("pt-BR")}
            </span>{" "}
            ·{" "}
            {lastAttempt.status === "success"
              ? "sucesso"
              : lastAttempt.status === "failed"
                ? attemptReasonLabel(lastAttempt.reason)
                : "iniciada"}
          </p>
        </div>
      )}
    </section>
  );
}

function StatusChip({
  ok,
  okLabel,
  offLabel,
}: {
  ok: boolean;
  okLabel: string;
  offLabel: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
        ok ? "border-emerald-200 bg-emerald-50" : "border-border bg-secondary/40"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0">
        <p
          className={`truncate text-[11px] font-bold ${
            ok ? "text-emerald-800" : "text-foreground"
          }`}
        >
          {ok ? okLabel : offLabel}
        </p>
        <p
          className={`truncate text-[10px] ${
            ok ? "text-emerald-700" : "text-muted-foreground"
          }`}
        >
          {ok ? "Ativo" : "Inativo"}
        </p>
      </div>
    </div>
  );
}

function AttemptsLog({ attempts }: { attempts: OAuthAttempt[] }) {
  if (attempts.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          <History className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold">Tentativas de conexão</p>
          <p className="text-[11px] text-muted-foreground">
            Registro das últimas autorizações OAuth (até 5).
          </p>
        </div>
      </div>
      <ul className="divide-y divide-border border-t border-border">
        {attempts.map((a) => {
          const isSuccess = a.status === "success";
          const isFailed = a.status === "failed";
          const Icon = isSuccess ? CheckCircle2 : isFailed ? XCircle : Clock;
          const iconColor = isSuccess
            ? "text-emerald-600"
            : isFailed
              ? "text-rose-600"
              : "text-amber-600";
          return (
            <li key={a.id} className="flex items-start gap-3 px-4 py-3">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {isSuccess
                    ? "Conexão autorizada"
                    : isFailed
                      ? attemptReasonLabel(a.reason)
                      : "Autorização em andamento"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
