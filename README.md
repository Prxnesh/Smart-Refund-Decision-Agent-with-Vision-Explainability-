# Smart Refund Decision Agent

Production-ready MVP for AI-assisted refund decisions with:
- Customer chat complaint intake
- Multi-agent decision engine (sentiment + fraud + policy)
- Explainable admin case viewer
- Analytics dashboard with charts
- Excel export reporting

## Stack

- Frontend: React + Vite + Tailwind + Recharts
- Backend: FastAPI + SQLAlchemy + SQLite
- AI: HuggingFace sentiment pipeline with keyword fallback
- Data: SQLite file in `data/refund_agent.db`

## Project Structure

- `backend/` FastAPI app, services, API, exports
- `frontend/` React UI, pages, components, hooks
- `data/` SQLite database file generated at runtime

## Backend Setup

```bash
cd backend
cp .env.example .env
cd ..
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Run backend:

```bash
cd backend
../.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.
Backend runs at `http://localhost:8000`.

## Admin Login

Default credentials:
- username: `admin`
- password: `admin`

## API Routes

- `POST /api/submit-complaint`
- `POST /api/admin/login`
- `GET /api/admin/cases`
- `GET /api/admin/case/{id}`
- `GET /api/analytics`
- `GET /api/export-report`
- `GET /api/admin/policy`
- `POST /api/admin/policy`

## Decision Logic

- If fraud score > 0.7: reject
- Else if policy window valid and sentiment threshold met: approve
- Else if in partial window: partial refund
- Else: reject

Confidence score is weighted from fraud risk, sentiment, and policy match.

## Features Included

- Chat-style customer complaint submission
- Admin case list and detailed case viewer
- AI scores: sentiment, anger, fraud, genuineness
- Explainable decision output with confidence
- User memory features (orders, refunds, ratio, past complaints)
- Policy JSON configuration via admin page
- Analytics:
  - Total refunds
  - Refund rate
  - Fraud cases
  - Average sentiment
  - Top refunded products
  - Line/pie/bar charts
- Excel export using pandas + openpyxl
- Mock data auto-seeded on first startup

## Notes

- First backend startup can take longer while Python packages initialize.
- Without PyTorch installed, sentiment service safely falls back to keyword-based scoring.
