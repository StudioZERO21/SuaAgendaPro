import type { ServiceCategory } from "@/lib/mock-data";
import type { PublicPixSettings } from "@/lib/public-booking.functions";

/** Serviço exibido na página pública de agendamento. */
export type PublicService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  price_cents: number;
  category: ServiceCategory;
  categoryLabel: string;
  imageUrl: string | null;
  description?: string;
};

export type PublicReview = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isAnonymous: boolean;
  rating: number;
  text: string;
  date: string;
};

export type PortfolioItem = {
  id: string;
  src: string;
  title: string;
  category: string;
  description: string;
};

export type PublicPageProfile = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  city: string;
  address: string;
  streetLine: string;
  neighborhood: string;
  fullAddress: string;
  mapQuery: string;
  phone: string;
  socialLinks: { network: string; handle: string }[];
  instagram: string;
  rating: number;
  reviewsCount: number;
  themeColor: string;
  gradientColor2: string;
  coverGradient: string;
  initials: string;
  avatar?: { url: string; alt: string };
  bannerUrl: string;
  logoUrl: string;
  businessName: string;
  hours: { day: string; open: string; close: string; closed?: boolean }[];
  services: PublicService[];
  highlights: string[];
  show_prices: boolean;
  accept_online: boolean;
  pix: PublicPixSettings;
  mpConnected: boolean;
  templateId: string;
  customColors: Record<string, string> | null;
};

export type PublicPageModel = {
  profile: PublicPageProfile;
  services: PublicService[];
  portfolio: PortfolioItem[];
  reviews: PublicReview[];
};

export const DOW_TO_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

/** Formata valor em reais (BRL). */
export function formatPublicPrice(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

/** Indica se o estabelecimento está aberto agora. */
export function getPublicOpenStatus(
  hours: { day: string; open: string; close: string; closed?: boolean }[],
) {
  const WEEKDAY_PT = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  const now = new Date();
  const today = WEEKDAY_PT[now.getDay()];
  const slot = hours.find((h) => h.day === today);
  if (!slot || slot.closed || !slot.open || !slot.close) {
    return { open: false, label: "Fechado agora", today: slot };
  }
  const [oh, om] = slot.open.split(":").map(Number);
  const [ch, cm] = slot.close.split(":").map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const o = oh * 60 + om;
  const c = ch * 60 + cm;
  const open = cur >= o && cur < c;
  return {
    open,
    label: open
      ? `Aberto até ${slot.close}`
      : `Fechado · abre ${slot.open}`,
    today: slot,
  };
}
