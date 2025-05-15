// En src/routes/doctor.routes.js (tendrías que crear este archivo y su controlador)
import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/dashboard-doctor", protect, authorize("doctor"), (req, res) => {
  // Esta lógica solo se ejecutará si el usuario está logueado Y tiene el rol 'doctor'
  res
    .status(200)
    .json({ message: `Bienvenido al dashboard, Dr. ${req.user.last_name}` });
});

export default router;
