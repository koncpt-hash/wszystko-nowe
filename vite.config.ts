import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Zmienne z integracji Vercel ↔ Supabase mają prefiks NEXT_PUBLIC_, ręczne VITE_
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
});
