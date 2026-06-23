// PIX BR Code (EMV) builder — gera o "copia e cola" e o payload para QR Code
// estático. Sem dependências externas e funciona offline.
// Spec: BCB EMV QR Code para Pix.

function tlv(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

// CRC16-CCITT (poly 0x1021, init 0xFFFF) — exigido pelo padrão.
function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(s: string, max: number) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, max);
}

export function normalizePixKey(type: string, value: string): string {
  const digits = value.replace(/\D/g, "");
  if (type === "cpf" || type === "cnpj") return digits;
  if (type === "telefone") {
    if (!digits) return "";
    return digits.length <= 11 ? `+55${digits}` : `+${digits}`;
  }
  return value.trim();
}

export type PixInput = {
  key: string; // chave Pix (CPF, e-mail, telefone, aleatória)
  name: string; // nome do recebedor
  city: string; // cidade do recebedor
  amount?: number; // opcional, em reais
  description?: string; // opcional
  txid?: string; // identificador (até 25 chars alfanuméricos)
};

export function buildPixPayload(input: PixInput): string {
  const name = sanitize(input.name || "RECEBEDOR", 25);
  const city = sanitize(input.city || "BRASIL", 15);
  const txid = sanitize(input.txid || "***", 25) || "***";

  // Merchant Account Information (ID 26) — Pix
  const mai =
    tlv("00", "br.gov.bcb.pix") +
    tlv("01", input.key) +
    (input.description ? tlv("02", sanitize(input.description, 50)) : "");

  const additional = tlv("05", txid);

  const parts = [
    tlv("00", "01"), // Payload Format Indicator
    tlv("01", "11"), // Point of Initiation Method (estático)
    tlv("26", mai),
    tlv("52", "0000"), // Merchant Category Code
    tlv("53", "986"), // Transaction Currency (BRL)
    ...(input.amount && input.amount > 0
      ? [tlv("54", input.amount.toFixed(2))]
      : []),
    tlv("58", "BR"),
    tlv("59", name),
    tlv("60", city),
    tlv("62", additional),
  ].join("");

  const toCrc = parts + "6304";
  return toCrc + crc16(toCrc);
}
