import { Router } from "express";
import DoctorService from "../services/doctor.service.js";
import CitaService from "../services/cita.service.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { handle } from "../utils/errors.js";
const router = Router();
router.use(protect);
router.get(
  "/",
  handle(async (req, res) =>
    res.json(await DoctorService.findAllDoctors(req.query)),
  ),
);
router.get(
  "/me/disponibilidad",
  authorize("doctor"),
  handle(async (req, res) =>
    res.json(await DoctorService.getDoctorDisponibilidad(req.user.id)),
  ),
);
router.put(
  "/me/disponibilidad",
  authorize("doctor"),
  handle(async (req, res) => {
    const disponibilidades = await DoctorService.updateDoctorDisponibilidad(
      req.user.id,
      req.body,
    );
    res.json({ message: "Disponibilidad guardada.", disponibilidades });
  }),
);
router.get(
  "/:id/horarios",
  handle(async (req, res) =>
    res.json(
      await CitaService.getSlots(
        req.params.id,
        req.query.date,
        req.user,
        req.query.excludeCitaId,
      ),
    ),
  ),
);
router.get(
  "/:id",
  handle(async (req, res) =>
    res.json(await DoctorService.findDoctorProfileById(req.params.id)),
  ),
);
export default router;
