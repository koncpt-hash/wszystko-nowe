import { createClient } from "@supabase/supabase-js";

const env = import.meta.env as Record<string, string | undefined>;
// Działa zarówno z ręcznie dodanymi zmiennymi VITE_, jak i z integracją Vercel ↔ Supabase (NEXT_PUBLIC_).
const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const configured = Boolean(url && key);

export const supabase = createClient(url || "http://localhost", key || "missing", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type Place = {
  id: string;
  name: string;
  city: string | null;
  region: "waw" | "pl";
  cat: string;
  status: "open" | "build" | "plan";
  date: string | null;
  sort: string | null;
  lat: number;
  lng: number;
  approx: boolean;
  note: string | null;
  src: string | null;
  build: "new" | "adapted" | "unknown" | null;
  shot: boolean;
  updated: string | null;
};

export type Route = {
  id: string;
  name: string;
  via: string | null;
  order: number;
  points: string;
};
