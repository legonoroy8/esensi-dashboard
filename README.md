# LQ Dashboard - Taktis AI × Esensi Digital

Full-stack dashboard for monitoring leads qualifier analytics and sales team performance.

## Project Structure

```
lq-dashboard/
├── backend/          # Express.js API server
├── frontend/         # React + Vite application
├── docs/             # Documentation and specs
├── ecosystem.config.js # PM2 configuration
└── DEPLOYMENT_INSTRUCTIONS.md
```

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

Backend runs on `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Features

- ✅ Real-time analytics metrics
- ✅ Client and sales rep filtering
- ✅ Date range filtering
- ✅ Interactive charts (Recharts)
- ✅ Paginated leads table
- ✅ CSV export functionality
- ✅ JWT authentication
- ✅ Responsive dark theme design
- ✅ Taktis AI branding

## Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Zustand (state management)
- React Router
- Recharts (data visualization)
- Axios (HTTP client)

**Backend:**
- Node.js + Express
- PostgreSQL
- JWT authentication
- CORS, Helmet security

## Default Login

- Username: `admin`
- Password: `changeme`

⚠️ **Change these in production!**

## Deployment

See [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md) for detailed VPS deployment instructions.

## Documentation

- [Design Specification](./docs/superpowers/specs/2026-03-13-lq-dashboard-design.md)
- [Implementation Plan](./docs/superpowers/plans/2026-03-13-lq-dashboard.md)

## Team

**Client:** Esensi Digital  
**Developer:** Taktis AI  
**Tech Lead:** Lego Noroy (legonoroy@taktis.in)

## License

Proprietary - Taktis AI × Esensi Digital
