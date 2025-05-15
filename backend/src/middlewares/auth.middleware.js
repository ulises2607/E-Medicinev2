// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import db from "../daos/models/index.js"; // Para buscar al usuario si es necesario

export const protect = async (req, res, next) => {
  let token;

  // 1. Leer el token de la cookie
  if (req.cookies && req.cookies.sessionToken) {
    token = req.cookies.sessionToken;
  }
  // Alternativamente, podrías leerlo de un header 'Authorization: Bearer TOKEN'
  // else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
  //   try {
  //     token = req.headers.authorization.split(' ')[1];
  //   } catch (error) {
  //     console.error('Error al parsear el token del header Authorization:', error);
  //     return res.status(401).json({ message: 'No autorizado, token con formato incorrecto.' });
  //   }
  // }

  if (!token) {
    return res
      .status(401)
      .json({ message: "No autorizado, no se encontró token." });
  }

  try {
    // 2. Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. (Opcional pero recomendado) Obtener el usuario de la BD para asegurarse de que aún existe
    // y añadirlo a la petición. Esto también permite tener datos frescos del usuario.
    // Podrías decidir si necesitas incluir el perfil de paciente/doctor aquí o no,
    // dependiendo de si esa info se requiere comúnmente en rutas protegidas.
    const currentUser = await db.Usuario.findByPk(decoded.userId, {
      attributes: { exclude: ["password_hash", "confirmation_string"] }, // No enviar datos sensibles
    });

    if (!currentUser) {
      return res
        .status(401)
        .json({ message: "No autorizado, usuario no encontrado." });
    }

    // 4. Añadir el usuario (o su info decodificada) al objeto req
    req.user = currentUser; // Ahora req.user estará disponible en los siguientes middlewares/controladores
    // Alternativamente, podrías hacer: req.user = decoded; si solo necesitas el payload del token.

    next(); // Continuar al siguiente middleware o controlador
  } catch (error) {
    console.error("Error de autenticación:", error.message);
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "No autorizado, token inválido." });
    }
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "No autorizado, el token ha expirado." });
    }
    return res.status(401).json({ message: "No autorizado." });
  }
};

// Middleware para restringir acceso basado en roles
export const authorize = (...roles) => {
  // Recibe una lista de roles permitidos
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // req.user debe ser establecido por el middleware 'protect'
      return res.status(401).json({ message: "No autorizado." });
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: `Acceso denegado. Rol '${req.user.role}' no tiene permiso para este recurso.`,
        });
    }
    next();
  };
};
