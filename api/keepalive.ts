// Codzienny automat: jedno drobne zapytanie do bazy, żeby darmowy projekt Supabase
// nie został wstrzymany za brak aktywności. Uruchamiany przez Vercel Cron (vercel.json).

export default async function handler(req: any, res: any) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers?.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false });
  }
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return res.status(500).json({ ok: false, error: "missing env" });

  const r = await fetch(`${url}/rest/v1/heartbeat?id=eq.1`, {
    method: "PATCH",
    headers: {
      apikey: key,
      // Nowe klucze sb_secret_ nie są tokenami JWT: wysyłamy je tylko w nagłówku apikey.
      ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ last_at: new Date().toISOString() }),
  });
  return res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status });
}
