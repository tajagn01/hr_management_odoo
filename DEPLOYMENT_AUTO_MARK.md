# 🚀 Auto-Mark Attendance - Production Deployment Guide

## Overview
This guide explains how to set up automatic attendance marking in **production** environments (Vercel, Railway, AWS, etc.) where traditional cron jobs don't work.

---

## 🎯 Solution Options

### **Option 1: Vercel Cron Jobs** (Recommended for Vercel)

**Best for:** Apps deployed on Vercel

#### Setup Steps:

1. **Add Cron Secret to Environment Variables**
   ```bash
   # On Vercel Dashboard:
   # Settings → Environment Variables → Add
   CRON_SECRET=your-super-secret-random-string-here
   ```

2. **Deploy the App**
   - The `vercel.json` file is already configured
   - Vercel will automatically schedule the cron job

3. **Verify**
   ```json
   // vercel.json
   {
     "crons": [
       {
         "path": "/api/cron/auto-mark-attendance",
         "schedule": "0 17 * * 1-6"  // 5 PM, Mon-Sat
       }
     ]
   }
   ```

4. **Test Manually**
   ```bash
   curl -X GET \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-app.vercel.app/api/cron/auto-mark-attendance
   ```

**Cron Schedule Explanation:**
- `0 17 * * 1-6` = 5:00 PM (server time), Monday through Saturday
- Adjust timezone in code if needed

---

### **Option 2: GitHub Actions** (Platform-agnostic)

**Best for:** Any deployment platform

#### Setup Steps:

1. **Add Secret to GitHub**
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add secret: `CRON_SECRET` = your secret key

2. **Deploy and Enable Workflow**
   - The workflow file is at `.github/workflows/auto-mark-attendance.yml`
   - GitHub will run it automatically at scheduled time

3. **Customize Schedule**
   ```yaml
   # .github/workflows/auto-mark-attendance.yml
   on:
     schedule:
       # Runs at 5:00 PM IST (11:30 AM UTC)
       - cron: '30 11 * * 1-6'
   ```

4. **Update App URL**
   ```yaml
   # In the workflow file, replace:
   https://your-app.vercel.app/api/cron/auto-mark-attendance
   # With your actual deployed URL
   ```

---

### **Option 3: External Cron Service** (Universal)

**Best for:** Any platform, most flexible

