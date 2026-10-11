# Prenotazioni — gestionale alberghiero

Progetto privato per un singolo albergo: frontend React/Vite, backend FastAPI e database PostgreSQL su Supabase. L'autenticazione usa Supabase Auth; i permessi degli operatori sono in `public.app_users`.

## Prima prova in locale

**Backend**: seguire `backend/README.md`. Occorre impostare `DATABASE_URL` nel file locale `backend/.env` con la stringa PostgreSQL del progetto Supabase; non pubblicarla.

**Frontend** (Node.js 20+):

```bash
cd frontend
cp .env.example .env  # Windows: copy .env.example .env
npm install
npm run dev
```

Aprire `http://localhost:5173` e accedere con `zantium@tiscali.it` e la password impostata in Supabase Authentication. La chiave publishable nel frontend è pubblica per definizione; la password del database e ogni secret key devono restare esclusivamente lato server.

L'API è raggiungibile a `http://localhost:8000/health` quando il backend è avviato. Le camere possono inizialmente essere vuote: non sono stati ancora inseriti dati di prova. Il planning attuale è una griglia dimostrativa e non mostra ancora l'occupazione reale.

**Stato**: codice predisposto per prova locale; non ancora distribuito su hosting pubblico e non ancora collaudato end-to-end.
