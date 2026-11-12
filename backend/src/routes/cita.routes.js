import { Router } from "express";
import CitaController from "../controllers/cita.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { handle } from "../utils/errors.js";
const router = Router();
router.use(protect);
router.get("/resumen", authorize("patient", "doctor"), handle(CitaController.getResumen));
router.post("/", authorize("patient"), handle(CitaController.agendarCita));
router.get(
  "/paciente/me",
  authorize("patient"),
  handle(CitaController.getMisCitasComoPaciente),
);
router.get(
  "/doctor/me",
  authorize("doctor"),
  handle(CitaController.getMisCitasComoDoctor),
);
router.get("/:citaId", handle(CitaController.getCitaDetallada));
router.put("/:citaId/status", handle(CitaController.actualizarEstadoCita));
router.put("/:citaId/reprogramar", handle(CitaController.reprogramar));
export default router;
