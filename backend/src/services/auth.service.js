import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../daos/models/index.js";
import { fail } from "../utils/errors.js";
const profiles = [
  { model: db.Paciente, as: "pacienteInfo" },
  { model: db.Doctor, as: "doctorInfo" },
];
const findEmail = (email) =>
  db.Usuario.findOne({
    where: db.Sequelize.where(
      db.Sequelize.fn("lower", db.Sequelize.col("email")),
      email,
    ),
    include: profiles,
  });
const safeUser = (user) => {
  const { password_hash, confirmation_string, ...safe } = user.toJSON();
  return safe;
};
class AuthService {
  async registerUser(data) {
    if (await findEmail(data.email))
      fail(409, "El correo electrónico ya está registrado.");
    const password_hash = await bcrypt.hash(data.password, 12);
    try {
      const id = await db.sequelize.transaction(async (transaction) => {
        const user = await db.Usuario.create(
          {
            email: data.email,
            password_hash,
            first_name: data.first_name,
            last_name: data.last_name,
            role: data.role,
            gender: data.gender,
            confirmed: false,
          },
          { transaction },
        );
        if (data.role === "doctor")
          await db.Doctor.create(
            { user_id: user.id, speciality: data.speciality },
            { transaction },
          );
        else await db.Paciente.create({ user_id: user.id }, { transaction });
        return user.id;
      });
      return safeUser(await db.Usuario.findByPk(id, { include: profiles }));
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError")
        fail(409, "El correo electrónico ya está registrado.");
      throw error;
    }
  }
  async loginUser(email, password) {
    const user = await findEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      fail(401, "Correo o contraseña incorrectos.");
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "1d",
    });
    return { token, user: safeUser(user) };
  }
  async updateUserProfile(userId, data) {
    const user = await db.Usuario.findByPk(userId, { include: profiles });
    if (!user) fail(404, "Usuario no encontrado.");
    const fields = {
      firstName: "first_name", lastName: "last_name", phoneNumber: "phone_number",
      photoUrl: "photo_url", gender: "gender", country: "country", city: "city",
      address: "address", postalCode: "postal_code", dateOfBirth: "date_of_birth"
    };
    const doctorFields = {
      speciality: "speciality", consultationValue: "consultation_value",
      idDocumentType: "id_document_type", idDocumentNumber: "id_document_number",
      availabilityStatus: "availability_status"
    };
    const pick = (mapping) => Object.fromEntries(
      Object.entries(mapping).filter(([key]) => data[key] !== undefined)
        .map(([key, column]) => [column, data[key]])
    );
    try {
      await db.sequelize.transaction(async (transaction) => {
        await user.update(pick(fields), { transaction });
        if (user.role === "doctor" && user.doctorInfo) {
          await user.doctorInfo.update(pick(doctorFields), { transaction });
        }
        if (user.role === "patient" && user.pacienteInfo && data.creditCardToken !== undefined) {
          await user.pacienteInfo.update({ credit_card_token: data.creditCardToken }, { transaction });
        }
      });
      return safeUser(await db.Usuario.findByPk(userId, { include: profiles }));
    } catch (error) {
      if (error.name === "SequelizeValidationError") fail(400, "Revisá los datos del perfil.");
      throw error;
    }
  }
}
export default new AuthService();
