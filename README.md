# Prenotazioni — gestionale alberghiero

Monorepo privato per un singolo albergo.

## Componenti
- `frontend/`: React + TypeScript (fase successiva)
- `backend/`: FastAPI e SQLAlchemy
- `database/`: schema PostgreSQL di riferimento

## Avvio backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Su Windows: `.venv\Scripts\activate`.

Copiare `.env.example` in `.env` e impostare `DATABASE_URL` solo nell'ambiente server. Non committare segreti.

API: `/health`, `/docs`. Nessun dato personale deve essere pubblicato senza autenticazione.
