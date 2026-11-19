"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { patientIdentityKey } from "@/lib/patient-identity";
import { findAppointmentConflict, parseAppointmentInput } from "@/lib/appointments";

export type ClinicFormState = { error?: string; conflict?: string };
const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
function refreshClinic() {
  revalidatePath("/dashboard");
  revalidatePath("/patients");
  revalidatePath("/appointments");
  revalidatePath("/patients/[id]", "page");
}

export async function createPatientAction(_: ClinicFormState, form: FormData): Promise<ClinicFormState> {
  await requireUser();
  const name = field(form, "name");
  const phone = field(form, "phone");
  if (name.length < 2 || name.length > 100) return { error: "Enter a patient name between 2 and 100 characters." };
  if (phone && (!/^[+\d\s()-]{7,25}$/.test(phone) || !/\d/.test(phone))) return { error: "Enter a valid phone number or leave it blank." };
  const identityKey = patientIdentityKey(name, phone);
  let id: string;
  let existing = false;
  try {
    const duplicate = identityKey ? await db.patient.findUnique({ where: { identityKey } }) : null;
    if (duplicate) {
      id = duplicate.id;
      existing = true;
    } else {
      const patient = await db.patient.create({ data: { name, phone: phone || null, identityKey } });
      id = patient.id;
    }
  } catch {
    const duplicate = identityKey ? await db.patient.findUnique({ where: { identityKey } }) : null;
    if (!duplicate) return { error: "Unable to save this patient. Please try again." };
    id = duplicate.id;
    existing = true;
  }
  refreshClinic();
  redirect(`/patients/${id}${existing ? "?existing=1" : ""}`);
}

export async function createAppointmentAction(_: ClinicFormState, form: FormData): Promise<ClinicFormState> {
  await requireUser();
  const patientId = field(form, "patientId");
  const localDate = field(form, "startsAt");
  const reason = field(form, "reason");
  const parsed = parseAppointmentInput(localDate, field(form, "durationMinutes"), reason);
  if ("error" in parsed) return { error: parsed.error };
  try {
    if (!await db.patient.findUnique({ where: { id: patientId } })) return { error: "Select an existing patient." };
    const conflict = await findAppointmentConflict(parsed.startsAt, parsed.durationMinutes);
    if (conflict && field(form, "allowConflict") !== "yes") return { conflict: `This overlaps ${conflict.patient.name}'s appointment. Confirm to book it anyway.` };
    await db.appointment.create({ data: { patientId, startsAt: parsed.startsAt, durationMinutes: parsed.durationMinutes, reason: parsed.reason } });
  } catch { return { error: "Unable to book this appointment. Please try again." }; }
  refreshClinic();
  redirect(`/appointments?date=${localDate.slice(0, 10)}`);
}

export async function rescheduleAppointmentAction(_: ClinicFormState, form: FormData): Promise<ClinicFormState> {
  await requireUser();
  const id = field(form, "id");
  const patientId = field(form, "patientId");
  const localDate = field(form, "startsAt");
  const parsed = parseAppointmentInput(localDate, field(form, "durationMinutes"), field(form, "reason"));
  if ("error" in parsed) return { error: parsed.error };
  try {
    const appointment = await db.appointment.findUnique({ where: { id } });
    if (!appointment) return { error: "This appointment no longer exists." };
    if (!await db.patient.findUnique({ where: { id: patientId } })) return { error: "Select an existing patient." };
    const conflict = await findAppointmentConflict(parsed.startsAt, parsed.durationMinutes, id);
    if (conflict && field(form, "allowConflict") !== "yes") return { conflict: `This overlaps ${conflict.patient.name}'s appointment. Confirm to reschedule it anyway.` };
    await db.appointment.update({ where: { id }, data: { patientId, startsAt: parsed.startsAt, durationMinutes: parsed.durationMinutes, reason: parsed.reason, status: appointment.status === "CANCELLED" ? "SCHEDULED" : appointment.status } });
  } catch { return { error: "Unable to reschedule this appointment. Please try again." }; }
  refreshClinic();
  redirect(`/appointments?date=${localDate.slice(0, 10)}`);
}

export async function updateAppointmentStatusAction(_: ClinicFormState, form: FormData): Promise<ClinicFormState> {
  await requireUser();
  const id = field(form, "id");
  const status = field(form, "status");
  if (status !== "COMPLETED" && status !== "CANCELLED" && status !== "SCHEDULED") return { error: "Select a valid appointment status." };
  try {
    await db.appointment.update({ where: { id }, data: { status } });
  } catch { return { error: "Unable to update the appointment. Refresh and try again." }; }
  refreshClinic();
  return {};
}
