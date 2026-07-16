# Pastalino Manor System

This workspace contains a scaffold for a facility management system.

## Backend

1. Open a terminal in `backend`
2. Run `npm install`
3. Start the server with `npm run dev`
4. Backend API will be available at `http://localhost:4000/api`

## Frontend

1. Open a terminal in `frontend`
2. Run `npm install`
3. Start the React app with `npm run dev`
4. Frontend will run at `http://localhost:3000`

## Default accounts

- Admin: `admin@pastalino.local`
- Password: `Admin123!`

## Notes

- The backend uses SQLite and seeds initial staff, member, and document data on startup.
- The frontend is configured with Vite and uses MUI for the UI.
- API requests are proxied from `frontend` to `backend` under `/api`.
