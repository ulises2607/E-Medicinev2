import { test, expect, type Page } from "@playwright/test";
const password = "Test-only-password-123";
async function register(page: Page, email: string, role: "doctor" | "patient") {
  await page.goto("/auth/sign-up");
  await page
    .getByLabel(role === "doctor" ? "Soy profesional" : "Soy paciente", {
      exact: true,
    })
    .check();
  await page
    .getByLabel("Nombre", { exact: true })
    .fill(role === "doctor" ? "Profesional" : "Paciente");
  await page.getByLabel("Apellido", { exact: true }).fill("Prueba");
  await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
  if (role === "doctor")
    await page
      .getByLabel("Especialidad", { exact: true })
      .fill("Clínica general");
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByLabel("Repetir contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tu cuenta está lista" }),
  ).toBeVisible();
}
async function login(page: Page, email: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Hola,/ })).toBeVisible();
}
test("registro → disponibilidad → reserva → confirmación → reprogramación → cancelación", async ({
  browser,
}) => {
  const id = Date.now(),
    doctorEmail = "doctor-" + id + "@example.test",
    patientEmail = "patient-" + id + "@example.test";
  const base = process.env.E2E_BASE_URL || "http://localhost:3000";
  const doctorContext = await browser.newContext({ baseURL: base }),
    patientContext = await browser.newContext({
      baseURL: base,
      viewport: { width: 390, height: 844 },
    });
  const doctor = await doctorContext.newPage(),
    patient = await patientContext.newPage();
  await register(doctor, doctorEmail, "doctor");
  await login(doctor, doctorEmail);
  const doctorId = doctor.url().split("/").pop()!;
  await doctor
    .getByRole("link", { name: "Disponibilidad", exact: true })
    .click();
  for (const day of [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ])
    await doctor.getByLabel(day, { exact: true }).check();
  await doctor.getByRole("button", { name: "Guardar disponibilidad" }).click();
  await expect(doctor.getByRole("status")).toContainText(
    "Disponibilidad guardada",
  );
  await register(patient, patientEmail, "patient");
  await login(patient, patientEmail);
  await patient.reload();
  await expect(patient.getByRole("heading", { name: /Hola,/ })).toBeVisible();
  await patient
    .getByRole("link", { name: "Reservar turno", exact: true })
    .first()
    .click();
  await patient
    .getByLabel("Profesional", { exact: true })
    .selectOption(doctorId);
  const future = new Date();
  future.setUTCDate(future.getUTCDate() + 7);
  const date = future.toISOString().slice(0, 10);
  await patient.getByLabel("Fecha del turno").fill(date);
  await patient.getByRole("button", { name: "09:00", exact: true }).click();
  await patient
    .getByLabel("Motivo de la consulta")
    .fill("Consulta de prueba del flujo completo");
  await patient
    .getByRole("button", { name: "Confirmar reserva", exact: true })
    .click();
  await expect(
    patient.getByRole("heading", { name: "Detalle del turno" }),
  ).toBeVisible();
  const appointmentPath = new URL(patient.url()).pathname;
  await expect(patient.locator(".badge")).toHaveText("Pendiente");
  await doctor.goto(appointmentPath);
  await doctor
    .getByRole("button", { name: "Confirmar turno", exact: true })
    .click();
  await expect(doctor.locator(".badge")).toHaveText("Confirmado");
  await patient.reload();
  await expect(patient.locator(".badge")).toHaveText("Confirmado");
  await patient
    .getByRole("button", { name: "Reprogramar", exact: true })
    .click();
  await patient.getByLabel("Fecha del turno").fill(date);
  await patient.getByRole("button", { name: "09:30", exact: true }).click();
  await patient.getByRole("button", { name: "Guardar nuevo horario" }).click();
  await expect(patient.locator(".badge")).toHaveText("Pendiente");
  await expect(patient.getByRole("heading", { name: /09:30 h/ })).toBeVisible();
  await doctor.reload();
  await expect(doctor.getByRole("heading", { name: /09:30 h/ })).toBeVisible();
  await doctor
    .getByRole("button", { name: "Cancelar turno", exact: true })
    .click();
  await doctor
    .getByRole("button", { name: "Sí, cancelar", exact: true })
    .click();
  await expect(doctor.locator(".badge")).toHaveText("Cancelado");
  await patient.reload();
  await expect(patient.locator(".badge")).toHaveText("Cancelado");
  await expect(
    patient.getByRole("button", { name: "Reprogramar", exact: true }),
  ).toHaveCount(0);
  await patient.screenshot({
    path: "test-results/patient-mobile.png",
    fullPage: true,
  });
  await doctor.screenshot({
    path: "test-results/doctor-desktop.png",
    fullPage: true,
  });
  await patient.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(patient).toHaveURL(/\/auth\/login$/);
  await patient.goto(appointmentPath);
  await expect(patient).toHaveURL(/\/auth\/login$/);
  await doctorContext.close();
  await patientContext.close();
});
test("muestra errores de login sin abrir una sesión", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel("Correo electrónico").fill("missing@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Correo o contraseña incorrectos" }),
  ).toBeVisible();
});
