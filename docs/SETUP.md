# Uruchomienie: krok po kroku

Kolejność ma znaczenie. Klucze wklejasz tylko w panelach Supabase, Vercela i GitHuba, nigdy w czacie.

## 1. Supabase: baza

1. Wejdź na supabase.com → **New project**. Nazwa: `wszystko-nowe`, region: **Central EU (Frankfurt)**. Zapisz hasło bazy w menedżerze haseł.
2. Gdy projekt się utworzy: **SQL Editor → New query**.
3. Wklej całą zawartość pliku `supabase/schema.sql` z tego repozytorium.
4. Na samym dole odkomentuj ostatnią linię i wpisz swój e-mail, np.:
   `insert into public.allowed_users (email) values ('twoj@adres.pl');`
5. Kliknij **Run**. Powinno pokazać „Success. No rows returned”.

## 2. Supabase: logowanie

1. **Authentication → Sign In / Providers → Email**: włączone (domyślnie jest).
2. **Authentication → URL Configuration**:
   - Site URL: adres z Vercela (uzupełnisz po kroku 3, np. `https://wszystko-nowe.vercel.app`, później Twoja subdomena).
   - Redirect URLs: dodaj ten sam adres.

## 3. Vercel: strona

1. vercel.com → **Add New → Project** → wybierz repozytorium `koncpt-hash/wszystko-nowe` → **Import**.
2. Framework: **Vite** (wykryje sam).
3. Przed kliknięciem **Deploy** rozwiń **Environment Variables** i dodaj:

   | Nazwa | Skąd wziąć |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys → anon / publishable |
   | `SUPABASE_URL` | to samo co `VITE_SUPABASE_URL` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API Keys → service_role / secret (tajny!) |
   | `CRON_SECRET` | dowolny długi losowy ciąg, np. z menedżera haseł |

4. **Deploy**. Po chwili dostaniesz adres strony. Wpisz go w Supabase (krok 2.2).

## 4. Pierwsze logowanie i import danych

1. Otwórz stronę z Vercela, wpisz swój e-mail, kliknij link z maila.
2. W obecnym atlasie na claude.ai kliknij **Eksportuj bazę (JSON)** (pasek nad listą miejsc) i zapisz plik.
3. W nowej aplikacji: zakładka **Import danych** → wybierz zapisany plik.
4. Zakładka **Rejestr** powinna pokazać wszystkie miejsca.

## 5. GitHub: cotygodniowa kopia bazy

1. GitHub → repozytorium → **Settings → Secrets and variables → Actions → New repository secret**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Zakładka **Actions → Kopia bazy → Run workflow**, żeby sprawdzić, że działa. W repozytorium pojawi się folder `backup/`.

## Co działa automatycznie

- **Codziennie** Vercel wywołuje `/api/keepalive`, które zapisuje znacznik w tabeli `heartbeat`. Dzięki temu darmowy projekt Supabase nie zostanie wstrzymany.
- **Co wtorek** GitHub zapisuje kopię wszystkich tabel w `backup/`.
- **Każda zmiana** w repozytorium publikuje się na Vercelu sama.
