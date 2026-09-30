# Company Contact Intelligence

Enter a company website URL → the app crawls relevant public pages (robots.txt respected), extracts professional contacts (named people, role mailboxes, public business phones), classifies departments, validates, de-duplicates, lets you review/edit, then saves to Google Sheets. CSV/JSON export included.

## Stack
Node.js + Express backend (`backend/`), static HTML/CSS/JS dashboard (`frontend/`, served by Express), Cheerio, robots-parser, Google Sheets API (service account).

## Structure
`backend/src/{config,controllers,routes,services,utils}` — services: websiteAnalyzer, contactExtractor, contactClassifier, contactValidator, duplicateChecker, googleSheets.

## Google Sheets setup
1. Open Google Cloud Console → create a project.
2. Enable **Google Sheets API**.
3. IAM & Admin → Service Accounts → create one → Keys → Add key → JSON.
4. Share your target sheet with the service account's `client_email` as **Editor**.
5. Copy `.env.example` to `.env` and fill `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (keep the quotes, keep `\n` in the key).
6. Never commit `.env` (already in `.gitignore`).

## Run locally
```
npm run install:all
npm start        # http://localhost:5000
```
Then analyze a test site and verify the rows in the sheet.

## API
`POST /api/analyze` (streams NDJSON progress + result) · `POST /api/check-duplicates` · `POST /api/save-to-sheet`

## Security
Server-side credentials only, URL validation + private-IP (SSRF) blocking, rate limiting, request timeouts, body size limit, CORS config, formula-injection guarding, server-side re-validation on save. Crawler never bypasses robots.txt, CAPTCHA, logins or 401/403/429 responses.

## Limitations
Server-rendered HTML only (no JavaScript rendering); name/designation extraction is heuristic, so review results before saving. Country/City columns are left blank.

## Responsible use
Collect only contacts that a company publishes for business communication. Follow local privacy laws (GDPR, India DPDP Act). Do not use results for spam.
