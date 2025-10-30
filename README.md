# Country Currency & Exchange API

This project implements the Backend Task: Country Currency & Exchange API.

Overview
- Node.js + Express API
- Sequelize ORM (defaults to SQLite for easy local setup; can use MySQL via DATABASE_URL)
- Fetches countries and exchange rates from external APIs, caches into DB on refresh
- Generates a summary image at `cache/summary.png` after refresh

Quick start (Windows / PowerShell)

1. Install dependencies

```powershell
npm install
```

2. Copy environment file

```powershell
copy .env.example .env
```

3. (Optional) If using Railway/MySQL, set `DATABASE_URL` in `.env` to your MySQL URL.

4. Start server

```powershell
npm start
```

The server runs on the port set in `.env` (default 3000). Endpoints:

- POST /countries/refresh — fetch data and cache
- GET  /countries — list countries (filters: ?region=, ?currency=, ?sort=gdp_desc)
- GET  /countries/:name — get a single country by name
- DELETE /countries/:name — delete a country
- GET /status — total countries and last refresh timestamp
- GET /countries/image — serve `cache/summary.png`

Notes
- Default DB: `db.sqlite` in project root (easy local setup)
- To use MySQL (Railway), set `DATABASE_URL` to a valid mysql:// URL. The app will auto-detect and use MySQL.

Testing with Postman
- Call `POST /countries/refresh` to populate the DB (this may take a few seconds).
- Then `GET /countries` or `GET /status`.

If you want, I can also push this to GitHub and show how to deploy to Railway and add a step-by-step walkthrough explaining each file.
