import { useState, type ChangeEvent } from "react";
import { supabase } from "./supabase";

// Przyjmuje plik JSON z przycisku „Eksportuj bazę” w obecnym atlasie na claude.ai:
// { places: [{ id, name, … }], routes: [{ id, name, via, order, points }] }

const PLACE_FIELDS = ["id", "name", "city", "region", "cat", "status", "date", "sort", "lat", "lng", "approx", "note", "src", "build", "shot", "updated"] as const;
const ROUTE_FIELDS = ["id", "name", "via", "order", "points"] as const;

function pick<T extends readonly string[]>(o: Record<string, unknown>, keys: T) {
  const out: Record<string, unknown> = {};
  keys.forEach((k) => { if (o[k] !== undefined) out[k] = o[k]; });
  return out;
}

export default function Import() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const add = (s: string) => setLog((l) => [...l, s]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setLog([]);
    try {
      const json = JSON.parse(await file.text());
      const places = (json.places || []).filter((p: any) => p && p.id && p.name && typeof p.lat === "number").map((p: any) => pick(p, PLACE_FIELDS));
      const routes = (json.routes || []).filter((r: any) => r && r.id && r.points).map((r: any) => pick(r, ROUTE_FIELDS));
      add(`W pliku: ${places.length} miejsc, ${routes.length} tras.`);
      for (let i = 0; i < places.length; i += 200) {
        const { error } = await supabase.from("places").upsert(places.slice(i, i + 200), { onConflict: "id" });
        if (error) throw error;
      }
      add(`Zapisano miejsca: ${places.length}.`);
      if (routes.length) {
        const { error } = await supabase.from("routes").upsert(routes, { onConflict: "id" });
        if (error) throw error;
        add(`Zapisano trasy: ${routes.length}.`);
      }
      add("Gotowe. Import można powtórzyć: istniejące wpisy zostaną zaktualizowane, nic się nie zdubluje.");
    } catch (err: any) {
      add(`Błąd: ${err?.message || err}`);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <section className="stack">
      <h2>Import danych z obecnego atlasu</h2>
      <p className="muted">W atlasie na claude.ai kliknij „Eksportuj bazę (JSON)”, zapisz plik i wybierz go tutaj.</p>
      <input type="file" accept="application/json,.json" onChange={onFile} disabled={busy} />
      {log.length > 0 && <ul className="log">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
    </section>
  );
}
