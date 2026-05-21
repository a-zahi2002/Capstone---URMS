/**
 * app.ts
 * ─────────────────────────────────────────────────────────────
 * Express application setup.
 * Health check now verifies Supabase connectivity.
 * ─────────────────────────────────────────────────────────────
 */
import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();

// ✅ Middleware
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ✅ Routes
import resourceRoutes from "./routes/resourceRoutes";
import maintenanceTicketRoutes from "./routes/maintenanceTicketRoutes";
import userRoutes from "./routes/userRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import reportScheduleRoutes from "./routes/reportScheduleRoutes";
import notificationRoutes from "./routes/notificationRoutes";

app.use("/api/resources", resourceRoutes);
app.use("/api/maintenance-tickets", maintenanceTicketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/reports", reportScheduleRoutes);
app.use("/api/notifications", notificationRoutes);

import { checkSupabaseConnection } from "./config/supabaseClient";

// ✅ Health Check Route
app.get("/api/health", async (req: Request, res: Response) => {
  const isDbConnected = await checkSupabaseConnection();
  res.status(isDbConnected ? 200 : 503).json({
    status:    isDbConnected ? "success" : "degraded",
    message:   isDbConnected
                 ? "URMS Backend is fully operational (Supabase)"
                 : "URMS Backend is running but Supabase is unavailable",
    database:  isDbConnected ? "connected" : "disconnected",
    provider:  "supabase",
    timestamp: new Date().toISOString()
  });
});

// ✅ 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status:  "error",
    message: "Route not found",
  });
});

export default app;