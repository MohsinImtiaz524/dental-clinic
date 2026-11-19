import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { clinicDateKey, clinicDayRange } from "../lib/clinic-time";
import { patientIdentityKey } from "../lib/patient-identity";
import { parseAppointmentInput } from "../lib/appointment-input";
import { parsePrescriptionItems } from "../lib/prescriptions";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.DATABASE_URL_POOLED = testDatabaseUrl;
  process.env.DIRECT_DATABASE_URL = testDatabaseUrl;
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy", "--config", "prisma7.config.ts"], { env: process.env, stdio: "pipe" });
}
const databaseTest = testDatabaseUrl ? test : test.skip;

test("clinic calendar uses Pakistan time, including midnight and month boundaries", () => {
  assert.equal(clinicDateKey(new Date("2026-11-18T19:00:00Z")), "2026-11-19");
  assert.equal(clinicDateKey(new Date("2026-11-19T18:59:59Z")), "2026-11-19");
  assert.equal(clinicDateKey(new Date("2026-11-19T19:00:00Z")), "2026-11-20");
  assert.deepEqual(clinicDayRange("2026-12-31"), {
    gte: new Date("2026-12-30T19:00:00Z"), lt: new Date("2026-12-31T19:00:00Z"),
  });
  assert.equal(clinicDayRange("2026-02-30"), null);
  assert.equal(clinicDayRange("not-a-date"), null);
});

test("prescription fields include an English schedule and custom timing code", () => {
  const form = new FormData();
  form.append("medicine", "Amoxicillin");
  form.append("strength", "500 mg");
  form.append("dosage", "500 mg");
  form.append("route", "Oral");
  form.append("frequency", "Morning and evening");
  form.append("timing", "1-0-1");
  form.append("duration", "5 days");
  form.append("instructions", "After meals");
  form.append("quantity", "10 tablets");
  const parsed = parsePrescriptionItems(form);
  assert.ok("items" in parsed);
  if ("items" in parsed) assert.equal(parsed.items[0].timing, "1-0-1");
  form.set("timing", "");
  assert.ok("error" in parsePrescriptionItems(form));
});

test("patient identity normalizes equivalent names and phone formatting", () => {
  assert.equal(patientIdentityKey("  Test   User ", "+92 300-1234567"), "test user|923001234567");
  assert.equal(patientIdentityKey("test user", "(923) 001234567"), "test user|923001234567");
  assert.equal(patientIdentityKey("Different User", "+92 300-1234567"), "different user|923001234567");
  assert.equal(patientIdentityKey("Test User", ""), null);
});

test("appointment input rejects invalid dates and durations", () => {
  assert.equal(parseAppointmentInput("2026-02-30T09:00", "30", "Checkup").error, "Choose a valid appointment date and time.");
  assert.equal(parseAppointmentInput("2026-11-19T24:00", "30", "Checkup").error, "Choose a valid appointment time.");
  assert.equal(parseAppointmentInput("2026-11-19T09:00", "17", "Checkup").error, "Choose a valid appointment duration.");
  assert.equal(parseAppointmentInput("2026-11-19T09:00", "30", "").error, "Enter a visit reason of up to 150 characters.");
  const valid = parseAppointmentInput("2026-11-19T09:00", "45", "Follow-up");
  assert.ok(!("error" in valid));
  if (!("error" in valid)) assert.equal(valid.durationMinutes, 45);
});

