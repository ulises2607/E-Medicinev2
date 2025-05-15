import db from "../daos/models/index.js";
import AuthService from "../services/auth.service.js";

class UserController {
  async getMyProfile(req, res) {
    try {
      // req.user es establecido por el middleware 'protect' y contiene el id, email, role, etc.
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "No autorizado o usuario no encontrado en la petición.",
        });
      }

      // Buscamos el usuario completo con sus perfiles asociados
      const fullUserProfile = await db.Usuario.findByPk(req.user.id, {
        attributes: { exclude: ["password_hash", "confirmation_string"] }, // Excluir campos sensibles
        include: [
          {
            model: db.Paciente,
            as: "pacienteInfo", // Alias definido en models/index.js
          },
          {
            model: db.Doctor,
            as: "doctorInfo", // Alias definido en models/index.js
            include: [
              // Si quieres incluir también los certificados y disponibilidad del doctor
              { model: db.CertificadoProfesional, as: "certificados" },
              { model: db.DisponibilidadDoctor, as: "disponibilidades" },
            ],
          },
        ],
      });

      if (!fullUserProfile) {
        return res
          .status(404)
          .json({ message: "Perfil de usuario no encontrado." });
      }

      res.status(200).json({ user: fullUserProfile });
    } catch (error) {
      console.error(
        "Error en UserController.getMyProfile:",
        error.message,
        error.stack
      );
      res
        .status(500)
        .json({ message: "Error al obtener el perfil del usuario." });
    }
  }

  async updateMyProfile(req, res) {
    try {
      const userId = req.user.id; // Obtenemos el ID del usuario autenticado
      const updateData = req.body; // Los datos a actualizar vienen en el cuerpo

      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ message: "No se proporcionaron datos para actualizar." });
      }

      // No permitir actualizar email o rol directamente desde este endpoint
      delete updateData.email;
      delete updateData.role;
      delete updateData.password; // La contraseña se actualiza por otro medio

      const updatedUser = await AuthService.updateUserProfile(
        userId,
        updateData
      );
      res
        .status(200)
        .json({
          message: "Perfil actualizado exitosamente.",
          user: updatedUser,
        });
    } catch (error) {
      console.error(
        "Error en UserController.updateMyProfile:",
        error.message,
        error.stack
      );
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Error al actualizar el perfil." });
    }
  }
}

export default new UserController();
