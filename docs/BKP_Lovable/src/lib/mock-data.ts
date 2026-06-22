export type Status = "pendente" | "confirmado" | "concluido" | "cancelado";

export type Professional = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
};

export type ServiceCategory = "lash" | "nail" | "skin" | "brow" | "hair" | "makeup" | "depil" | "other";

export type Service = {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  category: ServiceCategory;
  description?: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  initials: string;
  color: string;
};

export type Appointment = {
  id: string;
  clientId: string;
  serviceId: string;
  professionalId: string;
  date: string; // "YYYY-MM-DD"
  start: string; // "HH:mm"
  end: string;
  status: Status;
};

export const professionals: Professional[] = [
  { id: "p1", name: "Kimberly", role: "Lash Designer", initials: "K", color: "#ec4899" },
  { id: "p2", name: "Bruna Mendes", role: "Nail Designer", initials: "B", color: "#d946ef" },
  { id: "p3", name: "Laura Cardoso", role: "Micropigmentação", initials: "L", color: "#a855f7" },
];

export const services: Service[] = [
  { id: "s1", name: "Volume Brasileiro", duration: 60, price: 120, category: "lash" },
  { id: "s2", name: "Lash Lifting", duration: 60, price: 95, category: "lash" },
  { id: "s3", name: "Design de Sobrancelhas", duration: 45, price: 60, category: "brow" },
  { id: "s4", name: "Pigmentação Labial", duration: 90, price: 160, category: "skin" },
  { id: "s5", name: "Manicure", duration: 60, price: 50, category: "nail" },
];

export const clients: Client[] = [
  { id: "c1", name: "Carol", phone: "+55 11 99999-0001", initials: "C", color: "#f472b6" },
  { id: "c2", name: "Isis", phone: "+55 11 99999-0002", initials: "I", color: "#ec4899" },
  { id: "c3", name: "Mariana Sousa", phone: "+55 11 99999-0003", initials: "M", color: "#d946ef" },
  { id: "c4", name: "Juliana Martins", phone: "+55 11 99999-0004", initials: "J", color: "#a855f7" },
  { id: "c5", name: "Ana Paula", phone: "+55 11 99999-0005", initials: "A", color: "#f9a8d4" },
];

const today = new Date();
const y = today.getFullYear();
const m = String(today.getMonth() + 1).padStart(2, "0");
const d = String(today.getDate()).padStart(2, "0");
const todayStr = `${y}-${m}-${d}`;

// Day 27 (6 days ahead)
const day27 = new Date(today);
day27.setDate(today.getDate() + 6);
const y27 = day27.getFullYear();
const m27 = String(day27.getMonth() + 1).padStart(2, "0");
const d27 = String(day27.getDate()).padStart(2, "0");
const day27Str = `${y27}-${m27}-${d27}`;

export const appointments: Appointment[] = [
  // Today
  { id: "a1", clientId: "c1", serviceId: "s1", professionalId: "p1", date: todayStr, start: "09:00", end: "10:00", status: "confirmado" },
  { id: "a2", clientId: "c2", serviceId: "s1", professionalId: "p1", date: todayStr, start: "10:50", end: "11:50", status: "confirmado" },
  { id: "a3", clientId: "c3", serviceId: "s2", professionalId: "p1", date: todayStr, start: "13:00", end: "14:00", status: "pendente" },
  { id: "a4", clientId: "c4", serviceId: "s3", professionalId: "p1", date: todayStr, start: "14:30", end: "15:15", status: "confirmado" },
  { id: "a5", clientId: "c5", serviceId: "s4", professionalId: "p1", date: todayStr, start: "16:00", end: "17:30", status: "concluido" },
  // Day 27 — 3 confirmados, 1 pendente, 1 cancelado
  { id: "a6", clientId: "c1", serviceId: "s1", professionalId: "p1", date: day27Str, start: "09:00", end: "10:00", status: "confirmado" },
  { id: "a7", clientId: "c2", serviceId: "s2", professionalId: "p1", date: day27Str, start: "10:00", end: "11:00", status: "confirmado" },
  { id: "a8", clientId: "c3", serviceId: "s3", professionalId: "p1", date: day27Str, start: "11:00", end: "11:45", status: "confirmado" },
  { id: "a9", clientId: "c4", serviceId: "s5", professionalId: "p2", date: day27Str, start: "14:00", end: "15:00", status: "pendente" },
  { id: "a10", clientId: "c5", serviceId: "s4", professionalId: "p2", date: day27Str, start: "15:00", end: "16:30", status: "cancelado" },
];

export const weekdayLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
