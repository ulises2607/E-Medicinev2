import jwt from "jsonwebtoken";
import db from "../daos/models/index.js";
export async function protect(req, res, next) {
  const token = req.cookies?.sessionToken;
  if (!token)
    return res.status(401).json({ message: "Iniciá sesión para continuar." });
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    return res
      .status(401)
      .json({ message: "La sesión venció. Volvé a iniciar sesión." });
  }
  try {
    const user = await db.Usuario.findByPk(decoded.userId, {
      attributes: ["id", "email", "first_name", "last_name", "role"],
    });
    if (!user) return res.status(401).json({ message: "Sesión inválida." });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Iniciá sesión para continuar." });
    if (!roles.includes(req.user.role))
      return res
        .status(403)
        .json({ message: "No tenés permiso para esta acción." });
    next();
  };
