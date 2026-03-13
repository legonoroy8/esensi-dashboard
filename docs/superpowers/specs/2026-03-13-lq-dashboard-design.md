# LQ System Dashboard - Design Specification

**Project:** Leads Qualifier Dashboard  
**Partner:** Taktis AI x Esensi Digital  
**Date:** March 13, 2026  
**Version:** 1.0

---

## Overview

The LQ System Dashboard provides analytics and monitoring for the Leads Qualifier system. It displays lead qualification metrics, sales team performance, and generates reports for internal teams and future client access.

### Current System Context

- **Platform:** n8n-based lead qualification system
- **Infrastructure:** Hostinger VPS (KVM 4), PM2, nginx, PostgreSQL
- **WhatsApp Handler:** wasenderapi
- **Chat Handler:** Redis (multi-bubble)
- **AI Engine:** AI agent node

### Dashboard Objectives

1. Monitor lead qualification metrics per client
2. Track sales team member performance
3. Analyze lead sources and conversion
4. Generate exportable reports (CSV)
5. Support multi-client data isolation (future)

---

## System Architecture

### 3-Tier Architecture

**1. Frontend (React + Vite)**
- Port: 3001 (development) / static files (production)
- Technology: React 18, Vite, Tailwind CSS, Shadcn/ui
- Deployment: Static files served by nginx

**2. Backend (Express.js API)**
- Port: 3002 (internal, proxied via nginx)
- Technology: Node.js, Express, node-postgres
- Purpose: Database queries, authentication, CSV generation

**3. Database (PostgreSQL)**
- Existing database: `leadsqualifier`
- Connection: Backend connects with pooling (max 10 connections)
- Access: Read-only queries (Phase 1)

### Deployment Infrastructure

- **Domain:** lqdashboard.esensigroup.com
- **Location:** ~/taktis/apps/leadsqualifier-dashboard
- **Process Manager:** PM2 (backend service)
- **Web Server:** nginx (reverse proxy + static file serving)
- **SSL:** Let's Encrypt (HTTPS)

---

## Frontend Design

### Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Shadcn/ui** - Component library (Radix UI + Tailwind)
- **Recharts** - Charts and visualizations
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling with custom Taktis AI theme
- **Zustand** - Lightweight state management
- **date-fns** - Date manipulation

### Component Hierarchy

```
App
├─ Layout
│  ├─ Header
│  │  ├─ Logo + Title: "LQ System Dashboard - Taktis AI x Esensi Digital"
│  │  ├─ Dark Mode Toggle
│  │  └─ User Menu
│  └─ Main Content
│     ├─ FilterBar
│     │  ├─ ClientSelect (dropdown, searchable)
│     │  ├─ SalesRepSelect (dropdown, filtered by client)
│     │  ├─ DateRangePicker (from/to with presets)
│     │  └─ RefreshButton
│     ├─ AnalyticsSection
│     │  ├─ MetricCard - Qualified Leads (count with trend)
│     │  ├─ MetricCard - Cold Call List (count)
│     │  ├─ MetricCard - Total Leads (count)
│     │  ├─ MetricCard - Avg Claim Time (HH:MM:SS)
│     │  ├─ MetricCard - Slow Claims >30min (count with warning)
│     │  └─ SourceChart - Leads by Source (bar/pie chart)
│     └─ LeadsTable
│        ├─ TableHeader (with CSV Export button)
│        ├─ DataTable (sortable, paginated)
│        └─ Pagination (50 rows per page)
```

### State Management (Zustand Store)

**Store Structure:**
```javascript
{
  // Filters
  filters: {
    clientId: null,
    salesRepId: null,
    startDate: null,
    endDate: null
  },
  
  // Data
  analytics: {
    qualifiedLeads: 0,
    coldCallLeads: 0,
    totalLeads: 0,
    leadsBySource: {},
    avgClaimTime: "00:00:00",
    slowClaimCount: 0
  },
  
  leads: {
    data: [],
    pagination: { total: 0, page: 1, pages: 1 }
  },
  
  // Reference data
  clients: [],
  salesReps: [],
  
  // UI state
  loading: false,
  error: null,
  darkMode: false
}
```

### Theming (Taktis AI Brand)

