import { categoryMeta } from "@/lib/services-store";
import type { ServiceCategory } from "@/lib/mock-data";
import type { PublicData } from "@/lib/public-booking.functions";
import {
  DOW_TO_PT,
  type PublicPageModel,
  type PublicReview,
  type PublicService,
} from "@/lib/public-page-types";

/**
 * Normaliza os dados do Supabase para os layouts da página pública.
 *
 * @param loaderData - Payload retornado por `getPublicProfile`.
 * @returns Modelo pronto para renderização (clássico, Stenz, etc.).
 */
export function buildPublicPageModel(loaderData: PublicData): PublicPageModel {
  const p = loaderData.profile;
  const nameParts = p.display_name.trim().split(/\s+/).filter(Boolean);
  const initials =
    nameParts.length === 0
      ? "?"
      : nameParts.length === 1
        ? nameParts[0][0].toUpperCase()
        : (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();

  const themeColor = p.theme_color || "#ec4899";
  const coverGradient = `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}cc 60%, ${themeColor}88 100%)`;
  const cityState = [p.city, p.state].filter(Boolean).join(", ");

  const streetLine = [p.street, p.street_number].filter(Boolean).join(", ");
  const fullAddress = [streetLine, p.neighborhood, cityState]
    .filter(Boolean)
    .join(" — ");
  const mapQuery = encodeURIComponent(fullAddress || cityState);

  type SocialLinkEntry = { network: string; handle: string };
  const socialLinks = (
    Array.isArray(p.social_links) ? (p.social_links as SocialLinkEntry[]) : []
  ).filter((l) => l.handle?.trim());

  const hours = DOW_TO_PT.map((day, i) => {
    const wh = loaderData.workingHours.find((h) => h.day_of_week === i);
    if (!wh || !wh.is_open || !wh.start_time || !wh.end_time) {
      return { day, open: "", close: "", closed: true as const };
    }
    return {
      day,
      open: wh.start_time.slice(0, 5),
      close: wh.end_time.slice(0, 5),
    };
  });

  const mappedServices: PublicService[] = loaderData.services.map((s) => {
    const dbCat = (s.category as ServiceCategory) || "other";
    const catMeta = categoryMeta(dbCat);
    const categoryLabel =
      dbCat === "other" && s.category_label ? s.category_label : catMeta.label;
    return {
      id: s.id,
      name: s.name,
      duration: s.duration_minutes,
      price: s.price_cents / 100,
      price_cents: s.price_cents,
      category: dbCat,
      categoryLabel,
      imageUrl: s.image_url || null,
      description: s.description ?? undefined,
    };
  });

  const mappedPortfolio = loaderData.portfolio.map((item) => ({
    id: item.id,
    src: item.image_url,
    title: item.title ?? "",
    category: "Geral",
    description: item.description ?? "",
  }));

  const mappedReviews: PublicReview[] = loaderData.reviews.map((r) => ({
    id: r.id,
    name: r.is_anonymous ? "Anônimo" : r.client_name,
    avatarUrl: r.is_anonymous ? null : (r.client_avatar_url ?? null),
    isAnonymous: r.is_anonymous,
    rating: r.rating,
    text: r.message,
    date: new Date(r.created_at).toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    }),
  }));

  const avgRating =
    loaderData.reviewAvgRating > 0 ? loaderData.reviewAvgRating : 5.0;

  return {
    profile: {
      id: p.id,
      slug: p.slug,
      name: p.display_name || "Profissional",
      tagline: p.specialty || p.bio?.slice(0, 80) || "",
      bio: p.bio || "",
      city: cityState,
      address: cityState,
      streetLine,
      neighborhood: p.neighborhood || "",
      fullAddress,
      mapQuery,
      phone: p.phone || "",
      socialLinks,
      instagram: "",
      rating: avgRating,
      reviewsCount: loaderData.reviewTotalCount,
      themeColor,
      gradientColor2: p.gradient_color_2 || "",
      coverGradient,
      initials,
      avatar: p.avatar_url
        ? { url: p.avatar_url, alt: p.display_name }
        : undefined,
      bannerUrl: p.banner_url || "",
      logoUrl: p.cover_url || "",
      businessName: p.specialty || p.display_name || "",
      hours,
      services: mappedServices,
      highlights: [],
      show_prices: p.show_prices,
      accept_online: p.accept_online,
      pix: loaderData.pix,
      mpConnected: loaderData.mpConnected,
    },
    services: mappedServices,
    portfolio: mappedPortfolio,
    reviews: mappedReviews,
  };
}
