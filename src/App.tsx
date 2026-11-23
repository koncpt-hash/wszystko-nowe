import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, configured } from "./supabase";
import Login from "./Login";
import Places from "./Places";
import Import from "./Import";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<"places" | "import">("places");

  useEffect(() => {
    if (!configured) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!configured) {
    return (
      <main className="wrap">
        <h1>Wszystko nowe</h1>
        <p className="muted">Brakuje kluczy Supabase. Uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY (instrukcja w docs/SETUP.md).</p>
      </main>
    );
  }
  if (!ready) return <main className="wrap"><p className="muted">Ładuję…</p></main>;
  if (!session) return <Login />;

  return (
    <main className="wrap">
      <header className="top">
        <h1>Wszystko nowe</h1>
        <nav className="tabs">
          <button aria-pressed={view === "places"} onClick={() => setView("places")}>Rejestr</button>
          <button aria-pressed={view === "import"} onClick={() => setView("import")}>Import danych</button>
          <button onClick={() => supabase.auth.signOut()}>Wyloguj</button>
        </nav>
      </header>
      {view === "places" ? <Places /> : <Import />}
      <p className="muted small">Wersja robocza: wygląd powstanie z projektu w Figmie.</p>
    </main>
  );
}
