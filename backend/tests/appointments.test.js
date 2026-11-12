import jwt from "jsonwebtoken";
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import pg from "pg";
import request from "supertest";

// Only this explicitly supplied, local *_test database can be used. Each run owns one random schema.
const url = process.env.TEST_DATABASE_URL;
if (!url)
  throw new Error(
    "Definí TEST_DATABASE_URL apuntando a una base local cuyo nombre termine en _test.",
  );
const target = new URL(url);
if (
  !["127.0.0.1", "localhost"].includes(target.hostname) ||
  !target.pathname.endsWith("_test")
)
  throw new Error("Las pruebas sólo aceptan una base local *_test.");
const schema = "test_" + randomBytes(6).toString("hex");
process.env.DATABASE_URL = url;
process.env.DB_SCHEMA = schema;
process.env.DB_SSL = "false";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(48).toString("hex");
process.env.FRONTEND_URL = "http://localhost:3000";
const { default: app } = await import("../src/app.js");
const { default: db } = await import("../src/daos/models/index.js");
const { DAYS, nowLocal } = await import("../src/utils/schedule.js");
const password = "Test-only-password-123";
const shiftDate = (delta) => {
  const date = new Date(nowLocal().slice(0, 10) + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
};
const date = shiftDate(7),
  later = shiftDate(8);
const availability = DAYS.map((day_of_week) => ({
  day_of_week,
  start_time_morning: "09:00",
  end_time_morning: "12:00",
  start_time_afternoon: "14:00",
  end_time_afternoon: "18:00",
}));
const actors = {};
let first;
const body = (doctorId, time = "09:00", appointmentDate = date) => ({
  doctorId,
  appointmentDate,
  startTime: time,
  reasonForConsultation: "Consulta de prueba",
});
async function account(role, name) {
  const email = name + "@example.test";
  const registration = await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password,
      role,
      first_name: name,
      last_name: "Prueba",
      speciality: "Medicina general",
    });
  assert.equal(registration.status, 201, JSON.stringify(registration.body));
  assert.equal("password_hash" in registration.body.user, false);
  const agent = request.agent(app);
  const login = await agent.post("/api/auth/login").send({ email, password });
  assert.equal(login.status, 200);
  assert.match(login.headers["set-cookie"][0], /HttpOnly/);
  assert.match(login.headers["set-cookie"][0], /SameSite=Lax/);
  return { agent, id: login.body.user.id, email };
}
before(async () => {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query('CREATE SCHEMA "' + schema + '"');
  await client.end();
  await db.sequelize.sync();
  await db.sequelize.query(
    'CREATE UNIQUE INDEX usuarios_email_lower_unique ON "' +
      schema +
      '"."usuarios" (lower(email))',
  );
  actors.doctor = await account("doctor", "MedicoUno");
  actors.doctor2 = await account("doctor", "MedicoDos");
  actors.patient = await account("patient", "PacienteUno");
  actors.patient2 = await account("patient", "PacienteDos");
  for (const a of [actors.doctor, actors.doctor2]) {
    const r = await a.agent
      .put("/api/doctors/me/disponibilidad")
      .send(availability);
    assert.equal(r.status, 200, JSON.stringify(r.body));
  }
});
after(async () => {
  await db.sequelize.close();
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query('DROP SCHEMA "' + schema + '" CASCADE');
  await client.end();
});

