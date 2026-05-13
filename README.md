# 📚 LibraryOS — Smart AI-Powered Library Management System

> A complete, production-ready full-stack application for university library management with AI recommendations, real-time analytics, chatbot assistant, and community features.

![Version](https://img.shields.io/badge/version-1.0.0-indigo)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Installation](#installation)
7. [Database Setup](#database-setup)
8. [Running the Application](#running-the-application)
9. [Environment Variables](#environment-variables)
10. [API Documentation](#api-documentation)
11. [Default Accounts](#default-accounts)
12. [Docker Deployment](#docker-deployment)
13. [Cloud Deployment](#cloud-deployment)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

LibraryOS is a full-stack Smart Library Management System designed for universities. It combines traditional library operations (book cataloging, issuing, returns) with modern AI-powered features including personalized recommendations, a natural language chatbot, reading progress tracking, and an admin analytics dashboard.

**This project is structured as a real-world SaaS product** and is suitable for top-grade university final year projects.

---

## ✨ Features

### Core Modules
| Module | Description |
|--------|-------------|
| 🔐 **Authentication** | JWT-based login/register with role-based access (Admin / Librarian / Student) |
| 📚 **Book Management** | Full CRUD, ISBN lookup, categories, availability tracking, shelf locations |
| 📋 **Issue & Return** | Borrow with 14-day loan period, automatic fine calculation ($0.50/day overdue) |
| 📅 **Reservations** | Queue-based book reservation with automated email notification |
| ⭐ **Reviews & Ratings** | Star ratings, written reviews, helpful votes |
| 📖 **Reading Progress** | Track pages read, set yearly goals, completion status |
| 🏫 **Study Room Booking** | Calendar-based scheduling with conflict detection |
| 📊 **Admin Analytics** | Charts, borrowing trends, top books, user stats |
| 📦 **Book Marketplace** | Peer-to-peer book donation and exchange platform |
| 🔔 **Notifications** | In-app + email alerts for due dates and availability |

### AI Features
- 🤖 **AI Chatbot** — Natural language queries ("find books about machine learning")
- 🎯 **Smart Recommendations** — Collaborative filtering based on reading history
- 📈 **Reading Analytics** — Personalized reading goal insights

---

## 🛠 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 + React 18 | UI framework with SSR |
| Styling | Tailwind CSS | Utility-first styling |
| HTTP Client | Axios | API communication |
| Charts | Chart.js + react-chartjs-2 | Analytics visualizations |
| Backend | Node.js + Express.js | REST API server |
| Auth | JSON Web Tokens + bcryptjs | Authentication & security |
| Database | PostgreSQL 15 | Primary data store |
| DB ORM | pg (node-postgres) | Database queries |
| Email | Nodemailer | Due-date notifications |
| Cron | node-cron | Scheduled jobs |
| Security | Helmet + express-rate-limit | HTTP hardening |
| Container | Docker + Docker Compose | Deployment |

---

## 📁 Project Structure

```
library-management-system/
│
├── frontend/                          # Next.js frontend
│   ├── pages/                         # Next.js pages (routes)
│   │   ├── index.js                   # Landing page
│   │   ├── login.js                   # Login page
│   │   ├── register.js                # Registration page
│   │   ├── dashboard.js               # Student dashboard
│   │   ├── progress.js                # Reading progress
│   │   ├── study-rooms.js             # Study room booking
│   │   ├── books/
│   │   │   ├── index.js               # Book catalog
│   │   │   └── [id].js                # Book detail
│   │   └── admin/
│   │       └── index.js               # Admin analytics
│   ├── components/
│   │   ├── layout/Layout.js           # Sidebar layout
│   │   ├── books/BookCard.js          # Book card component
│   │   ├── dashboard/Chatbot.js       # AI chatbot widget
│   │   └── ui/StatCard.js             # Metric stat card
│   ├── hooks/useAuth.js               # Auth hook
│   ├── lib/api.js                     # Axios API client
│   ├── styles/globals.css             # Global styles
│   ├── package.json
│   ├── next.config.js
│   └── tailwind.config.js
│
├── backend/                           # Express.js API
│   ├── server.js                      # Main server entry point
│   ├── routes/                        # Route definitions
│   │   ├── auth.js
│   │   ├── books.js
│   │   ├── borrow.js
│   │   ├── reservations.js
│   │   ├── reviews.js
│   │   ├── progress.js
│   │   ├── rooms.js
│   │   ├── notifications.js
│   │   ├── analytics.js
│   │   ├── marketplace.js
│   │   ├── chatbot.js
│   │   └── users.js
│   ├── controllers/                   # Business logic
│   │   ├── authController.js
│   │   ├── booksController.js
│   │   ├── borrowController.js
│   │   ├── analyticsController.js
│   │   ├── chatbotController.js
│   │   └── ... (others)
│   ├── middleware/
│   │   └── auth.js                    # JWT + role middleware
│   ├── models/
│   │   └── db.js                      # PostgreSQL pool
│   └── package.json
│
├── database/
│   └── schema.sql                     # Full PostgreSQL schema + seed data
│
├── docker/
│   ├── Dockerfile                     # Backend Docker image
│   └── docker-compose.yml             # Full stack orchestration
│
├── .env.example                       # Environment variable template
├── run_project.sh                     # One-click start script
└── README.md                          # This file
```

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18 or higher | https://nodejs.org |
| **npm** | v9 or higher | Included with Node.js |
| **PostgreSQL** | v14 or higher | https://postgresql.org |
| **Git** | Any recent | https://git-scm.com |

### Checking your versions
```bash
node --version    # Should be v18+
npm --version     # Should be v9+
psql --version    # Should be v14+
```

---

## 🚀 Installation

### Option A — Quickstart (Recommended)

```bash
# 1. Extract the zip file
unzip library-management-system.zip
cd library-management-system

# 2. Run the automated setup script
chmod +x run_project.sh
./run_project.sh
```

The script will:
- Verify Node.js and PostgreSQL are installed
- Create `.env` from `.env.example`
- Create the database and user
- Run the SQL schema and seed data
- Install all dependencies
- Start both servers

Open http://localhost:3000 in your browser.

---

### Option B — Manual Step-by-Step

#### Step 1 — Configure environment

```bash
# Copy the environment template
cp .env.example .env
```

Open `.env` and update the values (especially `DATABASE_URL` and `JWT_SECRET`).

---

#### Step 2 — Database setup

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Inside psql, run these commands:
CREATE USER library_user WITH PASSWORD 'library_pass';
CREATE DATABASE libraryos OWNER library_user;
GRANT ALL PRIVILEGES ON DATABASE libraryos TO library_user;
\q

# Run the schema and seed data
psql -U library_user -d libraryos -f database/schema.sql
```

Expected output:
```
DROP TABLE
...
CREATE TABLE
...
INSERT 0 3      ← users
INSERT 0 15     ← books
COMMIT
```

---

#### Step 3 — Install backend dependencies

```bash
cd backend
npm install
```

---

#### Step 4 — Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

#### Step 5 — Run the backend

```bash
cd backend
npm run dev
```

You should see:
```
🚀  LibraryOS API  →  http://localhost:4000
📊  Environment    →  development
```

---

#### Step 6 — Run the frontend (new terminal)

```bash
cd frontend
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:   http://localhost:3000
```

---

#### Step 7 — Open the application

Navigate to **http://localhost:3000** in your browser.

---

## 🗄️ Database Setup

The `database/schema.sql` file contains the complete database schema and seed data.

### Tables
| Table | Description |
|-------|-------------|
| `users` | Students, librarians, and admins |
| `books` | Book catalog with availability |
| `transactions` | Borrow and return records |
| `reservations` | Book reservation queue |
| `reviews` | User reviews and ratings |
| `reading_progress` | Per-user reading progress |
| `notifications` | In-app alerts |
| `study_rooms` | Study room bookings |
| `donations` | Book donation marketplace |

### Re-running the schema (reset database)
```bash
# WARNING: This drops all tables and re-creates them
psql -U library_user -d libraryos -f database/schema.sql
```

### Connecting with a GUI
Use [pgAdmin](https://pgadmin.org) or [TablePlus](https://tableplus.com):
- Host: `localhost`
- Port: `5432`
- Database: `libraryos`
- User: `library_user`
- Password: `library_pass`

---

## ⚙️ Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string | `postgresql://user:pass@localhost:5432/libraryos` |
| `JWT_SECRET` | ✅ | Secret key for signing JWT tokens | Any long random string |
| `FRONTEND_URL` | ✅ | CORS allowed origin | `http://localhost:3000` |
| `PORT` | ❌ | Backend port (default: 4000) | `4000` |
| `NODE_ENV` | ❌ | Environment mode | `development` or `production` |
| `EMAIL_USER` | ❌ | Gmail address for notifications | `library@gmail.com` |
| `EMAIL_PASS` | ❌ | Gmail App Password | 16-character app password |
| `NEXT_PUBLIC_API_URL` | ✅ | Frontend API base URL | `http://localhost:4000/api` |

### Generating a JWT secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🔌 API Documentation

**Base URL:** `http://localhost:4000/api`

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, get JWT |
| GET | `/auth/me` | ✅ | Get current user |

### Books
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/books` | ❌ | List books (search, filter, paginate) |
| GET | `/books/categories` | ❌ | Get all categories |
| GET | `/books/:id` | ❌ | Get single book with reviews |
| POST | `/books` | Admin/Lib | Create book |
| PUT | `/books/:id` | Admin/Lib | Update book |
| DELETE | `/books/:id` | Admin | Delete book |

### Borrowing
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/borrow` | ✅ | Borrow a book |
| PUT | `/borrow/return/:id` | ✅ | Return a book |
| GET | `/borrow/my` | ✅ | My borrow history |
| GET | `/borrow/active` | Admin/Lib | All active loans |

### Other Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/chatbot/recommendations` | ✅ | AI book recommendations |
| POST | `/chatbot` | ✅ | AI chatbot message |
| GET | `/analytics/dashboard` | Admin/Lib | Full admin analytics |
| GET | `/reading-progress` | ✅ | My reading progress |
| POST | `/reading-progress` | ✅ | Update reading progress |
| GET | `/study-rooms/availability?date=` | ✅ | Check availability |
| POST | `/study-rooms` | ✅ | Book a study room |
| GET | `/notifications` | ✅ | My notifications |
| GET | `/marketplace` | ❌ | List donations |
| POST | `/marketplace` | ✅ | Donate a book |
| POST | `/reserve` | ✅ | Reserve a book |

### Health Check
```bash
curl http://localhost:4000/health
# {"status":"ok","version":"1.0.0","timestamp":"..."}
```

---

## 👤 Default Accounts

After running `schema.sql`, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| 🔴 Admin | `admin@library.edu` | `Admin@123` |
| 🟡 Librarian | `librarian@library.edu` | `Admin@123` |
| 🟢 Student | `student@library.edu` | `Admin@123` |

> **Security note:** Change all passwords immediately in any non-local environment.

---

## 🐳 Docker Deployment

### Full stack with Docker Compose

```bash
# Copy environment file
cp .env.example .env

# Start all services (database + backend + frontend)
cd docker
docker-compose up -d

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop everything
docker-compose down

# Stop and remove volumes (full reset)
docker-compose down -v
```

Services:
- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:4000
- **PostgreSQL** → localhost:5432

---

## ☁️ Cloud Deployment

### Frontend → Vercel (free)

```bash
# Install Vercel CLI
npm install -g vercel

cd frontend
vercel

# Set environment variable in Vercel dashboard:
# NEXT_PUBLIC_API_URL = https://your-backend.onrender.com/api
```

### Backend → Render (free tier)

1. Push to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo, set root directory to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add all environment variables from `.env`

### Database → Supabase or Render PostgreSQL

1. Create a PostgreSQL database on Render or Supabase
2. Copy the connection string
3. Set `DATABASE_URL` in your backend service
4. Run the schema: copy-paste `database/schema.sql` in the database console

---

## 🔧 Troubleshooting

### ❌ "Cannot connect to database"
```bash
# Check PostgreSQL is running
sudo service postgresql status
# or on macOS:
brew services list | grep postgresql

# Start PostgreSQL if stopped
sudo service postgresql start
# or:
brew services start postgresql@15
```

### ❌ "Port 4000 already in use"
```bash
# Find and kill the process using port 4000
lsof -ti:4000 | xargs kill -9
# For port 3000:
lsof -ti:3000 | xargs kill -9
```

### ❌ "Module not found" / Missing dependencies
```bash
# Re-install backend
cd backend && rm -rf node_modules && npm install

# Re-install frontend
cd frontend && rm -rf node_modules && npm install
```

### ❌ "JWT_SECRET is not defined"
Make sure `.env` exists in the root directory. If missing:
```bash
cp .env.example .env
# Then start the backend from the root or set env vars inline:
JWT_SECRET=mysecret DATABASE_URL=postgresql://... node server.js
```

### ❌ "relation does not exist" (PostgreSQL)
The schema hasn't been applied. Run:
```bash
psql -U library_user -d libraryos -f database/schema.sql
```

### ❌ CORS errors in browser
Ensure `FRONTEND_URL` in `.env` matches exactly what's in your browser address bar (including port):
```
FRONTEND_URL=http://localhost:3000
```

### ❌ Next.js build fails
```bash
cd frontend
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 📝 Development Tips

### Watch logs in real time
```bash
# Backend logs
cd backend && npm run dev

# Frontend with hot reload
cd frontend && npm run dev
```

### Reset the database completely
```bash
psql -U postgres -c "DROP DATABASE libraryos;"
psql -U postgres -c "CREATE DATABASE libraryos OWNER library_user;"
psql -U library_user -d libraryos -f database/schema.sql
```

### Test the API with curl
```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@library.edu","password":"Admin@123"}'

# Get books (public)
curl http://localhost:4000/api/books

# Get recommendations (requires token from login)
curl http://localhost:4000/api/chatbot/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📄 License

MIT License — Free for educational and commercial use.

---

*Built with ❤️ as a university project — LibraryOS 2024*
