# HRMS Lite (Full‑Stack)

Lightweight Human Resource Management System for:

- Employee Management (add, list, delete)
- Attendance Management (mark present/absent by date, view per employee, filter by date/status)

No authentication (single admin user assumption).

## Tech stack

- **Backend**: FastAPI + SQLModel + SQLite (default)
- **Frontend**: Vite + React + TypeScript
- **Deployment-ready**: Dockerfile for backend, SPA rewrites for frontend

## Project structure

- `backend/` – FastAPI API + DB models
- `frontend/` – React admin UI

## API endpoints (summary)

- `GET /health`
- `GET /dashboard`
- `POST /employees`
- `GET /employees`
- `DELETE /employees/{employee_id}`
- `POST /employees/{employee_id}/attendance`
- `GET /employees/{employee_id}/attendance?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&status=Present|Absent`

## Run locally

### Backend (FastAPI)

From the repo root:

```bash
cd backend
python -m pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend will be at `http://localhost:8000` and Swagger docs at `http://localhost:8000/docs`.

### Frontend (React)

In a second terminal:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend will be at `http://localhost:5173`.

## Configuration

### Backend env (`backend/.env`)

- **`DATABASE_URL`**: defaults to `sqlite:///./hrms.db`
- **`CORS_ORIGINS`**: comma-separated list (defaults to `http://localhost:5173`)

### Frontend env (`frontend/.env`)

- **`VITE_API_BASE_URL`**: backend base URL (example: `http://localhost:8000`)

## Validations & error handling

- Required fields enforced (server-side)
- Email validated using `EmailStr`
- Duplicate employee handling:
  - duplicate `employee_id` → `409 Conflict`
  - duplicate `email` → `409 Conflict`
- Duplicate attendance for same employee+date → `409 Conflict`
- Invalid requests return meaningful `4xx` responses (FastAPI validation + custom formatting)

## Deployment (guide)

### Deploy backend (Render / Railway)

Option A (recommended): **Docker**

- Point the service to the `backend/` folder
- Use the included `backend/Dockerfile`
- Set environment variables:
  - `CORS_ORIGINS` = your frontend URL (e.g. `https://your-app.vercel.app`)
  - (Optional) `DATABASE_URL` to a managed DB; otherwise SQLite inside container is used

Option B: Native python command

- Build: `pip install -r backend/requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Deploy frontend (Vercel / Netlify)

- Root directory: `frontend/`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_BASE_URL` = your deployed backend URL (example: `https://hrms-lite-api.onrender.com`)

SPA routing is supported via:

- `frontend/vercel.json` (Vercel)
- `frontend/public/_redirects` (Netlify)

## Assumptions / limitations

- Single admin user; **no authentication**
- Attendance is stored per employee per date (one record per day per employee)
- Default DB is SQLite for simplicity (can be swapped via `DATABASE_URL`)

