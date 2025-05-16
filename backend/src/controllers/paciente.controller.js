import PacienteService from "../services/paciente.service.js";

class PacienteController {
  async getMyHistorialGeneral(req, res) {
    try {
      const pacienteUserId = req.user.id; // ID del paciente logueado
      const historial = await PacienteService.getHistorialGeneral(
        pacienteUserId
      );

      if (!historial) {
        // Puedes decidir devolver 204 No Content, o 404 si esperas que siempre exista,
        // o un objeto vacío con la estructura esperada.
        return res.status(200).json(null); // O res.status(404).json({ message: 'Historial clínico general no encontrado.' });
      }
      res.status(200).json(historial);
    } catch (error) {
      console.error(
        "Error en PacienteController.getMyHistorialGeneral:",
        error.message
      );
      res.status(error.statusCode || 500).json({
        message:
          error.message || "Error al obtener el historial clínico general.",
      });
    }
  }

  async updateMyHistorialGeneral(req, res) {
    try {
      const pacienteUserId = req.user.id; // ID del paciente logueado
      const dataToUpdate = req.body;

      const historialActualizado = await PacienteService.upsertHistorialGeneral(
        pacienteUserId,
        dataToUpdate
      );
      res.status(200).json({
        message: "Historial clínico general actualizado exitosamente.",
        historial: historialActualizado,
      });
    } catch (error) {
      console.error(
        "Error en PacienteController.updateMyHistorialGeneral:",
        error.message
      );
      res.status(error.statusCode || 500).json({
        message:
          error.message || "Error al actualizar el historial clínico general.",
      });
    }
  }

  // Aquí podrían ir más métodos para gestionar alergias, medicaciones propias, etc.....
}

export default new PacienteController();
