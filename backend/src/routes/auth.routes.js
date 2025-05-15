import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";

const router = Router();

// Ruta para registrar un nuevo usuario (paciente o doctor)
router.post("/register", AuthController.register);

// Ruta para iniciar sesión (la implementaremos luego)
// router.post('/login', AuthController.login);

// Ruta para confirmar email (si la implementas)
// router.get('/confirm/:confirmationString', AuthController.confirmEmail);

export default router;
