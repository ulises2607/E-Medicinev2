import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import citaRoutes from "./routes/cita.routes.js";
import pacienteRoutes from "./routes/paciente.routes.js";
import { TIME_ZONE, SLOT_MINUTES } from "./utils/schedule.js";
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error(
    "JWT_SECRET debe ser un secreto propio de al menos 32 caracteres.",
  );
const app = express();
app.disable("x-powered-by");
// Vercel overwrites X-Forwarded-For at its edge. Trust only that final hop;
// direct/local servers must never accept a caller-supplied forwarding header.
// https://vercel.com/docs/headers/request-headers#x-forwarded-for
app.set("trust proxy", process.env.VERCEL === "1" ? 1 : false);
const origins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());
app.use(cors({ origin: origins, credentials: true }));
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin &&
    !origins.includes(req.headers.origin)
  ) {
    return res.status(403).json({ message: "Origen no permitido." });
  }
  next();
});
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.get("/", (req, res) => res.json({ message: "API de E-Medicine v2" }));
app.get("/api/config", (req, res) =>
  res.json({ timeZone: TIME_ZONE, slotMinutes: SLOT_MINUTES }),
);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/citas", citaRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use((req, res) =>
  res.status(404).json({ message: "Recurso no encontrado." }),
);
app.use((error, req, res, next) => {
  if (error.name === "SequelizeUniqueConstraintError")
    return res.status(409).json({ message: "Ese registro ya existe." });
  const status = error.statusCode || error.status || 500;
  if (status >= 500) console.error("Error interno:", error.name);
  res
    .status(status)
    .json({
      message:
        status < 500
          ? error.message
          : "No pudimos completar la operación. Intentá nuevamente.",
    });
});
export default app;
