import AuthService from "../services/auth.service.js";

class AuthController {
  async register(req, res) {
    try {
      const userData = req.body;
      if (
        !userData.email ||
        !userData.password ||
        !userData.first_name ||
        !userData.last_name ||
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

  // LOGIN
  async login(req, res) {
    console.log("Cuerpo de la petición (req.body):", req.body);
    console.log("Headers de la petición (req.headers):", req.headers);
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "El correo electrónico y la contraseña son obligatorios.",
        });
      }

      const { token, user } = await AuthService.loginUser(email, password);

      // Configurar la cookie con el JWT
      // La cookie se llamará 'sessionToken' (puedes elegir otro nombre)
      res.cookie("sessionToken", token, {
        httpOnly: true, // La cookie no es accesible por JavaScript del lado del cliente (más seguro)
        secure: process.env.NODE_ENV === "production", // Usar true en producción (solo HTTPS)
        sameSite: "strict", // 'strict' o 'lax'. Ayuda a prevenir ataques CSRF.
        maxAge: 24 * 60 * 60 * 1000, // Duración de la cookie en milisegundos (ej. 1 día)
        // Coincide con la expiración del token '1d'
        // path: '/', // Opcional: la cookie es válida para todas las rutas
      });

      // Enviar respuesta exitosa
      // El frontend puede usar la información del usuario para actualizar la UI
      // y sabrá que la sesión está establecida por la presencia de la cookie.
      res.status(200).json({
        message: "Inicio de sesión exitoso.",
        user, // Contiene la info del usuario sin el hash de la contraseña
        // No es estrictamente necesario devolver el token en el cuerpo si va en la cookie,
        // pero a veces es útil para el frontend si necesita acceder a él directamente.
        // token // Puedes decidir si lo incluyes o no.
      });
    } catch (error) {
      console.error("Error en AuthController.login:", error.message);
      // Si el error viene del servicio, ya debería tener un statusCode
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Ocurrió un error en el servidor." });
    }
  }

  async logout(req, res) {
    try {
      // Limpiar la cookie del token de sesión
      res.cookie("sessionToken", "", {
        httpOnly: true,
        expires: new Date(0), // Configura la cookie para que expire inmediatamente
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        // path: '/',
      });
      res.status(200).json({ message: "Cierre de sesión exitoso." });
    } catch (error) {
      console.error("Error en AuthController.logout:", error.message);
      res.status(500).json({ message: "Error al cerrar sesión." });
    }
  }

  async confirmEmail(req, res) {
    res
      .status(501)
      .json({ message: "Confirmación de email no implementada todavía." });
  }
}

export default new AuthController();
