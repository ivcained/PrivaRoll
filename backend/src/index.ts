import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { payrollRouter } from "./routes/payroll";
import { stealthRouter } from "./routes/stealth";
import { healthRouter } from "./routes/health";

// Load environment variables from root .env
dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// ──���───────���───────────────────────────────────
// Middleware
// ──────────────────────────────────────────────
app.use(helmet());

// CORS: Allow configured frontend URL, Vercel deployments, and localhost
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow configured origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any Vercel deployment
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      // Block others
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

// ──────────────────────────────────────────────
// Routes
// ────────────────────────────���─────────────────
app.use("/api/health", healthRouter);
app.use("/api/payroll", payrollRouter);
app.use("/api/stealth", stealthRouter);

// ──────────────────────────────────────────────
// Error Handler
// ──────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  },
);

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("═══════════════════════════════════════════════════");
  console.log("  🛡️  PrivaRoll Backend Server");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  ✅ Running on http://localhost:${PORT}`);
  console.log(`  📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `  🔗 Base Sepolia RPC: ${process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"}`,
  );
  console.log("═══════════════════════════════════════════════════");
});

export default app;
