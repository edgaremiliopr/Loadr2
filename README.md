# Loadr

Next.js app for a Florida freight brokerage focused on:

- carriers with truck-mounted forklifts / piggybacks / Moffetts
- shippers that deliver direct to jobsites
- a solo-broker operating model with research, map and TMS views in one app

## What is included

- `Command` tab for launch priorities, market focus and daily playbook
- `Research` tab with starter carrier + shipper database, fit scoring, sources and contact data
- `Map` tab with a Florida coverage map that plots carriers and shippers
- `TMS` tab with sample load pipeline, quote comparisons and carrier compliance status
- `research/seed-targets.csv` to expand the public-company seed list
- `scripts/scrape_companies.py` starter scraper using `Scrapling 0.4.1`

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scraping workflow

Install Python deps:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the starter scrape:

```bash
python scripts/scrape_companies.py research/seed-targets.csv
```

This writes `research/seed-targets.json` with extracted public signals such as:

- page title
- detected emails
- detected phone numbers
- keyword hits for forklift / piggyback / Moffett positioning

## Current data caveat

The app includes a curated starter set of Florida targets gathered from public company websites. It is not yet an exhaustive statewide database. The intended next step is to keep enriching the seed list and feed verified records into a real database once you decide on production persistence.

## Deploy

This project is structured for Vercel:

```bash
vercel
```

For production, the next practical upgrade is adding a hosted database and auth before multi-user use or large-scale research imports.
