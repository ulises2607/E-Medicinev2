import CitaService from "../services/cita.service.js";

class CitaController {
  async agendarCita(req, res) {
    try {
      const pacienteId = req.user.id; // El paciente logueado agenda la cita para sí mismo
      const citaData = req.body;

      // Validaciones básicas en el controlador
      if (
        !citaData.doctorId ||
        !citaData.appointmentDate ||
        !citaData.startTime ||
        !citaData.endTime
      ) {
        return res
          .status(400)
          .json({
            message:
              "Faltan campos obligatorios: doctorId, appointmentDate, startTime, endTime.",
          });
      }
      // Podrías añadir más validaciones de formato aquí si es necesario

      const nuevaCita = await CitaService.agendarCita(pacienteId, citaData);
      res
        .status(201)
        .json({ message: "Cita agendada exitosamente.", cita: nuevaCita });
    } catch (error) {
      console.error("Error en CitaController.agendarCita:", error.message);
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Error al agendar la cita." });
    }
  }

  async getMisCitasComoPaciente(req, res) {
    try {
      const pacienteId = req.user.id;
      const queryParams = req.query; // Para filtros ?status=pending
      const citas = await CitaService.getCitasPorPaciente(
        pacienteId,
        queryParams
      );
      res.status(200).json(citas);
    } catch (error) {
      console.error(
        "Error en CitaController.getMisCitasComoPaciente:",
        error.message
      );
      res
        .status(500)
        .json({ message: error.message || "Error al obtener tus citas." });
    }
  }

  async getMisCitasComoDoctor(req, res) {
    try {
      const doctorId = req.user.id;
      const queryParams = req.query;
      const citas = await CitaService.getCitasPorDoctor(doctorId, queryParams);
      res.status(200).json(citas);
    } catch (error) {
      console.error(
        "Error en CitaController.getMisCitasComoDoctor:",
        error.message
      );
      res
        .status(500)
        .json({ message: error.message || "Error al obtener tus citas." });
    }
  }

  async getCitaDetallada(req, res) {
    try {
      const { citaId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const cita = await CitaService.getCitaById(citaId, userId, userRole);
      res.status(200).json(cita);
    } catch (error) {
      console.error("Error en CitaController.getCitaDetallada:", error.message);
      res
        .status(error.statusCode || 500)
        .json({
          message: error.message || "Error al obtener el detalle de la cita.",
        });
    }
  }

  async actualizarEstadoCita(req, res) {
    try {
      const { citaId } = req.params;
      const { status } = req.body; // El nuevo estado viene en el body
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!status) {
        return res
          .status(400)
          .json({ message: "El nuevo estado es obligatorio." });
      }

      const citaActualizada = await CitaService.updateStatusCita(
        citaId,
        status,
        userId,
        userRole
      );
      res
        .status(200)
        .json({
          message: "Estado de la cita actualizado.",
          cita: citaActualizada,
        });
    } catch (error) {
      console.error(
        "Error en CitaController.actualizarEstadoCita:",
        error.message
      );
      res
        .status(error.statusCode || 500)
        .json({
          message: error.message || "Error al actualizar el estado de la cita.",
        });
    }
  }
}

export default new CitaController();
