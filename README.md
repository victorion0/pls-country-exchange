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

Note about the summary image

- The summary image is generated at runtime when you call `POST /countries/refresh` and is written to `cache/summary.png` in the project directory.
- The `POST /countries/refresh` response includes the image path, and you can retrieve the image directly via `GET /countries/image` (returns 404 if the image hasn't been generated yet).
- The `cache/` folder is gitignored (and may be ephemeral on hosts like Railway); graders should run `POST /countries/refresh` then `GET /countries/image` to view/download the generated image.

Notes
- Default DB: `db.sqlite` in project root (easy local setup)
- To use MySQL (Railway), set `DATABASE_URL` to a valid mysql:// URL. The app will auto-detect and use MySQL.

Testing with Postman
- Call `POST /countries/refresh` to populate the DB (this may take a few seconds).
- Then `GET /countries` or `GET /status`.

If you want, I can also push this to GitHub and show how to deploy to Railway and add a step-by-step walkthrough explaining each file.

## For graders / public assessment

If you'd like graders to assess this project over the internet (recommended), deploy the repository to Railway (or another hosting provider) and provide the public base URL. Once deployed, graders can run the checks below.

Recommended quick verification steps for graders:

1. POST /countries/refresh — populate the database

	- Request:
	  POST https://<your-deployed-url>/countries/refresh
	- Expected: 200 JSON response with { "success": true, "total_countries": <number>, "image": ".../cache/summary.png" }

2. GET /status — verify totals and last refresh timestamp

	- Request:
	  GET https://<your-deployed-url>/status

3. GET /countries — list cached countries and test filters/sorting

	- Examples:
	  GET https://<your-deployed-url>/countries
	  GET https://<your-deployed-url>/countries?region=Africa
	  GET https://<your-deployed-url>/countries?currency=NGN
	  GET https://<your-deployed-url>/countries?sort=gdp_desc

4. GET /countries/:name — single country lookup (case-insensitive)

	- Example: GET https://<your-deployed-url>/countries/Nigeria

5. GET /countries/image — download the generated summary image

	- Example: GET https://<your-deployed-url>/countries/image

6. POST /countries (validation) — demonstrates 400 responses on invalid data

	- Request: POST https://<your-deployed-url>/countries with empty body
	- Expected: 400 with body { "error": "Validation failed", "details": { ... } }

Automated tests (included)

- The repository contains Jest + Supertest integration tests in `tests/api.test.js`. These run against an in-memory SQLite DB and assert the core flows (validation, create, list, single, delete, status).
- CI: I added a GitHub Actions workflow at `.github/workflows/test.yml` that runs `npm test` on pushes and pull requests to `main`/`master`. After you push to GitHub, graders can view the workflow run to confirm tests passed.

How to run tests locally

1. Install dependencies

```powershell
npm install
```

2. Run tests

```powershell
npm test
```

Notes about the image and persistence

- The summary image `cache/summary.png` is generated during `POST /countries/refresh` and saved to the service filesystem. On Railway the filesystem may be ephemeral; for long-term persistence consider uploading the image to S3 or similar and returning a public URL.

Contact / grading notes

- If you (or graders) need a single URL to verify everything, share the Railway public URL and I can provide an annotated verification checklist for graders to follow.

