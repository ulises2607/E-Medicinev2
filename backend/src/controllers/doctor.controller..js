import DoctorService from "../services/doctor.service.js";

class DoctorController {
  async getAllDoctors(req, res) {
    try {
      const queryParams = req.query; // Para filtros como /api/doctores?speciality=Cardiologia
      const doctores = await DoctorService.findAllDoctors(queryParams);
      res.status(200).json(doctores);
    } catch (error) {
      console.error("Error en DoctorController.getAllDoctors:", error.message);
      res.status(500).json({
        message: error.message || "Error al obtener la lista de doctores.",
      });
    }
  }

  async getDoctorProfileById(req, res) {
    try {
      const { id } = req.params;
      const doctorProfile = await DoctorService.findDoctorProfileById(id);
      res.status(200).json(doctorProfile);
    } catch (error) {
      console.error(
        "Error en DoctorController.getDoctorProfileById:",
        error.message
      );
      res.status(error.statusCode || 500).json({
        message: error.message || "Error al obtener el perfil del doctor.",
      });
    }
  }

  async getMyDisponibilidad(req, res) {
    try {
      const doctorId = req.user.id; // El doctor logueado obtiene su propia disponibilidad
      const disponibilidades = await DoctorService.getDoctorDisponibilidad(
        doctorId
      );
      res.status(200).json(disponibilidades);
    } catch (error) {
      console.error(
        "Error en DoctorController.getMyDisponibilidad:",
        error.message
      );
      res
        .status(500)
        .json({
          message: error.message || "Error al obtener la disponibilidad.",
        });
    }
  }

  async updateMyDisponibilidad(req, res) {
    try {
      const doctorId = req.user.id; // El doctor logueado actualiza su propia disponibilidad
      const disponibilidadesData = req.body; // Se espera un array de objetos de disponibilidad

      if (!disponibilidadesData || !Array.isArray(disponibilidadesData)) {
        return res
          .status(400)
          .json({
            message:
              "Se requiere un array de datos de disponibilidad en el cuerpo de la petición.",
          });
      }

      const updatedDisponibilidades =
        await DoctorService.updateDoctorDisponibilidad(
          doctorId,
          disponibilidadesData
        );
      res
        .status(200)
        .json({
          message: "Disponibilidad actualizada exitosamente.",
          disponibilidades: updatedDisponibilidades,
        });
    } catch (error) {
      console.error(
        "Error en DoctorController.updateMyDisponibilidad:",
        error.message
      );
      res
        .status(error.statusCode || 500)
        .json({
          message: error.message || "Error al actualizar la disponibilidad.",
        });
    }
  }
}

export default new DoctorController();
