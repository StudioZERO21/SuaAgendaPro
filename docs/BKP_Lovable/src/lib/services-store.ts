import { useSyncExternalStore } from "react";
import { services as seed, type Service, type ServiceCategory } from "./mock-data";

export const serviceCategories: { id: ServiceCategory; label: string; emoji: string }[] = [
  { id: "lash", label: "Lash & Cílios", emoji: "👁️" },
  { id: "brow", label: "Sobrancelhas", emoji: "✏️" },
  { id: "nail", label: "Unhas", emoji: "💅" },
  { id: "skin", label: "Estética facial", emoji: "🌸" },
  { id: "hair", label: "Cabelo", emoji: "💇‍♀️" },
  { id: "makeup", label: "Maquiagem", emoji: "💄" },
  { id: "depil", label: "Depilação", emoji: "🪒" },
  { id: "other", label: "Outro", emoji: "✨" },
];

let state: Service[] = [...seed];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const servicesStore = {
  get(): Service[] {
    return state;
  },
  getById(id: string): Service | undefined {
    return state.find((s) => s.id === id);
  },
  create(input: Omit<Service, "id">): Service {
    const item: Service = { ...input, id: `s${Date.now()}` };
    state = [item, ...state];
    emit();
    return item;
  },
  update(id: string, patch: Partial<Omit<Service, "id">>) {
    state = state.map((s) => (s.id === id ? { ...s, ...patch } : s));
    emit();
  },
  remove(id: string) {
    state = state.filter((s) => s.id !== id);
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useServices(): Service[] {
  return useSyncExternalStore(
    servicesStore.subscribe,
    servicesStore.get,
    servicesStore.get,
  );
}

export function categoryMeta(id: ServiceCategory) {
  return serviceCategories.find((c) => c.id === id) ?? serviceCategories[serviceCategories.length - 1];
}
