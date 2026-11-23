import { useEffect, useMemo, useState } from "react";
import { supabase, type Place } from "./supabase";

const ST: Record<string, string> = { open: "otwarte", build: "w budowie", plan: "zapowiedziane" };

export default function Places() {
  const [items, setItems] = useState<Place[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data, error } = await supabase.from("places").select("*").order("sort", { ascending: false });
      if (!alive) return;
      if (error) setError(error.message); else setItems(data as Place[]);
    }
    load();
    const ch = supabase
      .channel("places")
      .on("postgres_changes", { event: "*", schema: "public", table: "places" }, load)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (items || []).forEach((i) => { c[i.cat] = (c[i.cat] || 0) + 1; });
    return Object.entries(c).sort((a, b) => a[0].localeCompare(b[0], "pl"));
  }, [items]);

  if (error) return <p className="err">Nie udało się wczytać bazy: {error}. Sprawdź, czy Twój e-mail jest w tabeli allowed_users.</p>;
  if (!items) return <p className="muted">Ładuję rejestr…</p>;
  if (!items.length) return <p className="muted">Baza jest pusta. Zaimportuj dane z obecnego atlasu w zakładce „Import danych”.</p>;

  return (
    <section>
      <p className="muted">{items.length} miejsc · {items.filter((i) => i.shot).length} sfotografowanych</p>
      <p className="muted small">{counts.map(([k, n]) => `${k} (${n})`).join(" · ")}</p>
      <ul className="list">
        {items.map((i) => (
          <li key={i.id} className="card">
            <span className={`pill ${i.status}`}>{ST[i.status] || i.status}</span>
            <h3>{i.name}</h3>
            <div className="muted small">{i.city}{i.approx ? " · lokalizacja przybliżona" : ""}</div>
            <div className="small">{i.date}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
