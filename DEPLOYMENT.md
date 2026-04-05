# Eldon Studio Deployment

## Production layout

- Frontend: Vercel
- Booking API: Render Web Service
- Database: Render Postgres
- Media/Auth: Supabase

## Vercel project

- Root directory: project root
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

## Required Vercel environment variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`
- `VITE_LUMINA_URL`
- `VITE_LUMINA_API_URL`

## Render API service

- Repo: `lumina-app`
- Runtime: `Node`
- Build command: `npm install && npm run db:generate:postgres`
- Pre-deploy command: `npm run db:push:postgres`
- Start command: `npm run server`

## Required Render environment variables

- `DATABASE_URL`
- `CLIENT_URL`
- `PORT`
- `HOST`
- `NODE_ENV`

## Recommended domains

- Website: `www.eldonstudio.com`
- API: `api.eldonstudio.com`
