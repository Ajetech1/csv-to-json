# CSV → JSON Converter

A fast, browser-based CSV to JSON converter built with Next.js and PapaParse.

## Features
- Drag & drop or click to upload CSV files
- Syntax-highlighted JSON preview
- Download output as `.json`
- Copy JSON to clipboard
- Options: header row, skip empty rows, trim whitespace, auto-detect types, custom delimiter
- 100% client-side — no data leaves your browser

## Stack
- **Next.js 15** (App Router)
- **PapaParse** — CSV parsing
- **TypeScript**
- **Tailwind CSS**

## Deploy to Vercel

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "init"
git remote add origin <your-repo-url>
git push -u origin main

# 2. Go to vercel.com → Import Project → select repo → Deploy
```

No environment variables required. Zero-config Vercel deployment.

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```