databaseTest("dashboard figures and lists match PostgreSQL records", async (t) => {
  const { db } = await import("../lib/db");
  const { getDashboardData } = await import("../lib/dashboard");
  t.after(() => db.$disconnect());
  await db.prescriptionItem.deleteMany();
  await db.prescription.deleteMany();
  await db.treatmentRecord.deleteMany();
  await db.consultation.deleteMany();
  await db.appointment.deleteMany();
  await db.patient.deleteMany();
  const now = new Date("2026-11-19T08:00:00Z");

  await t.test("empty clinic has zero counts and empty lists", async () => {
    const data = await getDashboardData(now);
    assert.equal(data.patients, 0);
    assert.equal(data.appointments, 0);
    assert.equal(data.scheduled, 0);
    assert.equal(data.completed, 0);
    assert.deepEqual(data.todayAppointments, []);
    assert.deepEqual(data.recentPatients, []);
  });

  const patients = [];
  for (let index = 0; index < 8; index++) {
    patients.push(await db.patient.create({ data: { name: `Patient ${index}`, createdAt: new Date(`2026-11-${String(index + 1).padStart(2, "0")}T00:00:00Z`) } }));
  }
  const patientId = patients[0].id;
  await db.appointment.createMany({ data: [
    { patientId, reason: "Start of clinic day", startsAt: new Date("2026-11-18T19:00:00Z"), status: "SCHEDULED" },
    { patientId, reason: "End of clinic day", startsAt: new Date("2026-11-19T18:59:59Z"), status: "SCHEDULED" },
    { patientId, reason: "Completed visit", startsAt: new Date("2026-11-19T06:00:00Z"), status: "COMPLETED" },
    { patientId, reason: "Cancelled visit", startsAt: new Date("2026-11-19T07:00:00Z"), status: "CANCELLED" },
    { patientId, reason: "Yesterday", startsAt: new Date("2026-11-18T18:59:59Z"), status: "COMPLETED" },
    { patientId, reason: "Tomorrow", startsAt: new Date("2026-11-19T19:00:00Z"), status: "SCHEDULED" },
  ] });

  await t.test("counts include only the correct clinic day and status", async () => {
    const data = await getDashboardData(now);
    assert.equal(data.patients, 8);
    assert.equal(data.appointments, 4);
    assert.equal(data.scheduled, 2);
    assert.equal(data.completed, 1);
    assert.equal(data.todayAppointments[0].reason, "Start of clinic day");
    assert.equal(data.todayAppointments.at(-1)?.reason, "End of clinic day");
    assert.equal(data.todayAppointments[0].patient.name, "Patient 0");
    assert.equal(data.recentPatients.length, 5);
    assert.deepEqual(data.recentPatients.map(patient => patient.name), ["Patient 7", "Patient 6", "Patient 5", "Patient 4", "Patient 3"]);
  });

  await t.test("preview limits never reduce dashboard totals", async () => {
    for (let index = 0; index < 5; index++) {
      await db.appointment.create({ data: { patientId, reason: "Additional booking", startsAt: new Date("2026-11-19T08:00:00Z") } });
    }
    const data = await getDashboardData(now);
    assert.equal(data.appointments, 9);
    assert.equal(data.todayAppointments.length, 6);
    assert.equal(data.scheduled, 7);
    const appointment = data.todayAppointments.find(item => item.status === "SCHEDULED")!;
    await db.appointment.update({ where: { id: appointment.id }, data: { status: "COMPLETED" } });
    const updated = await getDashboardData(now);
    assert.equal(updated.appointments, 9);
    assert.equal(updated.scheduled, 6);
    assert.equal(updated.completed, 2);
  });

  await t.test("conflicts use appointment duration and ignore cancelled history", async () => {
    const { findAppointmentConflict } = await import("../lib/appointments");
    const active = await db.appointment.create({ data: { patientId, reason: "Long visit", startsAt: new Date("2026-11-20T04:00:00Z"), durationMinutes: 60 } });
    assert.equal((await findAppointmentConflict(new Date("2026-11-20T04:30:00Z"), 30))?.id, active.id);
    assert.equal(await findAppointmentConflict(new Date("2026-11-20T05:00:00Z"), 30), null);
    await db.appointment.update({ where: { id: active.id }, data: { status: "CANCELLED" } });
    assert.equal(await findAppointmentConflict(new Date("2026-11-20T04:30:00Z"), 30), null);
    assert.equal(await db.appointment.count({ where: { id: active.id, status: "CANCELLED" } }), 1);
  });
});
