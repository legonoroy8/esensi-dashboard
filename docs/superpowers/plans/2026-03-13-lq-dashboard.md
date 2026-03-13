# LQ Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack analytics dashboard for the LQ (Leads Qualifier) system with filtering, metrics, and CSV export capabilities.

**Architecture:** 3-tier architecture with React+Vite frontend, Express.js backend API, and PostgreSQL database. Frontend served via nginx with API proxying. Backend runs on PM2.

**Tech Stack:** React 18, Vite, Tailwind CSS, Shadcn/ui, Recharts, Zustand, Express.js, node-postgres, JWT authentication, PM2, nginx

---

## File Structure Overview

### Backend Files
```
backend/
├── src/
│   ├── server.js                    # Express app entry point
│   ├── config/
│   │   └── database.js              # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication middleware
│   │   └── errorHandler.js          # Global error handler
│   ├── routes/
│   │   ├── auth.js                  # Login routes
│   │   ├── analytics.js             # Analytics metrics routes
│   │   ├── leads.js                 # Leads data routes
│   │   ├── clients.js               # Client reference data
│   │   └── export.js                # CSV export routes
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   ├── analyticsController.js   # Analytics queries
│   │   ├── leadsController.js       # Leads queries
│   │   └── exportController.js      # CSV generation
│   └── utils/
│       ├── csvGenerator.js          # CSV formatting utility
│       └── timeFormatter.js         # Time duration formatting
├── tests/
│   ├── auth.test.js
│   ├── analytics.test.js
│   ├── leads.test.js
│   └── export.test.js
├── package.json
└── .env.example
```

### Frontend Files
```
frontend/
├── src/
│   ├── main.jsx                     # React entry point
│   ├── App.jsx                      # Root component with routing
│   ├── pages/
│   │   ├── Login.jsx                # Login page
│   │   └── Dashboard.jsx            # Main dashboard page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx           # App header with title, theme toggle
│   │   │   └── Layout.jsx           # Main layout wrapper
│   │   ├── filters/
│   │   │   ├── ClientSelect.jsx     # Client dropdown filter
│   │   │   ├── SalesRepSelect.jsx   # Sales rep dropdown filter
│   │   │   ├── DateRangePicker.jsx  # Date range filter
│   │   │   └── FilterBar.jsx        # Filter container component
│   │   ├── analytics/
│   │   │   ├── MetricCard.jsx       # Individual metric display card
│   │   │   ├── SourceChart.jsx      # Leads by source visualization
│   │   │   └── AnalyticsSection.jsx # Analytics container
│   │   ├── table/
│   │   │   ├── LeadsTable.jsx       # Main data table component
│   │   │   ├── StatusBadge.jsx      # Status indicator component
│   │   │   └── Pagination.jsx       # Table pagination
│   │   └── ui/                      # Shadcn/ui components (generated)
│   ├── store/
│   │   └── dashboardStore.js        # Zustand state management
│   ├── api/
│   │   └── client.js                # API client with axios
│   ├── utils/
│   │   ├── formatters.js            # Date/time/number formatters
│   │   └── auth.js                  # JWT token management
│   ├── lib/
│   │   └── utils.js                 # Shadcn utility functions
│   └── styles/
│       └── globals.css              # Global styles with Tailwind
├── public/
│   └── favicon.ico
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

### Configuration Files
```
ecosystem.config.js                  # PM2 configuration
.gitignore                           # Already exists
README.md
```

---

## Chunk 1: Project Setup & Backend Foundation

### Task 1: Initialize Backend Structure

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `backend/src/server.js`

- [ ] **Step 1: Create backend directory and initialize npm**

```bash
mkdir -p backend/src/{config,middleware,routes,controllers,utils,tests}
cd backend
npm init -y
```

- [ ] **Step 2: Install backend dependencies**

```bash
npm install express cors helmet dotenv pg jsonwebtoken bcrypt
npm install --save-dev jest supertest @types/jest nodemon
```

- [ ] **Step 3: Create .env.example file**

```env
# Server
NODE_ENV=development
PORT=3002

# Database
DATABASE_URL=postgresql://lq_user:password@localhost:5432/leadsqualifier
DB_POOL_MAX=10

# Security
JWT_SECRET=your-secret-here
CORS_ORIGIN=http://localhost:5173

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
```

- [ ] **Step 4: Update package.json with scripts**

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch"
  },
  "type": "module"
}
```

- [ ] **Step 5: Create basic server.js**

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});

export default app;
```

- [ ] **Step 6: Test server starts**

```bash
npm run dev
```
Expected: `✓ Server running on port 3002`

- [ ] **Step 7: Test health endpoint**

```bash
curl http://localhost:3002/api/health
```
Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat: initialize backend structure with Express server

- Set up Express with security middleware
- Add health check endpoint
- Configure npm scripts

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 2: Database Connection Pool

**Files:**
- Create: `backend/src/config/database.js`
- Create: `backend/tests/database.test.js`

- [ ] **Step 1: Write database connection test**

```javascript
// backend/tests/database.test.js
import { getPool, query } from '../src/config/database.js';

describe('Database Connection', () => {
  test('should connect to database', async () => {
    const result = await query('SELECT 1 as test');
    expect(result.rows[0].test).toBe(1);
  });

  test('should handle query errors', async () => {
    await expect(query('INVALID SQL')).rejects.toThrow();
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.end();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
npm test database.test.js
```
Expected: FAIL - module not found

- [ ] **Step 3: Implement database connection pool**

```javascript
// backend/src/config/database.js
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool;

export const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }
  return pool;
};

export const query = async (text, params) => {
  const pool = getPool();
  return pool.query(text, params);
};

export const getClient = async () => {
  const pool = getPool();
  return pool.connect();
};
```

- [ ] **Step 4: Update server.js to test database connection**

```javascript
// Add after imports in server.js
import { query } from './config/database.js';

// Add before app.listen()
query('SELECT NOW()')
  .then(() => console.log('✓ Database connected'))
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  });
```

- [ ] **Step 5: Run database test**

```bash
npm test database.test.js
```
Expected: PASS

- [ ] **Step 6: Test server with database**

```bash
npm run dev
```
Expected: `✓ Database connected` then `✓ Server running on port 3002`

- [ ] **Step 7: Commit**

```bash
git add backend/src/config/ backend/tests/
git commit -m "feat: add PostgreSQL connection pool