**Services:**
- [cron-job.org](https://cron-job.org) - Free, reliable
- [EasyCron](https://www.easycron.com) - Free tier available
- [Uptime Robot](https://uptimerobot.com) - Monitor + Cron

#### Setup Steps:

1. **Sign up** for a cron service

2. **Create Job:**
   - **URL:** `https://your-app.com/api/cron/auto-mark-attendance`
   - **Method:** GET
   - **Schedule:** `0 17 * * 1-6` (5 PM, Mon-Sat)
   - **Headers:**
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```

3. **Test** the endpoint manually

---

### **Option 4: Railway Cron Jobs**

**Best for:** Apps deployed on Railway

#### Setup Steps:

1. **Add Environment Variable**
   ```bash
   CRON_SECRET=your-secret-key
   ```

2. **Create Service**
   - Railway Dashboard → Add Service → Cron Job
   - Command: `npx tsx scripts/auto-mark-attendance.ts`
   - Schedule: `0 17 * * 1-6`

---

## 🔐 Security

### Environment Variables Needed:

```env
# .env or deployment platform
DATABASE_URL=your-database-url
CRON_SECRET=random-secret-at-least-32-chars
```

### Generate Secure Secret:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or online
# https://randomkeygen.com/
```

---

## 🧪 Testing

### Test Locally:

```bash
# 1. Set environment variable
export CRON_SECRET=test-secret

# 2. Call the API
curl -X GET \
  -H "Authorization: Bearer test-secret" \
  http://localhost:3000/api/cron/auto-mark-attendance
```

### Test in Production:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_PRODUCTION_SECRET" \
  https://your-app.vercel.app/api/cron/auto-mark-attendance
```

**Expected Response:**
```json
{
  "message": "Auto-attendance marking completed",
  "date": "Thu Feb 05 2026",
  "marked": 10,
  "skipped": 3,
  "totalEmployees": 13,
  "results": [...]
}
```

---

## 📊 Monitoring

### Check if Cron Ran:

**Option 1: Check Database**
```sql
SELECT * FROM "AttendanceConfig" 
WHERE "autoMarkedToday" = true 
ORDER BY "date" DESC;
```

**Option 2: Check Attendance Records**
```sql
SELECT COUNT(*) FROM "Attendance" 
WHERE "autoMarked" = true 
AND "date" = CURRENT_DATE;
```

**Option 3: Add Logging**
You can add logging to the cron endpoint to track executions.

---

## 🔄 Timezone Considerations

### Adjust for Your Timezone:

**India (IST = UTC+5:30):**
```
5:00 PM IST = 11:30 AM UTC
Cron: 30 11 * * 1-6
```

**EST (UTC-5):**
```
5:00 PM EST = 10:00 PM UTC
Cron: 0 22 * * 1-6
```

**PST (UTC-8):**
```
5:00 PM PST = 1:00 AM UTC (next day)
Cron: 0 1 * * 2-0
```

---

## 🐛 Troubleshooting

### Cron Not Running?

1. **Check Secret:**
   ```bash
   # Verify environment variable is set
   echo $CRON_SECRET
   ```

2. **Check Logs:**
   - Vercel: Deployment → Functions → Logs
   - Railway: Deployments → Logs
   - GitHub Actions: Actions tab

3. **Test Endpoint Manually:**
   ```bash
   curl -v https://your-app.com/api/cron/auto-mark-attendance \
     -H "Authorization: Bearer YOUR_SECRET"
   ```

4. **Check Schedule Format:**
   ```
   ┌───────────── minute (0 - 59)
   │ ┌───────────── hour (0 - 23)
   │ │ ┌───────────── day of month (1 - 31)
   │ │ │ ┌───────────── month (1 - 12)
   │ │ │ │ ┌───────────── day of week (0 - 6, 0=Sunday)
   │ │ │ │ │
   * * * * *
   ```

### Manual Override:

If cron fails, run manually:
```bash
# Using curl
curl -X GET \
  -H "Authorization: Bearer YOUR_SECRET" \
  https://your-app.com/api/cron/auto-mark-attendance

# Or trigger via GitHub Actions
# Go to: Actions → Auto-Mark Attendance → Run workflow
```

---

## 📋 Comparison Table

| Solution | Free Tier | Reliability | Setup Difficulty | Best For |
|----------|-----------|-------------|------------------|----------|
| **Vercel Cron** | ✅ Yes | ⭐⭐⭐⭐⭐ | Easy | Vercel deployments |
| **GitHub Actions** | ✅ Yes (2000 min/mo) | ⭐⭐⭐⭐ | Medium | Any platform |
| **cron-job.org** | ✅ Yes | ⭐⭐⭐⭐ | Easy | Any platform |
| **Railway Cron** | ✅ Yes ($5 credit) | ⭐⭐⭐⭐⭐ | Easy | Railway deployments |
| **EasyCron** | ✅ Limited | ⭐⭐⭐ | Easy | Small projects |

---

## ✅ Recommended Setup

**For Most Users:**
1. Deploy to **Vercel**
2. Use **Vercel Cron** (built-in)
3. Add **CRON_SECRET** environment variable
4. Done! ✨

**Alternative:**
1. Deploy anywhere
2. Use **GitHub Actions** (free, reliable)
3. Works with any hosting platform

---

## 🎯 Quick Start Checklist

- [ ] Add `CRON_SECRET` to environment variables
- [ ] Deploy app with `vercel.json` or workflow file
- [ ] Test endpoint manually with curl
- [ ] Wait for scheduled time or trigger manually
- [ ] Verify attendance records were created
- [ ] Check `AttendanceConfig` table for lock status
- [ ] Monitor for a week to ensure it runs daily

---

## 📞 Support

If auto-marking isn't working:
1. Check the logs on your deployment platform
2. Verify the secret matches in both places
3. Test the endpoint manually with curl
4. Check database permissions
5. Ensure the cron schedule is in correct timezone

**Manual Fallback:**
You can always run the script manually:
```bash
npx tsx scripts/auto-mark-attendance.ts
```

Or call the API endpoint directly whenever needed.
