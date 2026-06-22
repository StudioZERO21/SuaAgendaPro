import { useSyncExternalStore } from "react";
import { publicProfiles, type PublicProfile, type PublicReview } from "./public-profiles";

let profiles: PublicProfile[] = publicProfiles.map((p) => ({
  ...p,
  gallery: [...p.gallery],
  highlights: [...p.highlights],
  reviews: [...p.reviews],
  services: [...p.services],
  hours: [...p.hours],
}));
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const GALLERY_GRADIENTS = [
  "linear-gradient(135deg,#fb7185,#f472b6)",
  "linear-gradient(135deg,#f472b6,#e879f9)",
  "linear-gradient(135deg,#fda4af,#fb7185)",
  "linear-gradient(135deg,#f9a8d4,#f472b6)",
  "linear-gradient(135deg,#fbcfe8,#f9a8d4)",
  "linear-gradient(135deg,#e879f9,#c084fc)",
  "linear-gradient(135deg,#fcd34d,#fb7185)",
  "linear-gradient(135deg,#a5f3fc,#f472b6)",
];

export const profileStore = {
  get(): PublicProfile[] {
    return profiles;
  },
  getBySlug(slug: string): PublicProfile | undefined {
    return profiles.find((p) => p.slug === slug);
  },
  update(slug: string, patch: Partial<PublicProfile>) {
    profiles = profiles.map((p) => (p.slug === slug ? { ...p, ...patch } : p));
    emit();
  },
  addGalleryItem(slug: string, item: { gradient: string; emoji: string }) {
    const p = profiles.find((x) => x.slug === slug);
    if (!p) return;
    this.update(slug, {
      gallery: [...p.gallery, { id: `g${Date.now()}`, ...item }],
    });
  },
  removeGalleryItem(slug: string, id: string) {
    const p = profiles.find((x) => x.slug === slug);
    if (!p) return;
    this.update(slug, { gallery: p.gallery.filter((g) => g.id !== id) });
  },
  upsertReview(slug: string, review: PublicReview) {
    const p = profiles.find((x) => x.slug === slug);
    if (!p) return;
    const exists = p.reviews.some((r) => r.id === review.id);
    const next = exists
      ? p.reviews.map((r) => (r.id === review.id ? review : r))
      : [review, ...p.reviews];
    this.update(slug, { reviews: next });
  },
  removeReview(slug: string, id: string) {
    const p = profiles.find((x) => x.slug === slug);
    if (!p) return;
    this.update(slug, { reviews: p.reviews.filter((r) => r.id !== id) });
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useProfile(slug: string): PublicProfile | undefined {
  const get = () => profileStore.getBySlug(slug);
  return useSyncExternalStore(profileStore.subscribe, get, get);
}

export const ACTIVE_PROFILE_SLUG = "bia-lash";