- Implement connection pooling with pg
- Add database query wrapper
- Test database connectivity

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 3: JWT Authentication Middleware

**Files:**
- Create: `backend/src/middleware/auth.js`
- Create: `backend/tests/auth.middleware.test.js`

- [ ] **Step 1: Write auth middleware test**

```javascript
// backend/tests/auth.middleware.test.js
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../src/middleware/auth.js';

describe('Authentication Middleware', () => {
  const mockReq = (token) => ({
    headers: { authorization: token ? `Bearer ${token}` : undefined }
  });
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };
  const mockNext = jest.fn();

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockNext.mockClear();
  });

  test('should authenticate valid token', () => {
    const token = jwt.sign({ username: 'admin' }, 'test-secret');
    const req = mockReq(token);
    const res = mockRes();

    authenticateToken(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toEqual({ username: 'admin' });
  });

  test('should reject missing token', () => {
    const req = mockReq(null);
    const res = mockRes();

    authenticateToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should reject invalid token', () => {
    const req = mockReq('invalid-token');
    const res = mockRes();

    authenticateToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test auth.middleware.test.js
```
Expected: FAIL - module not found

- [ ] **Step 3: Implement auth middleware**

```javascript
// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test auth.middleware.test.js
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/auth.js backend/tests/auth.middleware.test.js
git commit -m "feat: add JWT authentication middleware

- Implement token verification
- Add token generation utility
- Test auth middleware with valid/invalid tokens

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 4: Error Handler Middleware

**Files:**
- Create: `backend/src/middleware/errorHandler.js`

- [ ] **Step 1: Implement error handler middleware**

```javascript
// backend/src/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

- [ ] **Step 2: Add error handler to server.js**

```javascript
// Add to server.js after routes (before app.listen)
import { errorHandler } from './middleware/errorHandler.js';

// ... routes ...

app.use(errorHandler);
```

- [ ] **Step 3: Test error handler**

```bash
# Add a test route in server.js temporarily
app.get('/api/test-error', (req, res) => {
  throw new Error('Test error');
});

npm run dev
curl http://localhost:3002/api/test-error
```
Expected: JSON response with error message

- [ ] **Step 4: Remove test route and commit**

```bash
git add backend/src/middleware/errorHandler.js backend/src/server.js
git commit -m "feat: add global error handler middleware

- Implement error handler with status codes
- Include stack trace in development mode

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 5: Authentication Controller & Routes

**Files:**
- Create: `backend/src/controllers/authController.js`
- Create: `backend/src/routes/auth.js`
- Create: `backend/tests/auth.test.js`

- [ ] **Step 1: Write auth controller test**

```javascript
// backend/tests/auth.test.js
import request from 'supertest';
import app from '../src/server.js';

describe('POST /api/auth/login', () => {
  beforeAll(() => {
    process.env.ADMIN_USERNAME = 'testadmin';
    process.env.ADMIN_PASSWORD = 'testpass';
  });

  test('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'testpass' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toEqual({
      name: 'testadmin',
      role: 'admin'
    });
  });

  test('should reject incorrect password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'wrongpass' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  test('should reject missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin' });

    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test auth.test.js
```
Expected: FAIL - route not found

- [ ] **Step 3: Implement auth controller**

```javascript
// backend/src/controllers/authController.js
import { generateToken } from '../middleware/auth.js';

export const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Phase 1: Simple hardcoded authentication
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = generateToken({ username, role: 'admin' });
    return res.json({
      token,
      user: {
        name: username,
        role: 'admin'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
};
```

- [ ] **Step 4: Create auth routes**

```javascript
// backend/src/routes/auth.js
import express from 'express';
import { login } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);

export default router;
```

- [ ] **Step 5: Register auth routes in server.js**

```javascript
// Add to server.js after middleware
import authRoutes from './routes/auth.js';

app.use('/api/auth', authRoutes);
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test auth.test.js
```
Expected: PASS

- [ ] **Step 7: Manual test login**

```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}'
```
Expected: JSON with token and user

- [ ] **Step 8: Commit**

```bash
git add backend/src/controllers/authController.js backend/src/routes/auth.js backend/tests/auth.test.js backend/src/server.js
git commit -m "feat: implement authentication endpoints

- Add login controller with JWT generation
- Simple hardcoded credentials for Phase 1
- Test authentication flow

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

## Chunk 2: Backend Analytics & Data Endpoints

### Task 6: Analytics Controller

**Files:**
- Create: `backend/src/controllers/analyticsController.js`
- Create: `backend/src/routes/analytics.js`
- Create: `backend/tests/analytics.test.js`

- [ ] **Step 1: Write analytics controller test**

```javascript
// backend/tests/analytics.test.js
import request from 'supertest';
import app from '../src/server.js';
import { generateToken } from '../src/middleware/auth.js';

describe('GET /api/analytics', () => {
  let token;

  beforeAll(() => {
    token = generateToken({ username: 'test', role: 'admin' });
  });

  test('should require authentication', async () => {
    const response = await request(app).get('/api/analytics');
    expect(response.status).toBe(401);
  });

  test('should return analytics metrics', async () => {
    const response = await request(app)
      .get('/api/analytics')
      .query({ client_id: 'test-client', start_date: '2026-01-01', end_date: '2026-12-31' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('qualifiedLeads');
    expect(response.body).toHaveProperty('coldCallLeads');
    expect(response.body).toHaveProperty('totalLeads');
    expect(response.body).toHaveProperty('leadsBySource');
    expect(response.body).toHaveProperty('avgClaimTime');
    expect(response.body).toHaveProperty('slowClaimCount');
  });

  test('should require client_id parameter', async () => {
    const response = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test analytics.test.js
```
Expected: FAIL - route not found

- [ ] **Step 3: Implement analytics controller**

```javascript
// backend/src/controllers/analyticsController.js
import { query } from '../config/database.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const { client_id, sales_rep_id, start_date, end_date } = req.query;

    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    const baseWhere = `
      client_id = $1 
      AND created_at >= $2 
      AND created_at <= $3
    `;
    const baseParams = [
      client_id,
      start_date || '1970-01-01',
      end_date || '2099-12-31'
    ];

    // If sales_rep_id filter is provided, add it
    const whereClause = sales_rep_id 
      ? `${baseWhere} AND claimed_by = $4`
      : baseWhere;
    const params = sales_rep_id 
      ? [...baseParams, sales_rep_id]
      : baseParams;

    // Qualified leads count
    const qualifiedQuery = `
      SELECT COUNT(*) as count FROM leads 
      WHERE status IN ('qualified_unclaimed', 'claimed')
      AND ${whereClause}
    `;
    const qualifiedResult = await query(qualifiedQuery, params);

    // Cold call leads count
    const coldCallQuery = `
      SELECT COUNT(*) as count FROM leads 
      WHERE status = 'cold_call'
      AND ${whereClause}
    `;
    const coldCallResult = await query(coldCallQuery, params);

    // Total leads count
    const totalQuery = `SELECT COUNT(*) as count FROM leads WHERE ${whereClause}`;
    const totalResult = await query(totalQuery, params);

    // Leads by source
    const sourceQuery = `
      SELECT source, COUNT(*) as count 
      FROM leads 
      WHERE ${whereClause}
      GROUP BY source
    `;
    const sourceResult = await query(sourceQuery, params);
    const leadsBySource = sourceResult.rows.reduce((acc, row) => {
      acc[row.source] = parseInt(row.count);
      return acc;
    }, {});

    // Average claim time
    const avgClaimQuery = `
      SELECT AVG(EXTRACT(EPOCH FROM (claimed_at - qualified_at))) as avg_seconds
      FROM leads 
      WHERE claimed_at IS NOT NULL 
      AND ${whereClause}
    `;
    const avgClaimResult = await query(avgClaimQuery, params);
    const avgSeconds = avgClaimResult.rows[0].avg_seconds || 0;
    const avgClaimTime = formatDuration(avgSeconds);

    // Slow claims count (>30 minutes)
    const slowClaimQuery = `
      SELECT COUNT(*) as count FROM leads 
      WHERE claimed_at - qualified_at > interval '30 minutes'
      AND ${whereClause}
    `;
    const slowClaimResult = await query(slowClaimQuery, params);

    res.json({
      qualifiedLeads: parseInt(qualifiedResult.rows[0].count),
      coldCallLeads: parseInt(coldCallResult.rows[0].count),
      totalLeads: parseInt(totalResult.rows[0].count),
      leadsBySource,
      avgClaimTime,
      slowClaimCount: parseInt(slowClaimResult.rows[0].count)
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Create analytics routes**

```javascript
// backend/src/routes/analytics.js
import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getAnalytics);

