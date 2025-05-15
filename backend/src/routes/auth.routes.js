import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";

const router = Router();

// Ruta para registrar un nuevo usuario (paciente o doctor)
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

// Ruta para confirmar email (si la implementas)
// router.get('/confirm/:confirmationString', AuthController.confirmEmail);

export default router;
