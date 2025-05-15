// src/routes/user.routes.js
import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import UserController from "../controllers/user.controller.js"; // <--- Importar UserController

const router = Router();

// Ruta para obtener el perfil del usuario logueado
router.get("/me", protect, UserController.getMyProfile);
router.put("/me", protect, UserController.updateMyProfile);

export default router;
