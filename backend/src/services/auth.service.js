// src/services/auth.service.js
import bcrypt from "bcrypt";
import db from "../daos/models/index.js"; // Importa el objeto db con todos los modelos y sequelize
import jwt from "jsonwebtoken";
// import { generateConfirmationString } from '../utils/generateId.js'; // Descomenta si lo usas

// Función para hashear contraseñas
const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

class AuthService {
  async registerUser(userData) {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phoneNumber,
      photoUrl,
      gender,
      country,
      city,
      address,
      postalCode,
      dateOfBirth,
      // Campos específicos del rol
      speciality, // Para doctores
      consultationValue, // Para doctores
      idDocumentType, // Para doctores
      idDocumentNumber, // Para doctores
      creditCardToken, // Para pacientes
    } = userData;

    // 1. Validar que el email no exista ya
    const existingUser = await db.Usuario.findOne({ where: { email } });
    if (existingUser) {
      const error = new Error("El correo electrónico ya está registrado.");
      error.statusCode = 409; // Conflict
      throw error;
    }

    // 2. Hashear la contraseña
    const hashedPassword = await hashPassword(password);

    let newUser;
    try {
      // 3. Usar una transacción de Sequelize
      await db.sequelize.transaction(async (t) => {
        newUser = await db.Usuario.create(
          {
            email,
            password_hash: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            role,
            phone_number: phoneNumber,
            photo_url: photoUrl,
            gender,
            country,
            city,
            address,
            postal_code: postalCode,
            date_of_birth: dateOfBirth,
            // confirmed: false, // Si usas confirmación de email
            // confirmation_string: generateConfirmationString(), // Si usas confirmación de email
          },
          { transaction: t }
        );

        if (role === "patient") {
          await db.Paciente.create(
            {
              user_id: newUser.id,
              credit_card_token: creditCardToken,
            },
            { transaction: t }
          );
        } else if (role === "doctor") {
          await db.Doctor.create(
            {
              user_id: newUser.id,
              speciality: speciality,
              consultation_value: consultationValue,
              id_document_type: idDocumentType,
              id_document_number: idDocumentNumber,
              // availability_status se establecerá por defecto según el modelo
            },
            { transaction: t }
          );
        } else {
          const error = new Error("Rol de usuario no válido.");
          error.statusCode = 400;
          throw error; // Esto hará rollback de la transacción
        }
      });

      // Recargar el usuario con sus perfiles asociados para devolverlo
      const createdUserWithProfile = await db.Usuario.findByPk(newUser.id, {
        include: [
          { model: db.Paciente, as: "pacienteInfo" }, // Alias definido en index.js
          { model: db.Doctor, as: "doctorInfo" }, // Alias definido en index.js
        ],
      });

      // Eliminar el hash de la contraseña de la respuesta
      const { password_hash, ...userToReturn } =
        createdUserWithProfile.toJSON();
      return userToReturn;
    } catch (error) {
      console.error("Error durante el registro o la transacción:", error);
      if (error.statusCode) {
        // Si es un error que ya hemos lanzado con statusCode
        throw error;
      }
      // Para errores de validación de Sequelize u otros errores inesperados
      const serviceError = new Error(
        error.message || "Error al registrar el usuario."
      );
      serviceError.statusCode =
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
          ? 400
          : 500;
      throw serviceError;
    }
  }

  async loginUser(email, password) {
    // 1. Validar que el email y la contraseña se proporcionaron
    if (!email || !password) {
      const error = new Error(
        "El correo electrónico y la contraseña son obligatorios."
      );
      error.statusCode = 400; // Bad Request
      throw error;
    }

    // 2. Buscar al usuario por email
    const user = await db.Usuario.findOne({
      where: { email },
      include: [
        // Incluimos los perfiles para saber el rol y datos asociados
        { model: db.Paciente, as: "pacienteInfo" },
        { model: db.Doctor, as: "doctorInfo" },
      ],
    });

    if (!user) {
      const error = new Error("Credenciales inválidas."); // Mensaje genérico por seguridad
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    // 3. (Opcional) Verificar si la cuenta está confirmada
    // if (!user.confirmed) {
    //   const error = new Error('Tu cuenta no ha sido confirmada.');
    //   error.statusCode = 403; // Forbidden
    //   throw error;
    // }

    // 4. Comparar la contraseña proporcionada con el hash almacenado
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password_hash
    );
    if (!isPasswordCorrect) {
      const error = new Error("Credenciales inválidas."); // Mensaje genérico
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    // 5. Generar el JWT
    const payload = {
      userId: user.id,
      role: user.role,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Define la expiración del token (ej. 1 día, 7d, 1h)
    );

    // 6. Preparar los datos del usuario para devolver (sin el hash)
    const { password_hash, confirmation_string, ...userToReturn } =
      user.toJSON();

    return { token, user: userToReturn }; // Devolvemos el token y la info del usuario
  }
}

export default new AuthService();
