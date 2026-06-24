// Asaas HTTP client — PIX + cartão, sem boleto
// Documentação: https://docs.asaas.com/reference

const ASAAS_BASE = {
  sandbox:    "https://sandbox.asaas.com/api/v3",
  production: "https://api.asaas.com/api/v3",
} as const;

function getBase(): string {
  const env = process.env.ASAAS_ENV ?? "sandbox";
  return ASAAS_BASE[env as keyof typeof ASAAS_BASE] ?? ASAAS_BASE.sandbox;
}

async function asaasRequest<T>(
  method: "GET" | "POST" | "DELETE" | "PUT",
  path: string,
  body?: unknown,
): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurada");

  const res = await fetch(`${getBase()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "access_token": apiKey,
      "User-Agent": "suaAgendaPro/1.0",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asaas ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type AsaasCustomer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
};

export type AsaasBillingType = "PIX" | "CREDIT_CARD" | "UNDEFINED";
export type AsaasSubscriptionCycle = "MONTHLY" | "YEARLY";
export type AsaasSubscriptionStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

export type AsaasSubscription = {
  id: string;
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  cycle: AsaasSubscriptionCycle;
  nextDueDate: string;
  status: AsaasSubscriptionStatus;
  description?: string;
};

export type AsaasPayment = {
  id: string;
  subscription: string;
  status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "REFUNDED";
  value: number;
  netValue: number;
  billingType: string;
  invoiceUrl: string;
  bankSlipUrl: string | null;
  pixQrCodeImage: string | null;
  pixCopiaECola: string | null;
  dueDate: string;
};

export type AsaasListResponse<T> = {
  data: T[];
  totalCount: number;
  hasMore: boolean;
};

// ─── Customer ────────────────────────────────────────────────────────────────

export async function createAsaasCustomer(params: {
  name: string;
  email: string;
  cpfCnpj?: string;
  mobilePhone?: string;
}): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>("POST", "/customers", {
    name: params.name,
    email: params.email,
    ...(params.cpfCnpj    && { cpfCnpj:     params.cpfCnpj }),
    ...(params.mobilePhone && { mobilePhone: sanitizePhone(params.mobilePhone) }),
    notificationDisabled: false,
  });
}

export async function findAsaasCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
  const res = await asaasRequest<AsaasListResponse<AsaasCustomer>>(
    "GET",
    `/customers?email=${encodeURIComponent(email)}&limit=1`,
  );
  return res.data[0] ?? null;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export async function createAsaasSubscription(params: {
  customerId: string;
  value: number;
  billingType?: AsaasBillingType;
  nextDueDate: string;  // YYYY-MM-DD
  cycle?: AsaasSubscriptionCycle;
  description?: string;
}): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>("POST", "/subscriptions", {
    customer:    params.customerId,
    billingType: params.billingType ?? "UNDEFINED",
    value:       params.value,
    nextDueDate: params.nextDueDate,
    cycle:       params.cycle ?? "MONTHLY",
    description: params.description ?? "suaAgendaPro Premium",
  });
}

export async function getAsaasSubscription(id: string): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>("GET", `/subscriptions/${id}`);
}

export async function cancelAsaasSubscription(id: string): Promise<void> {
  await asaasRequest<unknown>("DELETE", `/subscriptions/${id}`);
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function getSubscriptionPayments(
  subscriptionId: string,
  status?: "PENDING" | "OVERDUE",
): Promise<AsaasPayment[]> {
  const qs = status ? `&status=${status}` : "";
  const res = await asaasRequest<AsaasListResponse<AsaasPayment>>(
    "GET",
    `/subscriptions/${subscriptionId}/payments?limit=5${qs}`,
  );
  return res.data;
}

export async function getFirstPendingPayment(subscriptionId: string): Promise<AsaasPayment | null> {
  const payments = await getSubscriptionPayments(subscriptionId, "PENDING");
  return payments[0] ?? null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
