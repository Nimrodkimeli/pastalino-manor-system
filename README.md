# Pastalino Manor System

This workspace contains a scaffold for a facility management system.

## Quick start (one command)

1. Open a terminal in the project root.
2. Run `npm install`.
3. Run `npm run setup`.
4. Run `npm run dev`.

This starts backend and frontend together.

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

## Appointment reminders

- Appointment email reminders use SMTP via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optional `SMTP_FROM`.
- Appointment SMS reminders use Twilio via `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`.
- Automatic appointment reminder sending runs in the backend process and is controlled by `APPOINTMENT_REMINDER_SCHEDULER_ENABLED` and `APPOINTMENT_REMINDER_INTERVAL_MINUTES`.
- If SMTP or Twilio are not configured, reminder attempts are logged to `backend/data/notification.log` instead of being delivered.
- Gmail / Google Workspace SMTP mapping: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465` with `SMTP_SECURE=true` or `SMTP_PORT=587` with `SMTP_SECURE=false`, `SMTP_USER` is the full Google email address, and `SMTP_PASS` must be a Google App Password.
- Staff temporary password emails use the same SMTP settings. When an admin creates a staff user, the backend emails the temporary password automatically if SMTP verification succeeds.
- Google App Password tip: if Google shows the app password with spaces, the backend now strips those spaces automatically before login.
- Twilio phone numbers should be stored in E.164 format, for example `+15203408093`. The backend now normalizes common U.S. 10-digit and 11-digit inputs automatically.
- Twilio trial accounts can only send to verified recipient numbers. Add the destination phone under Twilio Verified Caller IDs or upgrade the account before expecting live SMS delivery.
- Safe provider checks: run `npm run notifications:verify` in `backend/` to verify config without sending messages, and `npm run notifications:test` to send a safe test email and SMS to `TEST_NOTIFICATION_EMAIL` and `TEST_NOTIFICATION_PHONE` if you set them in `backend/.env`.
