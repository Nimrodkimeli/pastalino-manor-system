# Railway Live Deployment

This is the shortest path to get Pastalino Manor live on the real domain.

## Target URLs

- Frontend: `https://pastalinomanor.llc`
- Backend API: `https://api.pastalinomanor.llc`

## 1) Railway services

You should have two Railway services from the same repo.

### Backend service

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Volume mount: `/data`

Environment variables:

- `JWT_SECRET=<replace-with-a-long-random-secret>`
- `DB_PATH=/data/pastalino.sqlite`
- `ALLOWED_ORIGINS=https://pastalinomanor.llc,http://localhost:3000`

Optional variables if you need email and SMS notifications in production:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TEST_NOTIFICATION_EMAIL`
- `TEST_NOTIFICATION_PHONE`
- `APPOINTMENT_REMINDER_SCHEDULER_ENABLED=true`
- `APPOINTMENT_REMINDER_INTERVAL_MINUTES=5`

Recommended production values for notifications:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=<full mailbox address used to send staff temporary passwords and reminder emails>`
- `SMTP_PASS=<Google App Password or provider SMTP password>`
- `SMTP_FROM=<same mailbox or approved sender address>`
- `TWILIO_ACCOUNT_SID=<Twilio account SID>`
- `TWILIO_AUTH_TOKEN=<Twilio auth token>`
- `TWILIO_PHONE_NUMBER=<Twilio messaging number in E.164 format, for example +15203408093>`
- `TEST_NOTIFICATION_EMAIL=<admin mailbox for safe delivery tests>`
- `TEST_NOTIFICATION_PHONE=<verified SMS destination for safe delivery tests>`

Health check:

- `https://pastalino-manor-system-production.up.railway.app/api/status`

### Frontend service

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

Environment variables:

- `VITE_API_URL=https://api.pastalinomanor.llc/api`

Health check:

- `https://pastalino-manor-frontend-production.up.railway.app`

## 2) Attach custom domains in Railway

DNS records by themselves are not enough on Railway.

In the Railway dashboard:

- Attach `pastalinomanor.llc` to the frontend service.
- Attach `api.pastalinomanor.llc` to the backend service.

If Railway shows `Application not found` or `The train has not arrived at the station`, the hostname reached Railway but is not attached to the correct service yet.

## 3) DNS records

At your DNS provider, create or confirm these records:

- Apex/root (`@`) -> frontend target. Use your DNS provider's apex CNAME flattening/ALIAS/ANAME support pointed at `pastalino-manor-frontend-production.up.railway.app`.
- `api` CNAME -> `pastalino-manor-system-production.up.railway.app`

Do not point the apex/root at the backend service.
Do not point `api` at the frontend service.

## 4) Redeploy order

1. Deploy backend.
2. Confirm the Railway backend URL responds.
3. Deploy frontend.
4. Attach both custom domains in Railway.
5. Wait for DNS and SSL to finish provisioning.

## 5) Verification

These should succeed when setup is complete:

- `https://pastalino-manor-frontend-production.up.railway.app`
- `https://pastalino-manor-system-production.up.railway.app/api/status`
- `https://pastalinomanor.llc`
- `https://api.pastalinomanor.llc/api/status`

Notification verification after deploy:

1. Open Railway backend variables and confirm all SMTP/Twilio values are set there, not only in local `.env`.
2. Redeploy the backend service after saving the variables.
3. In Railway backend shell or local backend terminal, run `npm run notifications:verify`.
4. Confirm SMTP verification returns `success: true`.
5. Confirm Twilio verification returns `success: true`.
6. In the app, go to Staff and use the admin `Send Test Notifications` button.
7. Create a test staff account and confirm the temporary password email arrives.

## 6) If something is still broken

- Frontend Railway URL works but `pastalinomanor.llc` fails: the frontend custom domain is not attached correctly in Railway yet.
- Backend Railway URL works but `api.pastalinomanor.llc` fails: the backend custom domain is not attached correctly in Railway yet.
- Frontend loads but API calls fail: check `VITE_API_URL` and backend `ALLOWED_ORIGINS`.
- Login or protected requests fail after deploy: rotate `JWT_SECRET` to a real value and redeploy backend.
- Test email fails with `535 5.7.8 Username and Password not accepted`: the SMTP password is wrong or not an app password.
- Test SMS fails on a Twilio trial account: verify the recipient phone number in Twilio or upgrade the account.

## 7) Security cleanup

- Rotate all SMTP and Twilio secrets if they were ever exposed.
- Do not rely on local `.env` files for production settings.
- Store production secrets only in Railway environment variables.