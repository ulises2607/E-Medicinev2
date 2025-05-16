import { Router } from "express";
import PacienteController from "../controllers/paciente.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// Rutas para que el paciente logueado gestione su propio historial general
// Todas requieren autenticación y que el rol sea 'patient'
router.get(
  "/me/historial-general",
  protect,
  authorize("patient"),
  PacienteController.getMyHistorialGeneral
);
router.put(
  "/me/historial-general",
  protect,
  authorize("patient"),
  PacienteController.updateMyHistorialGeneral
);

export default router;
