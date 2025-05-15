import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js"; // Importa el middleware protect
// Asumamos que tienes un UserController con un método getMyProfile
// import UserController from '../controllers/user.controller.js';

const router = Router();

// Ruta para obtener el perfil del usuario logueado
// Primero se ejecuta 'protect', si es exitoso, luego se ejecuta UserController.getMyProfile
// router.get('/profile', protect, UserController.getMyProfile);

// Ruta de prueba para ver si req.user está disponible
router.get("/me", protect, (req, res) => {
  if (req.user) {
    res.status(200).json({ message: "Estás autenticado.", user: req.user });
  } else {
    // Esto no debería suceder si 'protect' funciona bien
    res
      .status(500)
      .json({
        message: "Error, req.user no está definido después de protect.",
      });
  }
});

export default router;
