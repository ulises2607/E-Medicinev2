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
}

export default new DoctorController();
