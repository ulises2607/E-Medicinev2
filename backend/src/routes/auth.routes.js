import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import AuthController from "../controllers/auth.controller.js";
import { handle } from "../utils/errors.js";
const router = Router();
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos. Volvé a intentar en unos minutos.",
  },
});
router.post("/register", authLimiter, handle(AuthController.register));
router.post("/login", authLimiter, handle(AuthController.login));
router.post("/logout", handle(AuthController.logout));
export default router;
