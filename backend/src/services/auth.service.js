// src/services/auth.service.js
import bcrypt from "bcrypt";
import db from "../daos/models/index.js"; // Importa el objeto db con todos los modelos y sequelize
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

  // async loginUser(email, password) { ... } (lo implementaremos después)
}

export default new AuthService();
