# Backend FastAPI

## Avvio locale

Dalla cartella `backend`:

```bash
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env  # Windows: copy .env.example .env
uvicorn app.main:app --reload
```

Modificare `DATABASE_URL` in `.env` con la stringa di connessione PostgreSQL del progetto Supabase (Dashboard > Connect). La password database resta solo nel file locale del backend, mai nel frontend o nel repository. Se la password contiene caratteri speciali, codificarli per l'URL.

Controllare `http://localhost:8000/health`. L'API protetta richiede il token di accesso Supabase Auth; l'utente deve avere una riga attiva in `public.app_users`.

## Test

```bash
pytest
```

Il login via Supabase Auth è distinto dall'autorizzazione applicativa (`admin`, `reception`, `housekeeping`). Per la prova usare l'account amministratore già registrato. Non è stato ancora effettuato un collaudo end-to-end su server pubblicato.
