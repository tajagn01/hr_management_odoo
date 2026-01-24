# Birthday Email Automation Setup

## Automated Birthday Emails

The system now automatically sends birthday greeting emails to employees on their birthday!

### How It Works

1. **Daily Check**: A cron job runs daily to check for birthdays
2. **Beautiful Email**: Employees receive a professionally designed birthday email
3. **Automatic**: No manual intervention needed

### Setup Instructions

#### Option 1: Vercel Cron Jobs (Recommended for Production)

1. Create `vercel.json` in your project root:

```json
{
  "crons": [{
    "path": "/api/cron/birthday",
    "schedule": "0 9 * * *"
  }]
}
```

2. Deploy to Vercel - the cron will run automatically at 9 AM daily

#### Option 2: External Cron Service

Use a service like **cron-job.org** or **EasyCron**:

1. URL: `https://your-domain.com/api/cron/birthday`
2. Method: GET
3. Schedule: Daily at 9:00 AM
4. Headers: `Authorization: Bearer your-super-secret-cron-key-change-this-in-production`

#### Option 3: Manual Testing

Test the birthday email system manually:

```bash
# Send a POST request to trigger birthday check
curl -X POST http://localhost:3000/api/cron/birthday
```

### Environment Variables

Add to your `.env` file:

```
CRON_SECRET=your-super-secret-cron-key-change-this-in-production
```

**Important**: Change the default CRON_SECRET to a secure random string in production!

### Email Template

The birthday email includes:
- 🎉 Festive design with gradient background
- 🎂 Personal greeting with employee's name
- 🎁 Warm birthday wishes
- Professional signature from the team

### Testing

1. Set an employee's date of birth to today
2. Run: `curl -X POST http://localhost:3000/api/cron/birthday`
3. Check the employee's email inbox

### Security

- The cron endpoint is protected with `CRON_SECRET`
- Only authorized requests can trigger the birthday check
- GET requests require Bearer token authentication
- POST requests available for manual testing (disable in production)
