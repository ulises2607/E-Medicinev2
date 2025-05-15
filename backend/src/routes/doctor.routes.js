// src/routes/doctor.routes.js
import { Router } from "express";
import DoctorController from "../controllers/doctor.controller..js";
import { protect, authorize } from "../middlewares/auth.middleware.js"; // Podrías proteger estas rutas si es necesario

const router = Router();

// Listar todos los doctores (público o para usuarios logueados)
// Si es público, no se usa 'protect'. Si solo para logueados: router.get('/', protect, DoctorController.getAllDoctors);
router.get("/", DoctorController.getAllDoctors);

// Ver el perfil de un doctor específico (público o para usuarios logueados)
router.get("/:id", DoctorController.getDoctorProfileById);

// Rutas para que un doctor gestione su propia información (requieren autenticación y rol 'doctor')
// Ejemplo: Actualizar disponibilidad
// router.put(
//   "/me/disponibilidad",
//   protect,
//   authorize("doctor"),
//   DoctorController.updateMyDisponibilidad
// );
// // Ejemplo: Añadir certificado
// router.post(
//   "/me/certificados",
//   protect,
//   authorize("doctor"),
//   DoctorController.addMyCertificado
// );

export default router;
