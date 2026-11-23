import { useState, type FormEvent } from "react";
import { supabase } from "./supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) { setError(error.message); setState("error"); } else setState("sent");
  }

  return (
    <main className="wrap narrow">
      <h1>Wszystko nowe</h1>
      {state === "sent" ? (
        <p>Wysłaliśmy link logowania na <b>{email}</b>. Otwórz go na tym urządzeniu.</p>
      ) : (
        <form onSubmit={submit} className="stack">
          <label htmlFor="email">Adres e-mail</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Wysyłam…" : "Wyślij link logowania"}</button>
          {state === "error" && <p className="err">Nie udało się wysłać linku: {error}</p>}
        </form>
      )}
    </main>
  );
}
