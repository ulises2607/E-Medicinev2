import app from "./app.js";
import sequelize from "./config/sequelize.js";
await sequelize.authenticate();
const server = app.listen(process.env.PORT || 4700, () =>
  console.log("E-Medicine API lista."),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    }),
  );