test("register/login: roles, normalized emails, password validation and session", async () => {
  const duplicate = await request(app)
    .post("/api/auth/register")
    .send({
      email: " PACIENTEUNO@EXAMPLE.TEST ",
      password,
      role: "patient",
      first_name: "Otro",
      last_name: "Paciente",
    });
  assert.equal(duplicate.status, 409);
  const invalid = {
    email: "new@example.test",
    password,
    role: "admin",
    first_name: "Nuevo",
    last_name: "Paciente",
  };
  assert.equal(
    (await request(app).post("/api/auth/register").send(invalid)).status,
    400,
  );
  assert.equal(
    (
      await request(app)
        .post("/api/auth/register")
        .send({ ...invalid, role: "patient", password: "short" })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(app)
        .post("/api/auth/login")
        .send({ email: actors.patient.email, password: "incorrect" })
    ).status,
    401,
  );
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: " PACIENTEUNO@EXAMPLE.TEST ", password });
  assert.equal(login.status, 200);
  assert.equal(
    (await actors.patient.agent.get("/api/users/me")).body.user.id,
    actors.patient.id,
  );
});
test("reject unauthenticated requests, cross-origin writes and role bypasses", async () => {
  assert.equal((await request(app).get("/api/citas/paciente/me")).status, 401);
  assert.equal(
    (
      await request(app)
        .post("/api/auth/login")
        .set("Origin", "https://untrusted.example")
        .send({ email: actors.patient.email, password })
    ).status,
    403,
  );
  assert.equal(
    (
      await actors.patient.agent
        .put("/api/doctors/me/disponibilidad")
        .send(availability)
    ).status,
    403,
  );
  assert.equal(
    (await actors.doctor.agent.post("/api/citas").send(body(actors.doctor.id)))
      .status,
    403,
  );
});
test("availability validates real hours, paired bounds, overlapping ranges and duplicate days", async () => {
  for (const invalid of [
    [
      {
        day_of_week: "Monday",
        start_time_morning: "25:00",
        end_time_morning: "26:00",
      },
    ],
    [{ day_of_week: "Monday", start_time_morning: "09:00" }],
    [{ ...availability[0], start_time_afternoon: "10:00" }],
    [availability[0], availability[0]],
  ])
    assert.equal(
      (
        await actors.doctor.agent
          .put("/api/doctors/me/disponibilidad")
          .send(invalid)
      ).status,
      400,
    );
  assert.equal(
    (await actors.doctor.agent.get("/api/doctors/me/disponibilidad")).body
      .length,
    7,
  );
});
test("doctor directory does not expose private account fields", async () => {
  const response = await actors.patient.agent.get("/api/doctors");
  assert.equal(response.status, 200);
  const doctor = response.body[0];
  assert.equal("id_document_number" in doctor, false);
  assert.equal("email" in doctor.usuario, false);
  assert.equal("password_hash" in doctor.usuario, false);
});
test("patient reserves an available slot and both roles see the same persisted record", async () => {
  const slots = await actors.patient.agent
    .get("/api/doctors/" + actors.doctor.id + "/horarios")
    .query({ date });
  assert.equal(slots.status, 200);
  assert.ok(slots.body.slots.some((s) => s.startTime === "09:00"));
  const response = await actors.patient.agent
    .post("/api/citas")
    .send({
      ...body(actors.doctor.id),
      patient_user_id: actors.patient2.id,
      status: "confirmed",
    });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  first = response.body.cita;
  assert.equal(first.patient_user_id, actors.patient.id);
  assert.equal(first.status, "pending");
  assert.equal((await db.Cita.findByPk(first.id)).status, "pending");
  assert.equal(
    (await actors.doctor.agent.get("/api/citas/doctor/me")).body[0].id,
    first.id,
  );
  const occupied = await actors.patient2.agent
    .get("/api/doctors/" + actors.doctor.id + "/horarios")
    .query({ date });
  assert.ok(!occupied.body.slots.some((s) => s.startTime === "09:00"));
});
test("invalid dates, past times, off-grid times, missing reason and invalid IDs are rejected", async () => {
  for (const payload of [
    { ...body(actors.doctor.id), appointmentDate: "2026-02-30" },
    { ...body(actors.doctor.id), appointmentDate: "2000-01-01" },
    body(actors.doctor.id, "25:00"),
    body(actors.doctor.id, "09:15"),
    { ...body(actors.doctor.id), endTime: "10:00" },
    { ...body(actors.doctor.id), reasonForConsultation: "" },
    body("not-an-id"),
  ])
    assert.ok(
      [400, 409].includes(
        (await actors.patient.agent.post("/api/citas").send(payload)).status,
      ),
    );
  assert.equal(
    (
      await actors.patient.agent
        .get("/api/citas/paciente/me")
        .query({ date: "invalid" })
    ).status,
    400,
  );
});
test("simultaneous patients cannot book the same doctor slot", async () => {
  const replies = await Promise.all(
    [actors.patient, actors.patient2].map((a) =>
      a.agent.post("/api/citas").send(body(actors.doctor.id, "10:00")),
    ),
  );
  assert.deepEqual(replies.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    await db.Cita.count({
      where: {
        doctor_user_id: actors.doctor.id,
        appointment_date: date,
        start_time: "10:00",
      },
    }),
    1,
  );
});
test("a patient cannot book two doctors at the same time, even concurrently", async () => {
  const replies = await Promise.all(
    [actors.doctor, actors.doctor2].map((d) =>
      actors.patient2.agent.post("/api/citas").send(body(d.id, "11:00")),
    ),
  );
  assert.deepEqual(replies.map((r) => r.status).sort(), [201, 409]);
});
test("ownership is enforced for read, status, rescheduling and slot exclusions", async () => {
  for (const actor of [actors.patient2, actors.doctor2]) {
    assert.equal((await actor.agent.get("/api/citas/" + first.id)).status, 403);
    assert.equal(
      (
        await actor.agent
          .put("/api/citas/" + first.id + "/status")
          .send({ status: "canceled" })
      ).status,
      403,
    );
    assert.equal(
      (
        await actor.agent
          .put("/api/citas/" + first.id + "/reprogramar")
          .send(body(actors.doctor.id, "14:00"))
      ).status,
      403,
    );
    assert.equal(
      (
        await actor.agent
          .get("/api/doctors/" + actors.doctor.id + "/horarios")
          .query({ date, excludeCitaId: first.id })
      ).status,
      403,
    );
  }
});
test("doctor confirms; patient cannot confirm and a future appointment cannot be completed", async () => {
  assert.equal(
    (
      await actors.patient.agent
        .put("/api/citas/" + first.id + "/status")
        .send({ status: "confirmed" })
    ).status,
    403,
  );
  assert.equal(
    (
      await actors.doctor.agent
        .put("/api/citas/" + first.id + "/status")
        .send({ status: "confirmed" })
    ).status,
    200,
  );
  assert.equal(
    (
      await actors.doctor.agent
        .put("/api/citas/" + first.id + "/status")
        .send({ status: "completed" })
    ).status,
    400,
  );
});
test("patient rescheduling persists and requires a new confirmation", async () => {
  const response = await actors.patient.agent
    .put("/api/citas/" + first.id + "/reprogramar")
    .send(body(actors.doctor.id, "14:00", later));
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.cita.appointment_date, later);
  assert.equal(response.body.cita.status, "pending");
  const oldSlots = await actors.patient.agent
    .get("/api/doctors/" + actors.doctor.id + "/horarios")
    .query({ date });
  assert.ok(oldSlots.body.slots.some((s) => s.startTime === "09:00"));
});
test("availability edits cannot invalidate active future reservations", async () => {
  assert.equal(
    (await actors.doctor.agent.put("/api/doctors/me/disponibilidad").send([]))
      .status,
    409,
  );
  assert.equal(
    (await actors.doctor.agent.get("/api/doctors/me/disponibilidad")).body
      .length,
    7,
  );
});
test("doctor can reschedule own turn; cancellation releases the slot and is terminal", async () => {
  const moved = await actors.doctor.agent
    .put("/api/citas/" + first.id + "/reprogramar")
    .send(body(actors.doctor.id, "15:00", later));
  assert.equal(moved.status, 200);
  assert.equal(
    (
      await actors.patient.agent
        .put("/api/citas/" + first.id + "/status")
        .send({ status: "canceled" })
    ).status,
    200,
  );
  assert.equal(
    (
      await actors.doctor.agent
        .put("/api/citas/" + first.id + "/status")
        .send({ status: "confirmed" })
    ).status,
    409,
  );
  assert.equal(
    (
      await actors.patient.agent
        .put("/api/citas/" + first.id + "/reprogramar")
        .send(body(actors.doctor.id, "16:00", later))
    ).status,
    409,
  );
  assert.equal(
    (
      await actors.patient.agent
        .post("/api/citas")
        .send(body(actors.doctor.id, "15:00", later))
    ).status,
    201,
  );
});
test("completed consultation is terminal and cannot be changed by a patient", async () => {
  const completed = await db.Cita.create({
    patient_user_id: actors.patient.id,
    doctor_user_id: actors.doctor.id,
    appointment_date: shiftDate(-1),
    start_time: "09:00",
    end_time: "09:30",
    status: "confirmed",
  });
  const result = await actors.doctor.agent
    .put("/api/citas/" + completed.id + "/status")
    .send({ status: "completed" });
  assert.equal(result.status, 200);
  assert.equal(
    (
      await actors.patient.agent
        .put("/api/citas/" + completed.id + "/status")
        .send({ status: "canceled" })
    ).status,
    409,
  );
});
test("logout clears the browser session and denies protected access", async () => {
  const result = await actors.patient2.agent.post("/api/auth/logout");
  assert.equal(result.status, 200);
  assert.equal((await actors.patient2.agent.get("/api/users/me")).status, 401);
});

