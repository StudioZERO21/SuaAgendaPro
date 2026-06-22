import biaAvatarUrl from "@/assets/bia-avatar-384.webp";
import type { ServiceCategory } from "./mock-data";

export type PublicReview = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  text: string;
  date: string;
};

export type PublicService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: ServiceCategory;
  description?: string;
};

export type PublicProfile = {
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  city: string;
  address: string;
  phone: string;
  instagram: string;
  rating: number;
  reviewsCount: number;
  coverGradient: string;
  initials: string;
  avatar?: { url: string; alt?: string };
  gallery: { id: string; gradient: string; emoji: string }[];
  services: PublicService[];
  hours: { day: string; open: string; close: string; closed?: boolean }[];
  reviews: PublicReview[];
  highlights: string[];
};

export const publicProfiles: PublicProfile[] = [
  {
    slug: "bia-lash",
    name: "Bia Mendes",
    tagline: "Lash Designer · Estúdio Rosé",
    bio:
      "Especialista em volume brasileiro e lash lifting há 6 anos. Atendimento personalizado, com produtos hipoalergênicos e ambiente acolhedor pra você relaxar enquanto eu cuido de você 💕",
    city: "São Paulo, SP",
    address: "Rua das Camélias, 120 · Vila Madalena",
    phone: "+55 11 99999-1234",
    instagram: "@bia.lash.studio",
    rating: 4.9,
    reviewsCount: 287,
    coverGradient: "linear-gradient(135deg,#ff6fae 0%,#ff9ec7 45%,#ffd0e3 100%)",
    initials: "BM",
    avatar: { url: biaAvatarUrl, alt: "Bia Mendes — Lash Designer" },
    highlights: [
      "+1.200 clientes atendidas",
      "Produtos premium importados",
      "Ambiente climatizado e aconchegante",
    ],
    gallery: [
      { id: "g1", gradient: "linear-gradient(135deg,#fb7185,#f472b6)", emoji: "👁️" },
      { id: "g2", gradient: "linear-gradient(135deg,#f472b6,#e879f9)", emoji: "✨" },
      { id: "g3", gradient: "linear-gradient(135deg,#fda4af,#fb7185)", emoji: "💖" },
      { id: "g4", gradient: "linear-gradient(135deg,#f9a8d4,#f472b6)", emoji: "🌸" },
      { id: "g5", gradient: "linear-gradient(135deg,#fbcfe8,#f9a8d4)", emoji: "💅" },
      { id: "g6", gradient: "linear-gradient(135deg,#e879f9,#c084fc)", emoji: "👑" },
    ],
    services: [
      { id: "ps1", name: "Volume Brasileiro", duration: 90, price: 180, category: "lash", description: "Aplicação fio a fio com fios premium." },
      { id: "ps2", name: "Lash Lifting + Tintura", duration: 60, price: 130, category: "lash", description: "Curvatura natural com efeito de até 8 semanas." },
      { id: "ps3", name: "Volume Russo", duration: 120, price: 220, category: "lash", description: "Múltiplos fios por extensão, efeito glamour." },
      { id: "ps4", name: "Design de Sobrancelhas", duration: 45, price: 80, category: "brow", description: "Mapeamento, finalização e henna inclusa." },
      { id: "ps5", name: "Manutenção Lash", duration: 60, price: 110, category: "lash", description: "Reposição de fios em até 3 semanas." },
    ],
    hours: [
      { day: "Segunda", open: "09:00", close: "19:00" },
      { day: "Terça", open: "09:00", close: "19:00" },
      { day: "Quarta", open: "09:00", close: "19:00" },
      { day: "Quinta", open: "09:00", close: "20:00" },
      { day: "Sexta", open: "09:00", close: "20:00" },
      { day: "Sábado", open: "09:00", close: "16:00" },
      { day: "Domingo", open: "", close: "", closed: true },
    ],
    reviews: [
      { id: "r1", name: "Júlia Mendes", initials: "JM", rating: 5, date: "há 2 dias", text: "Simplesmente perfeita! Os cílios ficaram dos sonhos e o atendimento é impecável. Já marquei a manutenção 💕" },
      { id: "r2", name: "Carolina Silva", initials: "CS", rating: 5, date: "há 1 semana", text: "Ambiente lindo, super limpo. A Bia é atenciosa demais, explica tudo. Recomendo de olhos fechados!" },
      { id: "r3", name: "Marina Souza", initials: "MS", rating: 5, date: "há 2 semanas", text: "Já sou cliente há mais de 1 ano. Nunca me decepcionou. Vale cada centavo ✨" },
    ],
  },
];

export function getProfileBySlug(slug: string) {
  return publicProfiles.find((p) => p.slug === slug);
}
