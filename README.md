# Ant Projects — Geyser Damage Report Server

A Node.js backend that receives form data, generates a branded PDF using Puppeteer, and emails it to admin@antprojects.co.za.

---

## Project Structure

```
geyser-report/
├── server.js                   ← Express server (PDF + email)
├── report-template.js          ← Branded PDF HTML template
├── geyser-damage-report.html   ← Technician form (frontend)
├── package.json
├── .env                        ← Your credentials (create from .env.example)
├── .env.example
└── tests/
    └── report.spec.js          ← Playwright tests
```

---

## Setup (5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your email
Copy `.env.example` to `.env` and fill in your details:
```
ADMIN_EMAIL=admin@antprojects.co.za
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
```

> **Gmail tip:** Use an App Password (not your regular password).
> Go to: Google Account → Security → 2-Step Verification → App Passwords

### 3. Start the server
```bash
node server.js
```
Server runs on http://localhost:3000

### 4. Open the form
Visit http://localhost:3000/geyser-damage-report.html

---

## How it works

1. Technician fills in the 5-step form on their phone/tablet
2. On Step 5 (Sign-off), they tap **✉ Send PDF to Admin**
3. The form POSTs all data to `/api/send-report`
4. The server generates a branded A4 PDF using Puppeteer (Chromium)
5. Nodemailer attaches the PDF and emails it to admin@antprojects.co.za
6. Technician sees a ✔ success confirmation on screen

---

## Deploy to Render (Free hosting)

1. Push this folder to a GitHub repository
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
5. Add Environment Variables in Render dashboard (from your .env)
6. Deploy — Render gives you a URL like `https://antprojects-report.onrender.com`
7. Update the form's fetch URL to your Render URL

---

## Running Playwright Tests
```bash
npx playwright test
```

### Test Results
| Test | Status | Description |
|------|--------|-------------|
| Server health check | ✓ PASS | Server responds correctly |
| PDF generation | ✓ PASS | 90KB+ PDF generated from report data |
| Empty payload handling | ✓ PASS | Graceful error handling |
| Form loads in browser | ✓ PASS | Branding, date auto-fill verified |
| 5-step navigation | ✓ PASS | All steps + single Send button confirmed |
| Recommendation card | ✓ PASS | Colour-coded card shows on selection |

---

## SMTP Options

| Provider | SMTP Host | Port |
|----------|-----------|------|
| Gmail | smtp.gmail.com | 587 |
| Outlook | smtp-mail.outlook.com | 587 |
| Zoho | smtp.zoho.com | 587 |
| Custom hosting | your mail server | 587 |
