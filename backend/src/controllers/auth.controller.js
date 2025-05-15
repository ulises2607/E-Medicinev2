import AuthService from "../services/auth.service.js";

class AuthController {
  async register(req, res) {
    try {
      const userData = req.body;
      if (
        !userData.email ||
        !userData.password ||
        !userData.firstName ||
        !userData.lastName ||
        !userData.role
      ) {
        return res.status(400).json({
          message:
            "Faltan campos obligatorios: email, password, firstName, lastName, role.",
        });
      }
      if (!["patient", "doctor"].includes(userData.role)) {
        return res
          .status(400)
          .json({ message: 'Rol no válido. Debe ser "patient" o "doctor".' });
      }
      if (userData.role === "doctor" && !userData.speciality) {
        return res.status(400).json({
          message: "Para el rol de doctor, la especialidad es obligatoria.",
        });
      }

      const newUser = await AuthService.registerUser(userData);
      res
        .status(201)
        .json({ message: "Usuario registrado exitosamente.", user: newUser });
    } catch (error) {
      console.error("Error en AuthController.register:", error.message); // para depurar
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Ocurrió un error en el servidor." });
    }
  }

  async login(req, res) {
    res.status(501).json({ message: "Login no implementado todavía." });
  }

  async confirmEmail(req, res) {
    res
      .status(501)
      .json({ message: "Confirmación de email no implementada todavía." });
  }
}

export default new AuthController();
