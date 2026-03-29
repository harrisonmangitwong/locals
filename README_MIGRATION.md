# Locals — Next.js + FastAPI Migration

This is the migrated version of the Locals restaurant recommendation app, split into a FastAPI backend and a Next.js frontend.

## Project Structure

```
locals/
├── backend/
│   ├── main.py              # FastAPI app
│   └── requirements.txt     # Python dependencies
├── frontend/                # Next.js app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Landing page
│   │   └── recommendations/
│   │       └── page.tsx     # Recommendations page
│   └── components/
│       └── RestaurantCard.tsx
└── outputs/
    └── locals_recommendations.csv
```

## Running the Backend

1. Create and activate a Python virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate   # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

The API will be available at `http://localhost:8000`.

API endpoints:
- `GET /api/recommendations` — paginated restaurant list with optional `neighborhood`, `cuisine`, `page`, `page_size` query params
- `GET /api/filters` — available neighborhoods and cuisines

## Running the Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`.

## Running Both Together

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then visit `http://localhost:3000`.