test("expired or forged sessions cannot access protected data", async () => {
  const expired = jwt.sign({ userId: actors.patient.id }, process.env.JWT_SECRET, { expiresIn: -1 });
  const forged = jwt.sign({ userId: actors.patient.id }, "a-different-test-signing-key");
  for (const token of [expired, forged]) {
    const result = await request(app).get("/api/users/me").set("Cookie", "sessionToken=" + token);
    assert.equal(result.status, 401);
  }
});

test("dashboard counts all history and returns only the next five owned active turns", async () => {
  const doctor = await account("doctor", "ResumenDoctor");
  const patient = await account("patient", "ResumenPaciente");
  const base = {
    doctor_user_id: doctor.id,
    patient_user_id: patient.id,
    appointment_date: shiftDate(-1),
    start_time: "09:00",
    end_time: "09:30",
  };
  await db.Cita.bulkCreate([
    ...Array.from({ length: 201 }, (_, i) => ({
      ...base, appointment_date: shiftDate(-i - 1), status: "completed",
    })),
    ...Array.from({ length: 3 }, () => ({ ...base, status: "canceled" })),
    ...Array.from({ length: 2 }, () => ({ ...base, status: "pending" })),
  ]);
  // Insert in reverse order to ensure the summary sorts by appointment time.
  const future = await db.Cita.bulkCreate(
    Array.from({ length: 7 }, (_, i) => ({
      ...base, appointment_date: shiftDate(7 - i), status: "pending",
    })),
  );
  await db.Cita.create({ ...base, appointment_date: shiftDate(8), status: "confirmed" });
  const onlyDoctor = await db.Cita.create({
    ...base, patient_user_id: actors.patient.id,
    appointment_date: shiftDate(1), start_time: "08:00", end_time: "08:30", status: "confirmed",
  });
  const onlyPatient = await db.Cita.create({
    ...base, doctor_user_id: actors.doctor.id,
    appointment_date: shiftDate(1), start_time: "07:00", end_time: "07:30", status: "pending",
  });
  await db.Cita.create({
    ...base, doctor_user_id: actors.doctor.id, patient_user_id: actors.patient.id,
    appointment_date: shiftDate(1), start_time: "06:00", end_time: "06:30", status: "pending",
  });

  assert.equal((await request(app).get("/api/citas/resumen")).status, 401);
  const expectedShared = [...future].reverse().slice(0, 4).map((c) => c.id);
  for (const [actor, firstTurn, counts] of [
    [doctor, onlyDoctor, { pending: 9, confirmed: 2, completed: 201, canceled: 3 }],
    [patient, onlyPatient, { pending: 10, confirmed: 1, completed: 201, canceled: 3 }],
  ]) {
    const response = await actor.agent.get("/api/citas/resumen").query({ userId: actors.doctor.id });
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.deepEqual(response.body.counts, counts);
    assert.deepEqual(response.body.upcoming.map((c) => c.id), [firstTurn.id, ...expectedShared]);
    assert.ok(response.body.upcoming.every((c) => c.appointment_date > shiftDate(0)));
  }
});
