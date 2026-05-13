#!/bin/bash
# ============================================================
# LibraryOS — Quick Start Script
# Usage: chmod +x run_project.sh && ./run_project.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        LibraryOS — Quick Start       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Check Node.js ─────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js not found.${NC}"
  echo "  Install from: https://nodejs.org (v18 or higher)"
  exit 1
fi
NODE_VER=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VER}${NC}"

# ── Check PostgreSQL ──────────────────────────────────────────
if ! command -v psql &> /dev/null; then
  echo -e "${YELLOW}⚠  psql not found — skipping auto DB setup.${NC}"
  echo "   Create DB manually and update .env DATABASE_URL"
  DB_SKIP=true
else
  echo -e "${GREEN}✓ PostgreSQL found${NC}"
  DB_SKIP=false
fi

# ── Copy .env ─────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠  Created .env from .env.example — please review it.${NC}"
fi
source .env 2>/dev/null || true

# ── Setup Database ────────────────────────────────────────────
if [ "$DB_SKIP" = false ]; then
  echo ""
  echo -e "${BLUE}► Setting up database...${NC}"
  DB_NAME="${DB_NAME:-libraryos}"
  DB_USER="${DB_USER:-library_user}"
  DB_PASSWORD="${DB_PASSWORD:-library_pass}"

  # Create user and database (ignore errors if already exist)
  psql -U postgres -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" 2>/dev/null || true
  psql -U postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || true
  psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null || true

  # Run schema
  PGPASSWORD="${DB_PASSWORD}" psql -U "${DB_USER}" -d "${DB_NAME}" -f database/schema.sql
  echo -e "${GREEN}✓ Database ready with seed data${NC}"
fi

# ── Backend ───────────────────────────────────────────────────
echo ""
echo -e "${BLUE}► Installing backend dependencies...${NC}"
cd backend
npm install --silent
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..

# ── Frontend ──────────────────────────────────────────────────
echo ""
echo -e "${BLUE}► Installing frontend dependencies...${NC}"
cd frontend
npm install --silent
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

# ── Start servers ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  Everything is ready! Starting...${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}API:${NC}      http://localhost:4000"
echo -e "  ${CYAN}Frontend:${NC} http://localhost:3000"
echo -e "  ${CYAN}Health:${NC}   http://localhost:4000/health"
echo ""
echo -e "  ${YELLOW}Demo login credentials:${NC}"
echo -e "  Admin:     admin@library.edu     / Admin@123"
echo -e "  Librarian: librarian@library.edu / Admin@123"
echo -e "  Student:   student@library.edu   / Admin@123"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop both servers."
echo ""

# Run both servers concurrently
trap 'kill %1 %2 2>/dev/null; echo ""; echo "Servers stopped."; exit 0' INT

cd backend && node server.js &
BACKEND_PID=$!

sleep 2

cd ../frontend && npm run dev &
FRONTEND_PID=$!

wait $BACKEND_PID $FRONTEND_PID
