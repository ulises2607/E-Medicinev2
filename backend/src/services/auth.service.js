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
      first_name,
      last_name,
      role,
      phone_number,
      photo_url,
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
            first_name: first_name,
            last_name: last_name,
            role: role,
            phone_number: phone_number,
            photo_url: photo_url,
            gender: gender,
            country,
            city,
            address,
            postal_code: postalCode,
            date_of_birth: dateOfBirth,
            confirmed: true,
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

  async updateUserProfile(userId, updateData) {
    const {
      // Campos comunes de la tabla 'usuarios' que se pueden actualizar
      firstName,
      lastName,
      phoneNumber,
      photoUrl,
      gender,
      country,
      city,
      address,
      postalCode,
      dateOfBirth,
      // Campos específicos del rol
      // Para Paciente:
      creditCardToken,
      // Para Doctor:
      speciality,
      consultationValue,
      idDocumentType,
      idDocumentNumber,
      availabilityStatus,
      // No permitimos cambiar email o rol desde aquí por simplicidad y seguridad
      // El cambio de contraseña tendría su propio endpoint/flujo
    } = updateData;

    const user = await db.Usuario.findByPk(userId, {
      include: [
        // Incluimos los perfiles para saber el rol
        { model: db.Paciente, as: "pacienteInfo" },
        { model: db.Doctor, as: "doctorInfo" },
      ],
    });

    if (!user) {
      const error = new Error("Usuario no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    // Separar los campos que van a la tabla 'usuarios'
    const userDataToUpdate = {};
    if (firstName !== undefined) userDataToUpdate.first_name = firstName;
    if (lastName !== undefined) userDataToUpdate.last_name = lastName;
    if (phoneNumber !== undefined) userDataToUpdate.phone_number = phoneNumber;
    if (photoUrl !== undefined) userDataToUpdate.photo_url = photoUrl;
    if (gender !== undefined) userDataToUpdate.gender = gender;
    if (country !== undefined) userDataToUpdate.country = country;
    if (city !== undefined) userDataToUpdate.city = city;
    if (address !== undefined) userDataToUpdate.address = address;
    if (postalCode !== undefined) userDataToUpdate.postal_code = postalCode;
    if (dateOfBirth !== undefined) userDataToUpdate.date_of_birth = dateOfBirth;

    try {
      await db.sequelize.transaction(async (t) => {
        // Actualizar la tabla 'usuarios' si hay datos para ello
        if (Object.keys(userDataToUpdate).length > 0) {
          await user.update(userDataToUpdate, { transaction: t });
        }

        // Actualizar la tabla 'pacientes' o 'doctores' según el rol
        if (user.role === "patient" && user.pacienteInfo) {
          const patientDataToUpdate = {};
          if (creditCardToken !== undefined)
            patientDataToUpdate.credit_card_token = creditCardToken;
          // Añadir más campos específicos de paciente aquí si los tienes

          if (Object.keys(patientDataToUpdate).length > 0) {
            await user.pacienteInfo.update(patientDataToUpdate, {
              transaction: t,
            });
          }
        } else if (user.role === "doctor" && user.doctorInfo) {
          const doctorDataToUpdate = {};
          if (speciality !== undefined)
            doctorDataToUpdate.speciality = speciality;
          if (consultationValue !== undefined)
            doctorDataToUpdate.consultation_value = consultationValue;
          if (idDocumentType !== undefined)
            doctorDataToUpdate.id_document_type = idDocumentType;
          if (idDocumentNumber !== undefined)
            doctorDataToUpdate.id_document_number = idDocumentNumber;
          if (availabilityStatus !== undefined)
            doctorDataToUpdate.availability_status = availabilityStatus;
          // Añadir más campos específicos de doctor aquí

          if (Object.keys(doctorDataToUpdate).length > 0) {
            await user.doctorInfo.update(doctorDataToUpdate, {
              transaction: t,
            });
          }
        }
      });

      // Recargar el usuario con la información actualizada
      const updatedUserProfile = await db.Usuario.findByPk(userId, {
        attributes: { exclude: ["password_hash", "confirmation_string"] },
        include: [
          { model: db.Paciente, as: "pacienteInfo" },
          {
            model: db.Doctor,
            as: "doctorInfo",
            include: [
              { model: db.CertificadoProfesional, as: "certificados" },
              { model: db.DisponibilidadDoctor, as: "disponibilidades" },
            ],
          },
        ],
      });
      return updatedUserProfile.toJSON(); // Devolvemos el objeto plano
    } catch (error) {
      console.error("Error al actualizar el perfil del usuario:", error);
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        const validationError = new Error(
          error.errors.map((e) => e.message).join(", ")
        );
        validationError.statusCode = 400;
        throw validationError;
      }
      const serviceError = new Error(
        "Error al actualizar el perfil del usuario."
      );
      serviceError.statusCode = 500;
      throw serviceError;
    }
  }
}

export default new AuthService();
