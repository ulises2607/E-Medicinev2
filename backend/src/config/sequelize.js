import "dotenv/config";
import { Sequelize } from "sequelize";
if (!process.env.DATABASE_URL)
  throw new Error("Falta DATABASE_URL en backend/.env.");
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions:
    process.env.DB_SSL === "true"
      ? {
          ssl: {
            require: true,
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
          },
        }
      : {},
  pool: { max: 5, min: 0, idle: 10000 },
  define: {
    schema: process.env.DB_SCHEMA || "public",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
});
export const testDbConnection = () => sequelize.authenticate();
export default sequelize;
