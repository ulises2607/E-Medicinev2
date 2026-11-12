import CitaService from "../services/cita.service.js";
class CitaController {
  async getResumen(req, res) {
    res.json(await CitaService.getSummary(req.user.id, req.user.role));
  }
  async agendarCita(req, res) {
    const cita = await CitaService.agendarCita(req.user.id, req.body || {});
    res
      .status(201)
      .json({
        message: "Turno reservado. Falta la confirmación del profesional.",
        cita,
      });
  }
  async getMisCitasComoPaciente(req, res) {
    res.json(await CitaService.getCitasPorPaciente(req.user.id, req.query));
  }
  async getMisCitasComoDoctor(req, res) {
    res.json(await CitaService.getCitasPorDoctor(req.user.id, req.query));
  }
  async getCitaDetallada(req, res) {
    res.json(
      await CitaService.getCitaById(
        req.params.citaId,
        req.user.id,
        req.user.role,
      ),
    );
  }
  async actualizarEstadoCita(req, res) {
    const cita = await CitaService.updateStatusCita(
      req.params.citaId,
      req.body?.status,
      req.user.id,
      req.user.role,
    );
    res.json({ message: "Turno actualizado.", cita });
  }
  async reprogramar(req, res) {
    const cita = await CitaService.reschedule(
      req.params.citaId,
      req.body || {},
      req.user.id,
      req.user.role,
    );
    res.json({
      message: "Turno reprogramado. Queda pendiente de confirmación.",
      cita,
    });
  }
}
export default new CitaController();
