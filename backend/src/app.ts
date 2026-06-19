/**
 * app.ts
 * ─────────────────────────────────────────────────────────────
 * Express application setup.
 * Health check now verifies Supabase connectivity.
 *
 * Security:
 *   • helmet   — sets Strict-Transport-Security (HSTS) and
 *                 other hardening headers on every response.
 *   • httpsRedirect — 301-redirects http:// → https:// in
 *                      production (skipped in development).
 * ─────────────────────────────────────────────────────────────
 */
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { globalLimiter, authLimiter } from "./middleware/rateLimiter";

dotenv.config();

const app: Application = express();

// ─── Proxy Trust Configuration ─────────────────────────────
// When deployed behind a reverse proxy (Nginx, Render, Heroku,
// AWS ALB, etc.), Express sees every request as coming from
// the proxy's IP (127.0.0.1 / internal IP). Setting
// 'trust proxy' to 1 tells Express to read the *first*
// address in the `X-Forwarded-For` header — the real client
// IP — so that express-rate-limit (and req.ip) work correctly.
//
// Without this, ALL users would share the same rate-limit
// bucket (the proxy's IP), causing false 429 errors.
// ────────────────────────────────────────────────────────────
app.set('trust proxy', 1 /* number of proxies */);

// ─── HTTPS Redirect Middleware ──────────────────────────────
// In production the app sits behind a TLS-terminating reverse
// proxy (Vercel, Nginx, AWS ALB). The proxy sets the header
// `x-forwarded-proto: http|https` so we can detect plain HTTP
// and redirect the client to the secure URL.
//
// In development (NODE_ENV !== 'production') the redirect is
// skipped entirely so localhost testing works without certs.
// ────────────────────────────────────────────────────────────
function httpsRedirect(req: Request, res: Response, next: NextFunction): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;

  if (isProduction && proto !== 'https') {
    const secureUrl = `https://${req.hostname}${req.originalUrl}`;
    res.redirect(301, secureUrl);
    return;
  }
  next();
}

// ✅ Security Middleware (order matters: redirect → helmet → cors)
app.use(httpsRedirect);

app.use(
  helmet({
    // Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
    strictTransportSecurity: {
      maxAge: 31536000,        // 1 year in seconds
      includeSubDomains: true, // apply to *.yourdomain.com
      preload: true,           // eligible for browser preload lists
    },
  })
);

// ✅ CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, curl)
    if (!origin) return callback(null, true);

    // In development, allow localhost and 127.0.0.1 on any port
    if (process.env.NODE_ENV !== 'production') {
      if (origin.match(/^http:\/\/localhost(:\d+)?$/) || origin.match(/^http:\/\/127\.0\.0\.1(:\d+)?$/)) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-urms-user-id', 'x-urms-user-role']
}));

// ✅ Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ✅ Rate Limiting
// Global limiter — 100 requests per 15 min per IP for all API routes
app.use("/api", globalLimiter);

// Strict auth limiter — 5 requests per 15 min per IP on sensitive endpoints
// Prevents brute-force & credential-stuffing on password operations.
// Add future /api/login and /api/register routes here when created.
app.post("/api/users/verify-password", authLimiter);
app.post("/api/users/hash-password", authLimiter);

// ✅ Routes
import resourceRoutes from "./routes/resourceRoutes";
import maintenanceTicketRoutes from "./routes/maintenanceTicketRoutes";
import userRoutes from "./routes/userRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import reportScheduleRoutes from "./routes/reportScheduleRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import searchRoutes from "./routes/searchRoutes";

app.use("/api/resources", resourceRoutes);
app.use("/api/maintenance-tickets", maintenanceTicketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/reports", reportScheduleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/search", searchRoutes);

import { checkSupabaseConnection } from "./config/supabaseClient";

// ✅ Health Check Route
app.get("/api/health", async (req: Request, res: Response) => {
  const isDbConnected = await checkSupabaseConnection();
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "success" : "degraded",
    message: isDbConnected
      ? "URMS Backend is fully operational (Supabase)"
      : "URMS Backend is running but Supabase is unavailable",
    database: isDbConnected ? "connected" : "disconnected",
    provider: "supabase",
    timestamp: new Date().toISOString()
  });
});

// ✅ 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

export default app;