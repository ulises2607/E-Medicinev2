import AuthService from "../services/auth.service.js";
import { fail } from "../utils/errors.js";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};
const normalizeEmail = (v) =>
  typeof v === "string" ? v.trim().toLowerCase() : "";
class AuthController {
  async register(req, res) {
    const data = req.body || {},
      email = normalizeEmail(data.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      fail(400, "Ingresá un correo electrónico válido.");
    for (const key of ["first_name", "last_name"]) {
      if (
        typeof data[key] !== "string" ||
        data[key].trim().length < 2 ||
        data[key].trim().length > 100
      )
        fail(400, "Nombre y apellido deben tener entre 2 y 100 caracteres.");
    }
    if (
      typeof data.password !== "string" ||
      data.password.length < 8 ||
      Buffer.byteLength(data.password, "utf8") > 72
    )
      fail(
        400,
        "La contraseña debe tener al menos 8 caracteres y hasta 72 bytes.",
      );
    if (!["patient", "doctor"].includes(data.role))
      fail(400, "Seleccioná paciente o profesional.");
    if (
      data.role === "doctor" &&
      (typeof data.speciality !== "string" ||
        data.speciality.trim().length < 3 ||
        data.speciality.trim().length > 255)
    )
      fail(400, "Ingresá una especialidad válida.");
    if (data.gender && !["male", "female", "other"].includes(data.gender))
      fail(400, "Género inválido.");
    const user = await AuthService.registerUser({
      email,
      password: data.password,
      role: data.role,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      speciality: data.role === "doctor" ? data.speciality.trim() : undefined,
      gender: data.gender || undefined,
    });
    res
      .status(201)
      .json({ message: "Cuenta creada. Ya podés iniciar sesión.", user });
  }
  async login(req, res) {
    const email = normalizeEmail(req.body?.email),
      password = req.body?.password;
    if (
      !email ||
      typeof password !== "string" ||
      !password ||
      Buffer.byteLength(password, "utf8") > 72
    )
      fail(400, "Ingresá correo y contraseña válidos.");
    const { token, user } = await AuthService.loginUser(email, password);
    res.cookie("sessionToken", token, { ...cookieOptions, maxAge: 86400000 });
    res.json({ message: "Sesión iniciada.", user });
  }
  async logout(req, res) {
    res.clearCookie("sessionToken", cookieOptions);
    res.json({ message: "Sesión cerrada." });
  }
}
export default new AuthController();
