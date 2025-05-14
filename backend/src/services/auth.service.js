import bcrypt from "bcrypt";
import db from "../daos/models";
import { generateConfirmationString } from "../utils/generateId";

// Funcion para hashear contraseñas
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
      phone_number,
      photo_url,
      gender,
      country,
      city,
      address,
      postal_code,
      date_of_birth,
      role,
    } = userData;

    // Verificacion de existencia previa
    const existingUser = await db.Usuario.findOne({ where: { email } });
    if (existingUser) {
      const error = new Error("El correo electronico ya esta registrado. ");
      error.statusCode = 409; // Conflict
      throw error;
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);

    let newUser;
    try {
      await db.sequelize.transaction(async (t) => {
        // Crear el registro en la tabla 'usuarios'
        newUser = await db.Usuario.create(
          {
            email,
            password_hash: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            role: userData.role,
            phone_number: userData.phoneNumber,
            photo_url: userData.photoUrl,
            gender: userData.gender,
            country: userData.country,
            city: userData.city,
            address: userData.address,
            postal_code: userData.postalCode,
            date_of_birth: userData.dateOfBirth,
          },
          { transaction: t }
        );

        // Crear el registro específico del rol
        if (role === "patient") {
          await db.Paciente.create(
            {
              user_id: newUser.id, // La clave foránea es el id del usuario recién creado
              // credit_card_token: userData.creditCardToken, // Si se proporciona
            },
            { transaction: t }
          );
        } else if (role === "doctor") {
          await db.Doctor.create(
            {
              user_id: newUser.id,
              speciality: speciality, // Asegúrate de que este dato llegue en userData
              consultation_value: consultationValue, // Y este también
              // ...otros campos específicos de doctor si los hay en el registro inicial
            },
            { transaction: t }
          );
        } else {
          // Manejar roles no válidos
          const error = new Error("Rol de usuario no válido.");
          error.statusCode = 400;
          throw error;
        }
      });

      // Si todo fue bien, newUser contiene la instancia del usuario creado
      // Podríamos querer recargar el usuario con sus asociaciones para devolverlo completo
      const createdUserWithProfile = await db.Usuario.findByPk(newUser.id, {
        include: [
          { model: db.Paciente, as: "pacienteInfo" },
          { model: db.Doctor, as: "doctorInfo" },
        ],
      });

      // No devolvemos el hash de la contraseña
      const { password_hash, ...userWithoutPassword } =
        createdUserWithProfile.toJSON();
      return userWithoutPassword;
    } catch (error) {
      // Si el error ya tiene statusCode (lanzado por nosotros), lo relanzamos
      if (error.statusCode) {
        throw error;
      }
      // Si es un error de Sequelize (ej. validación del modelo) u otro error
      console.error("Error en la transacción de registro:", error);
      const serviceError = new Error("Error al registrar el usuario.");
      serviceError.statusCode = 500; // Internal Server Error

      throw serviceError;
    }
  }
}
