// ETAPA 4 — Serviço Asaas
// Cliente HTTP para a API do Asaas (PIX + cartão, sem boleto)

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
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Asaas ${method} ${path} → ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// TODO (Etapa 4) — implementar:

export type AsaasCustomer = {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  mobilePhone?: string;
};

export async function createAsaasCustomer(params: {
  name: string;
  email: string;
  cpfCnpj?: string;
  mobilePhone?: string;
}): Promise<AsaasCustomer> {
  // TODO: POST /customers
  throw new Error("Etapa 4 — não implementado");
}

export type AsaasSubscription = {
  id: string;
  status: string;
  value: number;
  nextDueDate: string;
};

export async function createAsaasSubscription(params: {
  customerId: string;
  value: number;
  billingType: "PIX" | "CREDIT_CARD";
  nextDueDate: string;      // YYYY-MM-DD
  description?: string;
}): Promise<AsaasSubscription> {
  // TODO: POST /subscriptions
  throw new Error("Etapa 4 — não implementado");
}

export type AsaasPaymentLink = {
  invoiceUrl: string;
  bankSlipUrl: string | null;
  pixQrCode: string | null;
};

export async function getPaymentLink(subscriptionId: string): Promise<AsaasPaymentLink> {
  // TODO: GET /subscriptions/:id/payments → pegar última fatura pendente
  throw new Error("Etapa 4 — não implementado");
}

export async function cancelAsaasSubscription(subscriptionId: string): Promise<void> {
  // TODO: DELETE /subscriptions/:id
  throw new Error("Etapa 4 — não implementado");
}
