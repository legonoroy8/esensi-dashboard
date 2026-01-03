import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import kpiRoutes from './routes/kpi.js';
import chartRoutes from './routes/chart.js';
import tableRoutes from './routes/table.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// If you're behind a TLS-terminating reverse proxy (Traefik), set TRUST_PROXY=1.
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
if (TRUST_PROXY) {
  app.set('trust proxy', 1);
}

// Session cookie should be secure ONLY when you're serving the site over HTTPS.
// For IP:port HTTP testing, keep this false.
const SESSION_COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE === 'true';

// Middleware
app.use(cors({
  origin: NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'esensi-dashboard-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: SESSION_COOKIE_SECURE,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: NODE_ENV });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/chart', chartRoutes);
app.use('/api/table', tableRoutes);

// Serve static files in production
if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  // SPA fallback: serve index.html for all non-API routes.
  // Use a regex route to avoid Express 5 wildcard path-to-regexp issues.
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Esensi Dashboard server running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
});
