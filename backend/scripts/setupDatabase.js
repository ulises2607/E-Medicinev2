import db from "../src/daos/models/index.js";
// Creates missing tables only. Never use force/alter against an existing database.
try {
  await db.sequelize.sync();
  const table = db.sequelize
    .getQueryInterface()
    .queryGenerator.quoteTable(db.Usuario.getTableName());
  await db.sequelize.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_lower_unique ON " +
      table +
      " (lower(email))",
  );
  console.log("Tablas verificadas. No se borraron ni reemplazaron datos.");
} finally {
  await db.sequelize.close();
}