export default router;
```

- [ ] **Step 5: Register analytics routes in server.js**

```javascript
// Add to server.js
import analyticsRoutes from './routes/analytics.js';

app.use('/api/analytics', analyticsRoutes);
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test analytics.test.js
```
Expected: PASS (may fail if database doesn't have test data - that's okay for now)

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/analyticsController.js backend/src/routes/analytics.js backend/tests/analytics.test.js backend/src/server.js
git commit -m "feat: implement analytics metrics endpoint

- Calculate qualified leads, cold calls, total leads
- Aggregate leads by source
- Calculate average claim time and slow claims
- Support filtering by client and sales rep

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 7: Leads Data Controller

**Files:**
- Create: `backend/src/controllers/leadsController.js`
- Create: `backend/src/routes/leads.js`
- Create: `backend/tests/leads.test.js`

- [ ] **Step 1: Write leads controller test**

```javascript
// backend/tests/leads.test.js
import request from 'supertest';
import app from '../src/server.js';
import { generateToken } from '../src/middleware/auth.js';

describe('GET /api/leads', () => {
  let token;

  beforeAll(() => {
    token = generateToken({ username: 'test', role: 'admin' });
  });

  test('should require authentication', async () => {
    const response = await request(app).get('/api/leads');
    expect(response.status).toBe(401);
  });

  test('should return paginated leads list', async () => {
    const response = await request(app)
      .get('/api/leads')
      .query({ 
        client_id: 'test-client',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        page: 1,
        limit: 50
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('should require client_id parameter', async () => {
    const response = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test leads.test.js
```
Expected: FAIL - route not found

- [ ] **Step 3: Implement leads controller**

```javascript
// backend/src/controllers/leadsController.js
import { query } from '../config/database.js';

export const getLeads = async (req, res, next) => {
  try {
    const { 
      client_id, 
      sales_rep_id, 
      start_date, 
      end_date,
      page = 1,
      limit = 50
    } = req.query;

    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE clause
    let whereClause = `l.client_id = $1 AND l.created_at >= $2 AND l.created_at <= $3`;
    let params = [client_id, start_date || '1970-01-01', end_date || '2099-12-31'];
    let paramIndex = 4;

    if (sales_rep_id) {
      whereClause += ` AND l.claimed_by = $${paramIndex}`;
      params.push(sales_rep_id);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM leads l WHERE ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    const dataQuery = `
      SELECT 
        l.id,
        l.whatsapp,
        l.name,
        l.interest,
        l.status,
        l.source,
        l.created_at,
        l.qualified_at,
        l.claimed_at,
        EXTRACT(EPOCH FROM (l.claimed_at - l.qualified_at)) as claim_duration_seconds,
        sr.id as sales_rep_id,
        sr.name as sales_rep_name,
        sr.whatsapp as sales_rep_whatsapp
      FROM leads l
      LEFT JOIN sales_reps sr ON l.claimed_by = sr.id
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);

    const dataResult = await query(dataQuery, params);

    const data = dataResult.rows.map(row => ({
      id: row.id,
      whatsapp: row.whatsapp,
      name: row.name,
      interest: row.interest,
      status: row.status,
      source: row.source,
      created_at: row.created_at,
      qualified_at: row.qualified_at,
      claimed_at: row.claimed_at,
      sales_rep: row.sales_rep_id ? {
        id: row.sales_rep_id,
        name: row.sales_rep_name,
        whatsapp: row.sales_rep_whatsapp
      } : null,
      claim_duration: row.claim_duration_seconds 
        ? formatDuration(row.claim_duration_seconds)
        : null
    }));

    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages
      }
    });
  } catch (error) {
    next(error);
  }
};

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Create leads routes**

```javascript
// backend/src/routes/leads.js
import express from 'express';
import { getLeads } from '../controllers/leadsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getLeads);

export default router;
```

- [ ] **Step 5: Register leads routes in server.js**

```javascript
// Add to server.js
import leadsRoutes from './routes/leads.js';

app.use('/api/leads', leadsRoutes);
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test leads.test.js
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/leadsController.js backend/src/routes/leads.js backend/tests/leads.test.js backend/src/server.js
git commit -m "feat: implement leads data endpoint

- Query leads with JOIN to sales_reps
- Support pagination (50 per page)
- Calculate claim duration
- Filter by client, sales rep, and date range

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 8: Reference Data Endpoints (Clients & Sales Reps)

**Files:**
- Create: `backend/src/routes/clients.js`
- Modify: `backend/src/server.js`

- [ ] **Step 1: Create clients routes**

```javascript
// backend/src/routes/clients.js
import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all clients
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await query('SELECT id, name FROM clients ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get sales reps for a client
router.get('/:client_id/sales-reps', authenticateToken, async (req, res, next) => {
  try {
    const { client_id } = req.params;
    const result = await query(
      'SELECT id, name, whatsapp, active FROM sales_reps WHERE client_id = $1 AND active = true ORDER BY name',
      [client_id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
```

- [ ] **Step 2: Register clients routes in server.js**

```javascript
// Add to server.js
import clientsRoutes from './routes/clients.js';

app.use('/api/clients', clientsRoutes);
```

- [ ] **Step 3: Test clients endpoint**

```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}' | jq -r '.token')

# Test clients endpoint
curl http://localhost:3002/api/clients \
  -H "Authorization: Bearer $TOKEN"
```
Expected: JSON array of clients

- [ ] **Step 4: Test sales reps endpoint**

```bash
curl "http://localhost:3002/api/clients/CLIENT_ID/sales-reps" \
  -H "Authorization: Bearer $TOKEN"
```
Expected: JSON array of sales reps

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/clients.js backend/src/server.js
git commit -m "feat: add reference data endpoints

- Get all clients
- Get sales reps by client
- Both endpoints require authentication

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 9: CSV Export Controller

**Files:**
- Create: `backend/src/controllers/exportController.js`
- Create: `backend/src/routes/export.js`
- Create: `backend/tests/export.test.js`

- [ ] **Step 1: Write CSV export test**

```javascript
// backend/tests/export.test.js
import request from 'supertest';
import app from '../src/server.js';
import { generateToken } from '../src/middleware/auth.js';

describe('GET /api/export/csv', () => {
  let token;

  beforeAll(() => {
    token = generateToken({ username: 'test', role: 'admin' });
  });

  test('should require authentication', async () => {
    const response = await request(app).get('/api/export/csv');
    expect(response.status).toBe(401);
  });

  test('should return CSV file', async () => {
    const response = await request(app)
      .get('/api/export/csv')
      .query({ 
        client_id: 'test-client',
        start_date: '2026-01-01',
        end_date: '2026-12-31'
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('attachment');
  });

  test('should require client_id parameter', async () => {
    const response = await request(app)
      .get('/api/export/csv')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test export.test.js
```
Expected: FAIL - route not found

- [ ] **Step 3: Implement CSV export controller**

```javascript
// backend/src/controllers/exportController.js
import { query } from '../config/database.js';

export const exportCSV = async (req, res, next) => {
  try {
    const { client_id, sales_rep_id, start_date, end_date } = req.query;

    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    // Build WHERE clause (same as leads controller)
    let whereClause = `l.client_id = $1 AND l.created_at >= $2 AND l.created_at <= $3`;
    let params = [client_id, start_date || '1970-01-01', end_date || '2099-12-31'];

    if (sales_rep_id) {
      whereClause += ` AND l.claimed_by = $4`;
      params.push(sales_rep_id);
    }

    // Query all matching leads (no pagination for export)
    const dataQuery = `
      SELECT 
        l.id,
        l.name,
        l.whatsapp,
        l.source,
        l.status,
        l.created_at,
        l.qualified_at,
        sr.name as claimed_by_name,
        l.claimed_at,
        EXTRACT(EPOCH FROM (l.claimed_at - l.qualified_at)) as claim_duration_seconds
      FROM leads l
      LEFT JOIN sales_reps sr ON l.claimed_by = sr.id
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
    `;

    const result = await query(dataQuery, params);

    // Generate CSV
    const csv = generateCSV(result.rows);

    // Set response headers
    const filename = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

function generateCSV(rows) {
  const headers = [
    'Lead ID',
    'Name',
    'WhatsApp',
    'Source',
    'Status',
    'Created',
    'Qualified',
    'Claimed By',
    'Claim Time',
    'Duration to Claim'
  ];

  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const values = [
      escapeCSV(row.id),
      escapeCSV(row.name || ''),
      escapeCSV(row.whatsapp),
      escapeCSV(row.source),
      escapeCSV(row.status),
      escapeCSV(formatDate(row.created_at)),
      escapeCSV(formatDate(row.qualified_at)),
      escapeCSV(row.claimed_by_name || ''),
      escapeCSV(formatDate(row.claimed_at)),
      escapeCSV(row.claim_duration_seconds ? formatDuration(row.claim_duration_seconds) : '')
    ];
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().replace('T', ' ').substring(0, 19);
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Create export routes**

```javascript
// backend/src/routes/export.js
import express from 'express';
import { exportCSV } from '../controllers/exportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/csv', authenticateToken, exportCSV);

export default router;
```

- [ ] **Step 5: Register export routes in server.js**

```javascript
// Add to server.js
import exportRoutes from './routes/export.js';

app.use('/api/export', exportRoutes);
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test export.test.js
```
Expected: PASS

- [ ] **Step 7: Manual test CSV download**

```bash
curl "http://localhost:3002/api/export/csv?client_id=CLIENT_ID&start_date=2026-01-01&end_date=2026-12-31" \
  -H "Authorization: Bearer $TOKEN" \
  -o test-export.csv
cat test-export.csv
```
Expected: CSV file with headers and data

- [ ] **Step 8: Commit**

```bash
git add backend/src/controllers/exportController.js backend/src/routes/export.js backend/tests/export.test.js backend/src/server.js
git commit -m "feat: implement CSV export endpoint

- Export filtered leads to CSV
- Include all lead and sales rep data
- Respect active filters (client, sales rep, dates)
- Proper CSV escaping and formatting

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 10: Backend Integration Test

- [ ] **Step 1: Run all backend tests**

```bash
cd backend
npm test
```
Expected: All tests pass

- [ ] **Step 2: Test complete API flow**

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}' | jq -r '.token')

# 2. Get clients
curl -s http://localhost:3002/api/clients \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Get analytics
curl -s "http://localhost:3002/api/analytics?client_id=CLIENT_ID&start_date=2026-01-01&end_date=2026-12-31" \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Get leads
curl -s "http://localhost:3002/api/leads?client_id=CLIENT_ID&page=1&limit=10&start_date=2026-01-01&end_date=2026-12-31" \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Export CSV
curl "http://localhost:3002/api/export/csv?client_id=CLIENT_ID&start_date=2026-01-01&end_date=2026-12-31" \
  -H "Authorization: Bearer $TOKEN" \
  -o integration-test.csv
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "test: verify backend API integration

- All endpoints working end-to-end
- Authentication flow validated
- Data queries returning expected format

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

## Chunk 3: Frontend Setup & State Management

### Task 11: Initialize Frontend Structure

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/.env.example`

- [ ] **Step 1: Create frontend directory and initialize**

```bash
cd ..
mkdir -p frontend/src/{pages,components/{layout,filters,analytics,table,ui},store,api,utils,lib,styles}
mkdir -p frontend/public
cd frontend
npm create vite@latest . -- --template react
```

- [ ] **Step 2: Install frontend dependencies**

```bash
npm install
npm install react-router-dom zustand axios recharts date-fns
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node
npx tailwindcss init -p
```

- [ ] **Step 3: Install Shadcn/ui**

```bash
npx shadcn-ui@latest init
```
Answer prompts:
- Style: Default
- Base color: Slate
- CSS variables: Yes

```bash
npx shadcn-ui@latest add button card input label select table dropdown-menu
```

- [ ] **Step 4: Create .env.example**

```env
VITE_API_URL=/api
```

- [ ] **Step 5: Configure Vite**

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 6: Configure Tailwind with Taktis AI colors**

```javascript
// tailwind.config.js
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        taktis: {
          primary: '#00bcd4',
          dark: '#0f0f0f',
          accent1: '#8c52ff',
          accent2: '#ff4c4c',
          neutral: '#d1d5db',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

- [ ] **Step 7: Create global styles**

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #00bcd4;
  --dark: #0f0f0f;
  --accent1: #8c52ff;
  --accent2: #ff4c4c;
  --neutral: #d1d5db;
}

.dark {
  --background: #0f0f0f;
  --foreground: #f9fafb;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}
```

- [ ] **Step 8: Test frontend dev server**

```bash
npm run dev
```
Expected: Dev server running on http://localhost:5173

- [ ] **Step 9: Commit**

```bash
git add frontend/
git commit -m "feat: initialize frontend with Vite and Tailwind

- Set up React with Vite
- Configure Tailwind CSS with Taktis AI colors
- Install Shadcn/ui components
- Configure dev server with API proxy

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 12: API Client & Utilities

**Files:**
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/utils/auth.js`
- Create: `frontend/src/utils/formatters.js`

- [ ] **Step 1: Implement API client**

```javascript
// frontend/src/api/client.js
import axios from 'axios';
import { getToken, removeToken } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: (credentials) => apiClient.post('/auth/login', credentials),

  // Analytics
  getAnalytics: (params) => apiClient.get('/analytics', { params }),

  // Leads
  getLeads: (params) => apiClient.get('/leads', { params }),

  // Reference data
  getClients: () => apiClient.get('/clients'),
  getSalesReps: (clientId) => apiClient.get(`/clients/${clientId}/sales-reps`),

  // Export
  exportCSV: (params) => {
    const token = getToken();
    const queryString = new URLSearchParams(params).toString();
    window.open(`${API_URL}/export/csv?${queryString}&token=${token}`, '_blank');
  },
};
```

- [ ] **Step 2: Implement auth utilities**

```javascript
// frontend/src/utils/auth.js
const TOKEN_KEY = 'lq_token';
const USER_KEY = 'lq_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

export const isAuthenticated = () => !!getToken();
```

- [ ] **Step 3: Implement formatter utilities**

```javascript
// frontend/src/utils/formatters.js
import { format, parseISO } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '-';
  return format(parseISO(date), 'MMM dd, yyyy HH:mm');
};

export const formatDuration = (duration) => {
  if (!duration) return '-';
  return duration; // Already formatted as HH:MM:SS from backend
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';
  // Format as +62 xxx-xxxx-xxxx
  return phone.replace(/(\+\d{2})(\d{3})(\d{4})(\d+)/, '$1 $2-$3-$4');
};
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/ frontend/src/utils/
git commit -m "feat: implement API client and utilities

- Axios client with auth interceptors
- Token management utilities
- Date, number, and phone formatters

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 13: Zustand Store

**Files:**
- Create: `frontend/src/store/dashboardStore.js`

- [ ] **Step 1: Implement Zustand store**

```javascript
// frontend/src/store/dashboardStore.js
import { create } from 'zustand';
import { api } from '../api/client';

export const useDashboardStore = create((set, get) => ({
  // Filters
  filters: {
    clientId: null,
    salesRepId: null,
    startDate: null,
    endDate: null,
  },

  // Data
  analytics: {
    qualifiedLeads: 0,
    coldCallLeads: 0,
    totalLeads: 0,
    leadsBySource: {},
    avgClaimTime: '00:00:00',
    slowClaimCount: 0,
  },

  leads: {
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 50,
      pages: 1,
    },
  },

  // Reference data
  clients: [],
  salesReps: [],

  // UI state
  loading: false,
  error: null,
  darkMode: localStorage.getItem('darkMode') === 'true',

  // Actions
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchData();
  },

  setPage: (page) => {
    set((state) => ({
      leads: {
        ...state.leads,
        pagination: { ...state.leads.pagination, page },
      },
    }));
    get().fetchLeads();
  },

  toggleDarkMode: () => {
    const newMode = !get().darkMode;
    set({ darkMode: newMode });
    localStorage.setItem('darkMode', newMode);
    document.documentElement.classList.toggle('dark', newMode);
  },

  fetchClients: async () => {
    try {
      const response = await api.getClients();
      set({ clients: response.data });
    } catch (error) {
      set({ error: error.message });
    }
  },

  fetchSalesReps: async (clientId) => {
    try {
      const response = await api.getSalesReps(clientId);
      set({ salesReps: response.data });
    } catch (error) {
      set({ error: error.message });
    }
  },

  fetchAnalytics: async () => {
    const { filters } = get();
    if (!filters.clientId) return;

    try {
      const response = await api.getAnalytics({
        client_id: filters.clientId,
        sales_rep_id: filters.salesRepId,
        start_date: filters.startDate,
        end_date: filters.endDate,
      });
      set({ analytics: response.data });
    } catch (error) {
      set({ error: error.message });
    }
  },

  fetchLeads: async () => {
    const { filters, leads } = get();
    if (!filters.clientId) return;

    set({ loading: true });
    try {
      const response = await api.getLeads({
        client_id: filters.clientId,
        sales_rep_id: filters.salesRepId,
        start_date: filters.startDate,
        end_date: filters.endDate,
        page: leads.pagination.page,
        limit: leads.pagination.limit,
      });
      set({ 
        leads: response.data,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchData: async () => {
    await Promise.all([
      get().fetchAnalytics(),
      get().fetchLeads(),
    ]);
  },

  exportCSV: () => {
    const { filters } = get();
    if (!filters.clientId) return;

    api.exportCSV({
      client_id: filters.clientId,
      sales_rep_id: filters.salesRepId,
      start_date: filters.startDate,
      end_date: filters.endDate,
    });
  },
}));

// Initialize dark mode on load
if (useDashboardStore.getState().darkMode) {
  document.documentElement.classList.add('dark');
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/store/
git commit -m "feat: implement Zustand state management

- Centralized store for filters, data, and UI state
- Actions for fetching analytics, leads, reference data
- Dark mode toggle with persistence
- CSV export action

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

## Chunk 4: Frontend Pages & Core Components

### Task 14: Login Page

**Files:**
- Create: `frontend/src/pages/Login.jsx`

- [ ] **Step 1: Implement Login page component**

```jsx
// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { setToken, setUser } from '../utils/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login({ username, password });
      setToken(response.data.token);
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-taktis-primary/10 to-taktis-accent1/10">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
            LQ System Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Taktis AI x Esensi Digital
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Login.jsx
git commit -m "feat: implement login page

- Login form with username/password
- Token storage on successful login
- Error handling and loading states
- Taktis AI branded styling

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 15: Dashboard Page Structure

**Files:**
- Create: `frontend/src/pages/Dashboard.jsx`

- [ ] **Step 1: Implement Dashboard page component**

```jsx
// frontend/src/pages/Dashboard.jsx
import { useEffect } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { FilterBar } from '../components/filters/FilterBar';
import { AnalyticsSection } from '../components/analytics/AnalyticsSection';
import { LeadsTable } from '../components/table/LeadsTable';

export function Dashboard() {
  const { fetchClients, filters } = useDashboardStore();

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="space-y-6">
      <FilterBar />
      
      {filters.clientId && (
        <>
          <AnalyticsSection />
          <LeadsTable />
        </>
      )}

      {!filters.clientId && (
        <div className="text-center py-12 text-gray-500">
          Select a client to view analytics
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: implement dashboard page structure

- Filter bar for client, sales rep, date selection
- Analytics section with metrics and charts
- Leads table with pagination
- Conditional rendering based on client selection

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 16: Layout Components

**Files:**
- Create: `frontend/src/components/layout/Header.jsx`
- Create: `frontend/src/components/layout/Layout.jsx`

- [ ] **Step 1: Implement Header component**

```jsx
// frontend/src/components/layout/Header.jsx
import { Moon, Sun, LogOut } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { getUser, removeToken } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

export function Header() {
  const { darkMode, toggleDarkMode } = useDashboardStore();
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <header className="border-b bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
               style={{ backgroundColor: 'var(--primary)' }}>
            <span className="text-white font-bold text-xl">LQ</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">
              LQ System Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Taktis AI x Esensi Digital
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user?.name}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            title="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Implement Layout component**

```jsx
// frontend/src/components/layout/Layout.jsx
import { Header } from './Header';

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/
git commit -m "feat: implement layout components

- Header with branding, dark mode toggle, logout
- Layout wrapper for consistent page structure
- User info display

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

## Chunk 5: Filter & Analytics Components

### Task 17: Filter Components

**Files:**
- Create: `frontend/src/components/filters/ClientSelect.jsx`
- Create: `frontend/src/components/filters/SalesRepSelect.jsx`
- Create: `frontend/src/components/filters/DateRangePicker.jsx`
- Create: `frontend/src/components/filters/FilterBar.jsx`

- [ ] **Step 1: Implement ClientSelect**

```jsx
// frontend/src/components/filters/ClientSelect.jsx
import { useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';

export function ClientSelect() {
  const { clients, filters, setFilters, fetchSalesReps } = useDashboardStore();

  const handleChange = (value) => {
    setFilters({ clientId: value, salesRepId: null });
    fetchSalesReps(value);
  };

  return (
    <div className="space-y-2">
      <Label>Client</Label>
      <Select value={filters.clientId || ''} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select client" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 2: Implement SalesRepSelect**

```jsx
// frontend/src/components/filters/SalesRepSelect.jsx
import { useDashboardStore } from '../../store/dashboardStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';

export function SalesRepSelect() {
  const { salesReps, filters, setFilters } = useDashboardStore();

  if (!filters.clientId) return null;

  return (
    <div className="space-y-2">
      <Label>Sales Representative</Label>
      <Select
        value={filters.salesRepId || 'all'}
        onValueChange={(value) => setFilters({ salesRepId: value === 'all' ? null : value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="All sales reps" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sales Reps</SelectItem>
          {salesReps.map((rep) => (
            <SelectItem key={rep.id} value={rep.id}>
              {rep.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 3: Implement DateRangePicker**

```jsx
// frontend/src/components/filters/DateRangePicker.jsx
import { useDashboardStore } from '../../store/dashboardStore';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

export function DateRangePicker() {
  const { filters, setFilters } = useDashboardStore();

  const setPreset = (days) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    setFilters({ startDate, endDate });
  };

  return (
    <div className="space-y-2">
      <Label>Date Range</Label>
      <div className="flex gap-2">
        <Input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => setFilters({ startDate: e.target.value })}
          placeholder="Start date"
        />
        <Input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => setFilters({ endDate: e.target.value })}
          placeholder="End date"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setPreset(7)}>
          Last 7 days
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPreset(30)}>
          Last 30 days
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPreset(90)}>
          Last 90 days
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement FilterBar**

```jsx
// frontend/src/components/filters/FilterBar.jsx
import { RefreshCw } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientSelect } from './ClientSelect';
import { SalesRepSelect } from './SalesRepSelect';
import { DateRangePicker } from './DateRangePicker';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export function FilterBar() {
  const { fetchData, loading } = useDashboardStore();

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <ClientSelect />
        <SalesRepSelect />
        <DateRangePicker />
        <Button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/filters/
git commit -m "feat: implement filter components

- Client selection dropdown
- Sales rep selection (filtered by client)
- Date range picker with presets
- Filter bar container with refresh button

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 18: Analytics Components

**Files:**
- Create: `frontend/src/components/analytics/MetricCard.jsx`
- Create: `frontend/src/components/analytics/SourceChart.jsx`
- Create: `frontend/src/components/analytics/AnalyticsSection.jsx`

- [ ] **Step 1: Implement MetricCard**

```jsx
// frontend/src/components/analytics/MetricCard.jsx
import { Card } from '../ui/card';
import { formatNumber } from '../../utils/formatters';

export function MetricCard({ title, value, icon: Icon, color }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold mt-2" style={{ color }}>
            {formatNumber(value)}
          </p>
        </div>
        {Icon && (
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Implement SourceChart**

```jsx
// frontend/src/components/analytics/SourceChart.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/card';
import { useDashboardStore } from '../../store/dashboardStore';

export function SourceChart() {
  const { analytics } = useDashboardStore();

  const data = Object.entries(analytics.leadsBySource || {}).map(([source, count]) => ({
    source: source.charAt(0).toUpperCase() + source.slice(1),
    count,
  }));

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Leads by Source</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Leads by Source</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="source" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="var(--primary)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
```

- [ ] **Step 3: Implement AnalyticsSection**

```jsx
// frontend/src/components/analytics/AnalyticsSection.jsx
import { CheckCircle, XCircle, Users, Clock, AlertTriangle } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { MetricCard } from './MetricCard';
import { SourceChart } from './SourceChart';

export function AnalyticsSection() {
  const { analytics } = useDashboardStore();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Qualified Leads"
          value={analytics.qualifiedLeads}
          icon={CheckCircle}
          color="#10b981"
        />
        <MetricCard
          title="Cold Call List"
          value={analytics.coldCallLeads}
          icon={XCircle}
          color="#ff4c4c"
        />
        <MetricCard
          title="Total Leads"
          value={analytics.totalLeads}
          icon={Users}
          color="#00bcd4"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Avg. Claim Time"
          value={analytics.avgClaimTime}
          icon={Clock}
          color="#8c52ff"
        />
        <MetricCard
          title="Slow Claims (>30min)"
          value={analytics.slowClaimCount}
          icon={AlertTriangle}
          color="#f59e0b"
        />
      </div>

      <SourceChart />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/analytics/
git commit -m "feat: implement analytics components

- Metric cards with icons and colors
- Source chart with Recharts bar visualization
- Analytics section grid layout
- Taktis AI color scheme integration

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

## Chunk 6: Table, Routing & Deployment

### Task 19: Leads Table Components

**Files:**
- Create: `frontend/src/components/table/StatusBadge.jsx`
- Create: `frontend/src/components/table/Pagination.jsx`
- Create: `frontend/src/components/table/LeadsTable.jsx`

- [ ] **Step 1: Implement StatusBadge**

```jsx
// frontend/src/components/table/StatusBadge.jsx
export function StatusBadge({ status }) {
  const config = {
    cold_call: { label: 'Cold Call', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    qualified_unclaimed: { label: 'Qualified', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    claimed: { label: 'Claimed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  };

  const { label, color } = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Implement Pagination**

```jsx
// frontend/src/components/table/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

export function Pagination({ pagination, onPageChange }) {
  const { page, pages, total, limit } = pagination;

  if (pages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {startItem} to {endItem} of {total} leads
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="text-sm">
          Page {page} of {pages}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement LeadsTable**

```jsx
// frontend/src/components/table/LeadsTable.jsx
import { Download } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { StatusBadge } from './StatusBadge';
import { Pagination } from './Pagination';
import { formatDate, formatDuration, formatPhoneNumber } from '../../utils/formatters';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

export function LeadsTable() {
  const { leads, loading, setPage, exportCSV } = useDashboardStore();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Leads Data</h3>
        <Button
          variant="outline"
          onClick={exportCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : leads.data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No leads found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>Claim Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.data.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name || '-'}</TableCell>
                    <TableCell>{formatPhoneNumber(lead.whatsapp)}</TableCell>
                    <TableCell className="capitalize">{lead.source}</TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell>{formatDate(lead.created_at)}</TableCell>
                    <TableCell>{lead.sales_rep?.name || '-'}</TableCell>
                    <TableCell>
                      <span className={lead.claim_duration && lead.claim_duration > '00:30:00' ? 'text-orange-600' : ''}>
                        {formatDuration(lead.claim_duration)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4">
            <Pagination pagination={leads.pagination} onPageChange={setPage} />
          </div>
        </>
      )}
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/table/
git commit -m "feat: implement leads table components

- Status badge with color coding
- Pagination controls
- Leads table with all data columns
- CSV export button
- Responsive table layout

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 20: App Routing & Main Entry

**Files:**
- Create: `frontend/src/App.jsx`
- Modify: `frontend/src/main.jsx`
- Create: `frontend/index.html`

- [ ] **Step 1: Implement App.jsx with routing**

```jsx
// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/layout/Layout';
import { isAuthenticated } from './utils/auth';
import './styles/globals.css';

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 2: Update main.jsx**

```jsx
// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Create index.html**

```html
<!-- frontend/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LQ System Dashboard - Taktis AI x Esensi Digital</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Test frontend application**

```bash
cd frontend
npm run dev
```
Open http://localhost:5173 and verify:
- Login page loads
- Can log in (requires backend running)
- Dashboard shows filters
- Metrics display when client selected
- Table shows data

- [ ] **Step 5: Build frontend for production**

```bash
npm run build
```
Expected: `dist/` folder created with optimized files

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx frontend/src/main.jsx frontend/index.html
git commit -m "feat: implement app routing and main entry

- React Router with protected routes
- Login and dashboard routes
- Redirect unauthenticated users to login
- Root redirect to dashboard

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 21: Deployment Configuration

**Files:**
- Create: `ecosystem.config.js`
- Create: `README.md`

- [ ] **Step 1: Create PM2 ecosystem config**

```javascript
// ecosystem.config.js
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
        PORT: 3002,
      },
      error_file: '~/taktis/logs/lq-dashboard-backend-error.log',
      out_file: '~/taktis/logs/lq-dashboard-backend-out.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
```

- [ ] **Step 2: Create README.md**

```markdown
# LQ System Dashboard

**Taktis AI x Esensi Digital**

Analytics and monitoring dashboard for the Leads Qualifier system.

## Features

- 📊 Real-time analytics metrics
- 📈 Visual charts for lead sources
- 📋 Filterable leads data table
- 📥 CSV export functionality
- 🌓 Dark mode support
- 🔐 JWT authentication
- 📱 Responsive design

## Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS + Shadcn/ui
- Zustand for state management
- Recharts for visualizations
- React Router for navigation

**Backend:**
- Node.js + Express
- PostgreSQL with connection pooling
- JWT authentication
- CSV generation

**Infrastructure:**
- PM2 process manager
- Nginx reverse proxy
- SSL/HTTPS via Let's Encrypt

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (existing `leadsqualifier` DB)
- PM2 globally installed: `npm install -g pm2`
- Nginx configured (see DEPLOYMENT_INSTRUCTIONS.md)

### Development

1. **Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev
```

2. **Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Visit http://localhost:5173

### Production Deployment

See `DEPLOYMENT_INSTRUCTIONS.md` for complete step-by-step guide.

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/        # Database connection
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Auth, error handling
│   │   ├── routes/        # API endpoints
│   │   └── server.js      # Entry point
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand store
│   │   └── utils/         # Helpers
│   └── public/
├── docs/
│   ├── superpowers/
│   │   ├── specs/         # Design specifications
│   │   └── plans/         # Implementation plans
│   └── DEPLOYMENT_INSTRUCTIONS.md
└── ecosystem.config.js    # PM2 configuration
```

## API Endpoints

- `POST /api/auth/login` - Authenticate user
- `GET /api/analytics` - Get metrics (filtered)
- `GET /api/leads` - Get leads data (paginated)
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id/sales-reps` - Get sales reps for client
- `GET /api/export/csv` - Export filtered leads to CSV

## Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://user:pass@localhost:5432/leadsqualifier
JWT_SECRET=your-secret-here
CORS_ORIGIN=https://lqdashboard.esensigroup.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password
```

**Frontend (.env):**
```env
VITE_API_URL=/api
```

## Scripts

**Backend:**
- `npm run dev` - Development server with nodemon
- `npm start` - Production server
- `npm test` - Run tests with coverage

**Frontend:**
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build

## License

Proprietary - Taktis AI & Esensi Digital

## Support

For deployment issues, see DEPLOYMENT_INSTRUCTIONS.md or contact your supervisor.
```

- [ ] **Step 3: Commit**

```bash
git add ecosystem.config.js README.md
git commit -m "docs: add deployment config and README

- PM2 ecosystem configuration
- Comprehensive README with setup instructions
- Project structure documentation
- API endpoints reference

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

---

### Task 22: Final Integration & Testing

- [ ] **Step 1: Test full stack locally**

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Test flow:
1. Visit http://localhost:5173
2. Login with admin credentials
3. Select a client from dropdown
4. Verify analytics load
5. Verify leads table populates
6. Test pagination
7. Test CSV export
8. Test dark mode toggle
9. Test logout

- [ ] **Step 2: Run all tests**

```bash
cd backend
npm test
```
Expected: All tests pass

- [ ] **Step 3: Build production frontend**

```bash
cd frontend
npm run build
```
Expected: Optimized build in `dist/`

- [ ] **Step 4: Test production build locally**

```bash
cd frontend
npm run preview
```
Visit preview URL and test functionality

- [ ] **Step 5: Create .gitignore additions**

Ensure .gitignore has:
```
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
```

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "chore: finalize dashboard implementation

- Complete full-stack integration
- All features functional
- Tests passing
- Production build verified
- Ready for deployment

Co-Authored-By: Oz <oz-agent@warp.dev>"
```

- [ ] **Step 7: Push to GitHub**

```bash
git push origin main
```

---

## Implementation Complete!

**Summary:**

✅ **Backend (Express + PostgreSQL)**
- Authentication with JWT
- Analytics metrics endpoint
- Leads data with pagination
- Reference data endpoints
- CSV export functionality
- Comprehensive test coverage

✅ **Frontend (React + Vite)**
- Login page with authentication
- Dashboard with filters
- Analytics cards and charts
- Leads table with pagination
- Dark mode support
- Responsive design

✅ **Infrastructure**
- PM2 process management
- Nginx configuration
- SSL/HTTPS ready
- Deployment documentation

**Next Steps:**

1. Follow DEPLOYMENT_INSTRUCTIONS.md to deploy to VPS
2. Configure domain DNS to point to server
3. Set up SSL certificate with Let's Encrypt
4. Start PM2 services
5. Test production deployment

**Repository:** https://github.com/legonoroy8/lqdashboard-taktis-esensi
