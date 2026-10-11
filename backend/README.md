# Backend API (sviluppo)

## Avvio
1. Crea un ambiente virtuale e installa `pip install -r requirements-dev.txt`.
2. Copia `.env.example` in `.env`.
3. Configura `DATABASE_URL` con credenziali PostgreSQL server-side e `API_TOKEN` con un segreto lungo casuale.
4. Avvia `uvicorn app.main:app --reload` dalla cartella `backend`.
5. Esegui `pytest`.

## Endpoint
`GET /health` non richiede autenticazione.
Gli endpoint `/api/v1/*` richiedono `Authorization: Bearer <API_TOKEN>`.
Sono disponibili `GET /api/v1/rooms`, `GET /api/v1/availability?arrival=YYYY-MM-DD&departure=YYYY-MM-DD`, `GET /api/v1/reservations`, `POST /api/v1/room-types`, `POST /api/v1/rooms`, `POST /api/v1/guests` e `POST /api/v1/reservations`.

## Limiti prima della produzione
- L'autenticazione a token condiviso è **solo temporanea**. Non inserire il token nel frontend React, nel browser o in GitHub.
- Prima di collegare il frontend serve login per utente, sessioni sicure, autorizzazioni e audit.
- Mancano ancora tariffazione, cancellazioni, check-in/out e gestione completa dei blocchi concorrenti.
- Non sono ancora stati eseguiti test end-to-end sul database remoto.
- Lo schema Supabase va esportato e versionato nel repository.
