# DayFlow - HR Management System

A modern HR management system built with Next.js 16, featuring employee management, attendance tracking, leave management, and payroll processing.

## 📊 Project Overview

**[View Interactive System Diagram →](https://excalidraw.com/#json=zLcASc8DioYDfhfEkzu53,xFUg6gm4_S9GrA6VTdR90g)**

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Authentication:** NextAuth.js v5
- **UI:** Tailwind CSS + Radix UI + shadcn/ui
- **Charts:** Recharts

## Features

- 🔐 Role-based authentication (Admin, Manager & Employee)
- 🔑 Google OAuth login with automatic account creation
- 👥 Employee management
- 📅 Attendance tracking
- 🏖️ Leave request management
- 💰 Payroll processing
- 📊 Dashboard with analytics charts
- 🌙 Dark/Light theme support
- ⌨️ Command menu (Ctrl/Cmd + K)
- 💾 Database backup & restore system

---

## 🔧 How It Works

### Authentication Flow

1. **Login/Register** - Users authenticate via the login page using email and password
2. **Session Management** - NextAuth.js handles secure session management with JWT tokens
3. **Role-Based Routing** - After login, users are redirected to their respective dashboards:
   - Admins → `/admin` dashboard
   - Employees → `/employee` dashboard
4. **Protected Routes** - Middleware ensures users can only access pages based on their role

### Admin Dashboard

The admin has full control over the HR system:

| Module | Functionality |
|--------|---------------|
| **Dashboard** | Overview with analytics charts showing attendance trends, department distribution, and payroll summaries |
| **Employees** | Add, edit, view, and deactivate employees. Manage employee details like department, position, and salary |
| **Attendance** | View attendance records of all employees. See daily/monthly attendance reports |
| **Leave Requests** | Review pending leave requests. Approve or reject leave applications with comments |
| **Payroll** | Process monthly payroll. View salary breakdowns, deductions, and generate payslips |

### Employee Dashboard

Employees have access to their personal HR information:

| Module | Functionality |
|--------|---------------|
| **Dashboard** | Personal overview with attendance stats, leave balance, and recent activities |
| **Profile** | View and update personal information |
| **Attendance** | Mark daily attendance (check-in/check-out). View personal attendance history |
| **Leave** | Apply for leave (Paid, Sick, Unpaid). Track leave request status and remaining balance |
| **Payroll** | View salary slips and payment history |

### Database Models

The system uses the following core data models:

```
User ─────────────── Employee (1:1)
  │                      │
  │                      ├── Attendance (1:N)
  │                      ├── LeaveRequest (1:N)
  │                      └── Payroll (1:N)
```

- **User** - Authentication data (email, password, role)
- **Employee** - Personal details (name, department, position, salary, join date)
- **Attendance** - Daily attendance records (date, check-in/out time, status)
- **LeaveRequest** - Leave applications (type, dates, status, reason)
- **Payroll** - Monthly salary records (basic, deductions, net pay)

### API Routes

The application exposes RESTful API endpoints:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/*` | POST | Authentication (login, register, session) |
| `/api/employees` | GET, POST, PUT, DELETE | Employee CRUD operations |
| `/api/attendance` | GET, POST | Attendance management |
| `/api/leave` | GET, POST, PUT | Leave request management |
| `/api/payroll` | GET, POST | Payroll processing |

### UI Components

- **Sidebar** - Navigation menu with role-based links
- **Navbar** - Top bar with user info, theme toggle, and logout
- **Command Menu** - Quick navigation with `Ctrl/Cmd + K`
- **Data Tables** - Sortable, filterable tables for data display
- **Charts** - Interactive charts for analytics (Recharts)
- **Theme Toggle** - Switch between light and dark modes

---

## �🚀 Setup Guide

For detailed installation and setup instructions, please refer to the **[SETUP.md](SETUP.md)** file.

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/hr_management_sys.git
cd hr_management_sys

# 2. Install dependencies
npm install

# 3. Set up environment variables (see SETUP.md for details)
cp .env.example .env

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations
npx prisma migrate deploy

# 6. Seed the database
npx tsx prisma/seed.ts

# 7. Start the development server
npm run dev
```

📖 **[Full Setup Instructions →](SETUP.md)**

---

## 🔑 Default Login Credentials

After seeding the database, you can log in with these accounts:

### Admin Account
| Email | Password |
|-------|----------|
| admin@dayflow.com | admin123 |

### Employee Accounts
| Email | Password |
|-------|----------|
| john@dayflow.com | employee123 |
| jane@dayflow.com | employee123 |

---

## 👤 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access - manage employees, view all attendance, approve/reject leave requests, process payroll |
| **Employee** | Limited access - view own profile, mark attendance, apply for leave, view own payroll |

---

## 📁 Project Structure

```
├── app/
│   ├── (auth)/          # Login & Register pages
│   ├── (dashboard)/     # Admin & Employee dashboards
│   │   ├── admin/       # Admin pages (employees, attendance, leave, payroll)
│   │   └── employee/    # Employee pages (profile, attendance, leave, payroll)
│   └── api/             # API routes
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   └── charts/          # Recharts components
├── lib/                 # Utilities & Prisma client
│   └── generated/       # Generated Prisma client
├── prisma/              # Database schema & migrations
│   ├── schema.prisma    # Database models
│   ├── seed.ts          # Seed script
│   └── migrations/      # Migration files
└── public/              # Static assets
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run backup` | Create database backup |
| `npm run restore` | Restore from latest backup |
| `npm run backup:list` | List all available backups |
| `npm run migrate:safe` | Safe migration with auto-backup |
| `npm run users:show` | Show all users in database |
| `npm run seed:attendance` | Seed attendance data (Jan-Feb 2026) |
| `npm run activate:employees` | Activate all employee profiles |
| `npx prisma studio` | Open Prisma Studio (database GUI) |
| `npx prisma migrate dev` | Create new migration |
| `npx prisma migrate deploy` | Apply migrations |
| `npx prisma generate` | Generate Prisma client |

## 💾 Database Backup & Restore

Protect your data with the built-in backup system:

```bash
# Create a backup
npm run backup

# List all backups
npm run backup:list

# Restore from latest backup
npm run restore

# Restore from specific backup
npm run restore backups/backup-2026-02-07T18-42-30-638Z.json
```

### Backup Best Practices

✅ Backup before database migrations: `npm run migrate:safe`  
✅ Backup before bulk data changes  
✅ Keep 30 days of backups locally  
✅ Sync backups to cloud storage (OneDrive, Google Drive, etc.)

### View Database

Open Prisma Studio to view and edit data:
```bash
npx prisma studio
```
Opens at http://localhost:5555

## 🚀 Vercel Deployment

### Cron Jobs (Auto-Attendance)

The system includes automatic cron jobs configured in `vercel.json`:

1. **Auto-Mark Attendance** - 10:30 PM IST (Mon-Sat)
2. **Auto-Checkout** - 5:15 PM IST (Mon-Sat)  
3. **Birthday Notifications** - 12:00 AM IST (Daily)

### Required Environment Variables

Add these to your Vercel project:

```bash
DATABASE_URL=your-database-url
AUTH_SECRET=your-auth-secret
CRON_SECRET=your-cron-secret  # Generate with: openssl rand -hex 32
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Deploy Steps

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

## 🔐 Google OAuth

Google login is enabled for both new and existing users:

- **Login page**: Works for existing users
- **Register page**: Creates new accounts automatically
- **Auto-verification**: Google emails are pre-verified
- **Profile completion**: New users must complete profile after first login

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT
