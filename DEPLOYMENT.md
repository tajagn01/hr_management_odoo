# Deployment Guide

## Prerequisites
- Node.js 18+
- PostgreSQL Database (Neon, Supabase, or self-hosted)
- Vercel Account (recommended for hosting)

## Environment Variables
Ensure the following variables are set in your `.env` file or deployment platform:

```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
AUTH_SECRET="your-auth-secret"
CRON_SECRET="your-cron-secret-for-aggregation"
NEXT_PUBLIC_APP_URL="https://your-app-url.com"
```

## Deployment Steps

### 1. Database Migration
Before deploying the application code, apply the database migrations:

```bash
npx prisma migrate deploy
```

This will create the necessary tables including `MonthlyAttendance`, `YearlyAttendance`, and update the `Employee` and `Role` schemas.

### 2. Build Application
```bash
npm run build
```

### 3. Start Server
```bash
npm start
```

## Post-Deployment Setup

### 1. Scheduled Jobs (Cron)
To ensure attendance reports are generated automatically, set up a scheduled job (e.g., using Vercel Cron or GitHub Actions) to call the aggregation endpoint.

- **Endpoint**: `POST /api/cron/aggregate-attendance`
- **Schedule**: 
  - Monthly: 1st of every month at 00:00
  - Yearly: 1st of January at 00:00
- **Headers**:
  - `Authorization`: `Bearer <CRON_SECRET>`
- **Body**:
  - Monthly: `{ "type": "monthly", "year": 2026, "month": 1 }`
  - Yearly: `{ "type": "yearly", "year": 2026 }`

### 2. Initial Data Seeding (Optional)
If this is a fresh install, you can seed the database with initial roles and an admin user:

```bash
npx prisma db seed
```