**Color Palette:**
- Primary: `#00bcd4` (cyan - smart, digital)
- Dark Base: `#0f0f0f` (elegant, strong)
- Accent 1: `#8c52ff` (purple - innovative)
- Accent 2: `#ff4c4c` (red - urgency, CTA)
- Neutral: `#d1d5db` (soft contrast)

**Light Mode (Default):**
- Background: `#ffffff`
- Surface: `#f9fafb`
- Text Primary: `#1f2937`
- Text Secondary: `#6b7280`
- Success: `#10b981`
- Warning: `#f59e0b`

**Dark Mode:**
- Background: `#0f0f0f` (Taktis dark base)
- Surface: `#1a1a1a`
- Text Primary: `#f9fafb`
- Text Secondary: `#9ca3af`

**Status Colors:**
- `cold_call` → Red badge (#ff4c4c)
- `qualified_unclaimed` → Orange badge (#f59e0b)
- `claimed` → Green badge (#10b981)

### Responsive Design

- **Desktop (>1024px):** 3-column grid for analytics cards
- **Tablet (768-1023px):** 2-column grid
- **Mobile (<768px):** Single column, scrollable table cards

---

## Backend Design

### Technology Stack

- **Express.js** - Web framework
- **node-postgres (pg)** - PostgreSQL client with pooling
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers
- **dotenv** - Environment variable management

### API Endpoints

#### Authentication

```
POST /api/auth/login
Body: { username, password }
Response: { token, user: { name, role } }
```

#### Analytics

```
GET /api/analytics
Query Params: client_id, sales_rep_id, start_date, end_date
Response: {
  qualifiedLeads: 45,
  coldCallLeads: 12,
  totalLeads: 57,
  leadsBySource: { instagram: 30, google: 27 },
  avgClaimTime: "00:45:32",
  slowClaimCount: 8
}
```

#### Leads Data

```
GET /api/leads
Query Params: client_id, sales_rep_id, start_date, end_date, page, limit
Response: {
  data: [
    {
      id, whatsapp, name, interest, status, source,
      created_at, qualified_at, claimed_at,
      sales_rep: { id, name, whatsapp } | null,
      claim_duration: "00:32:15" | null
    }
  ],
  pagination: { total: 150, page: 1, limit: 50, pages: 3 }
}
```

#### Export

```
GET /api/export/csv
Query Params: client_id, sales_rep_id, start_date, end_date
Response: CSV file download
Filename: leads-export-YYYY-MM-DD.csv
Columns: Lead ID, Name, WhatsApp, Source, Status, Created, 
         Qualified, Claimed By, Claim Time, Duration to Claim
```

#### Reference Data

```
GET /api/clients
Response: [{ id, name }, ...]

GET /api/sales-reps?client_id=X
Response: [{ id, name, whatsapp, active }, ...]
```

#### Health Check

```
GET /api/health
Response: { status: "ok", timestamp: "..." }
```

### Database Schema

**Tables Used:**

1. **clients** - Client organizations
   - `id` (varchar, PK)
   - `name` (text)
   - `created_at` (timestamp)

2. **sales_reps** - Sales team members
   - `id` (varchar, PK)
   - `client_id` (varchar, FK → clients)
   - `name` (text)
   - `whatsapp` (varchar)
   - `active` (boolean)
   - `created_at` (timestamp)
   - `weight_rr_counter` (integer) - Round-robin distribution

3. **leads** - Lead records
   - `id` (varchar, PK)
   - `client_id` (varchar, FK → clients)
   - `source` (text) - Values: instagram, google
   - `whatsapp` (varchar)
   - `name` (text)
   - `interest` (text)
   - `status` (text) - Values: cold_call, qualified_unclaimed, claimed
   - `created_at` (timestamp) - Lead enters system
   - `qualified_at` (timestamp) - AI qualifies lead
   - `claimed_by` (varchar, FK → sales_reps)
   - `claimed_at` (timestamp) - Sales rep responds
   - `first_message` (text) - Future field

4. **lead_questions** - Questions asked by leads
   - `id` (varchar, PK)
   - `lead_id` (varchar, FK → leads)
   - `question` (text)
   - `category` (text)
   - `created_at` (timestamp)

### Key SQL Queries

**Qualified Leads Count:**
```sql
SELECT COUNT(*) FROM leads 
WHERE status IN ('qualified_unclaimed', 'claimed')
  AND client_id = $1 
  AND created_at >= $2 AND created_at <= $3;
```

**Average Claim Time:**
```sql
SELECT AVG(claimed_at - qualified_at) FROM leads
WHERE claimed_at IS NOT NULL 
  AND client_id = $1
  AND created_at >= $2 AND created_at <= $3;
```

**Slow Claims (>30 minutes):**
```sql
SELECT COUNT(*) FROM leads
WHERE claimed_at - qualified_at > interval '30 minutes'
  AND client_id = $1
  AND created_at >= $2 AND created_at <= $3;
```

**Leads Table with Sales Rep:**
```sql
SELECT 
  l.id, l.whatsapp, l.name, l.interest, l.status, l.source,
  l.created_at, l.qualified_at, l.claimed_at,
  EXTRACT(EPOCH FROM (l.claimed_at - l.qualified_at)) as claim_duration_seconds,
  sr.id as sales_rep_id, 
  sr.name as sales_rep_name, 
  sr.whatsapp as sales_rep_whatsapp
FROM leads l
LEFT JOIN sales_reps sr ON l.claimed_by = sr.id
WHERE l.client_id = $1
  AND ($2::varchar IS NULL OR l.claimed_by = $2)
  AND l.created_at >= $3 AND l.created_at <= $4
ORDER BY l.created_at DESC
LIMIT $5 OFFSET $6;
```

### Authentication Strategy

**Phase 1: Simple Internal Auth**
- Hardcoded credentials in environment variables
- Single admin account for internal team
- JWT token with 24-hour expiration
- Token stored in localStorage (frontend)

**Phase 2: Multi-Tenant Auth (Future)**
- Database table for users with client associations
- Role-based access control (admin, client_user)
- Client users filtered to only see their data
- Password hashing with bcrypt

---

## Data Flow

### Initial Dashboard Load

1. User visits `lqdashboard.esensigroup.com`
2. Nginx serves React app (static files)
3. React checks for JWT token in localStorage
4. If no token → show login page
5. If token exists → parallel API calls:
   - `GET /api/clients` (populate client filter)
   - Auto-select last used client (from localStorage)
   - `GET /api/analytics?client_id=X`
   - `GET /api/leads?client_id=X&page=1`
   - `GET /api/sales-reps?client_id=X`
6. Display dashboard with data

### Filter Application

1. User changes filters (client, sales rep, date range)
2. Zustand store updates filter state (debounced 300ms)
3. Trigger API calls:
   - `GET /api/analytics?[filters]`
   - `GET /api/leads?[filters]&page=1`
4. Backend validates JWT, builds parameterized SQL queries
5. PostgreSQL executes queries
6. Backend returns JSON response
7. Frontend updates UI (analytics cards, charts, table)

### CSV Export

1. User clicks "Export CSV" button
2. Frontend calls `GET /api/export/csv?[current_filters]`
3. Backend runs same query as leads table (no pagination)
4. Converts result to CSV format
5. Sets response headers:
   - `Content-Type: text/csv`
   - `Content-Disposition: attachment; filename=leads-export-YYYY-MM-DD.csv`
6. Browser downloads CSV file

### Manual Refresh

1. User clicks refresh button (or reloads page)
2. Same flow as initial load with current filter state
3. Loading skeletons shown during fetch

---

## Security & Performance

### Security Measures

- JWT authentication on all protected routes
- CORS restricted to `lqdashboard.esensigroup.com`
- Helmet.js security headers
- Rate limiting on login endpoint
- Parameterized SQL queries (prevent injection)
- `.env` files excluded from git
- Database connection string in environment variables
- Read-only database access (Phase 1)

### Performance Optimizations

- Connection pooling (max 10 connections)
- Pagination on leads table (50 rows per page)
- Debounced filter changes (300ms)
- Static asset caching (1 year)
- Gzip compression on nginx
- API response caching headers (no-cache)
- Lazy loading for chart components

---

## Project Structure

```
~/taktis/apps/leadsqualifier-dashboard/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── filters/
│   │   │   │   ├── ClientSelect.jsx
│   │   │   │   ├── SalesRepSelect.jsx
│   │   │   │   ├── DateRangePicker.jsx
│   │   │   │   └── FilterBar.jsx
│   │   │   ├── analytics/
│   │   │   │   ├── MetricCard.jsx
│   │   │   │   ├── SourceChart.jsx
│   │   │   │   └── AnalyticsSection.jsx
│   │   │   ├── table/
│   │   │   │   ├── LeadsTable.jsx
│   │   │   │   └── StatusBadge.jsx
│   │   │   └── ui/ (Shadcn components)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Login.jsx
│   │   ├── store/
│   │   │   └── dashboardStore.js
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── analytics.js
│   │   │   ├── leads.js
│   │   │   └── export.js
│   │   ├── controllers/
│   │   │   ├── analyticsController.js
│   │   │   ├── leadsController.js
│   │   │   └── authController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── db/
│   │   │   └── index.js (connection pool)
│   │   └── server.js
│   ├── package.json
│   └── .env
├── docs/
│   ├── superpowers/
│   │   └── specs/
│   │       └── 2026-03-13-lq-dashboard-design.md
│   └── DEPLOYMENT_INSTRUCTIONS.md
├── ecosystem.config.js (PM2 config)
├── .gitignore
└── README.md
```

---

## Environment Variables

### Frontend `.env`

```env
VITE_API_URL=/api
```

### Backend `.env`

```env
# Server
NODE_ENV=production
PORT=3002

# Database
DATABASE_URL=postgresql://lq_user:password@localhost:5432/leadsqualifier
DB_POOL_MAX=10

# Security
JWT_SECRET=your-secure-random-secret-here
CORS_ORIGIN=https://lqdashboard.esensigroup.com

# Authentication (Phase 1)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

---

## Deployment Configuration

### PM2 Ecosystem File (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'lq-dashboard-backend',
      cwd: './backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '~/taktis/logs/lq-dashboard-backend-error.log',
      out_file: '~/taktis/logs/lq-dashboard-backend-out.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

### Nginx Configuration

**File:** `/etc/nginx/sites-available/lqdashboard.esensigroup.com`

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name lqdashboard.esensigroup.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name lqdashboard.esensigroup.com;
    
    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/lqdashboard.esensigroup.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lqdashboard.esensigroup.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Frontend Static Files
    root /home/your-user/taktis/apps/leadsqualifier-dashboard/frontend/dist;
    index index.html;
    
    # Gzip Compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_vary on;
    
    # API Reverse Proxy
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Frontend SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## Future Enhancements (Phase 2+)

### Multi-Tenant Client Access

- **Users table** with client associations
- **Role-based access** (admin, client_user)
- **Client isolation** via JWT claims + SQL filters
- **Per-client branding** (logo, colors)

### Light Editing Features

- Reassign leads to different sales reps
- Update lead status manually
- Add notes to leads
- Mark leads for follow-up

### Advanced Analytics

- Conversion funnel visualization
- Sales rep comparison charts
- Time-series trends (daily/weekly/monthly)
- Lead quality scoring

### Additional Features

- Real-time notifications (websockets)
- Email report scheduling
- PDF export with charts
- Mobile app (React Native)
- Webhook integrations

---

## Monitoring & Maintenance

### Logs

**PM2 Logs:**
```bash
pm2 logs lq-dashboard-backend
pm2 logs lq-dashboard-backend --lines 100
```

**Nginx Logs:**
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Monitoring Commands

```bash
# PM2 Status
pm2 status
pm2 monit

# Nginx Status
sudo systemctl status nginx

# Database Connections
psql -U lq_user -d leadsqualifier -c "SELECT count(*) FROM pg_stat_activity;"
```

### Backup Strategy

- Database: Automated daily PostgreSQL backups
- Code: Git repository (remote backup)
- Logs: Rotated weekly, kept for 30 days

---

## Success Criteria

### Phase 1 (MVP)

- ✅ Dashboard accessible at lqdashboard.esensigroup.com
- ✅ Simple authentication for internal team
- ✅ All 6 analytics metrics displayed correctly
- ✅ Leads table with sales rep info
- ✅ Filter by client, sales rep, date range
- ✅ CSV export respecting filters
- ✅ Light/dark mode toggle
- ✅ Responsive on desktop and tablet
- ✅ Page load time < 2 seconds
- ✅ VPS resource usage < 200MB RAM

### Phase 2 (Client Access)

- Multi-tenant authentication
- Client-specific data isolation
- Light editing capabilities
- PDF export functionality

---

**End of Design Specification**
