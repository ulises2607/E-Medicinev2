import { Router } from "express";
import CitaController from "../controllers/cita.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// Agendar una nueva cita (solo pacientes)
router.post("/", protect, authorize("patient"), CitaController.agendarCita);

// Obtener las citas del paciente logueado
router.get(
  "/paciente/me",
  protect,
  authorize("patient"),
  CitaController.getMisCitasComoPaciente
);

// Obtener las citas del doctor logueado
router.get(
  "/doctor/me",
  protect,
  authorize("doctor"),
  CitaController.getMisCitasComoDoctor
);

// Obtener el detalle de una cita específica (paciente, doctor de la cita, o admin)
router.get("/:citaId", protect, CitaController.getCitaDetallada);

// Actualizar el estado de una cita (ej. cancelar, confirmar, completar)
router.put("/:citaId/status", protect, CitaController.actualizarEstadoCita);

export default router;
