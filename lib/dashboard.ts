import { db } from "@/lib/db";
import { clinicDateKey, clinicDayRange } from "@/lib/clinic-time";

export async function getDashboardData(now = new Date()) {
  const range = clinicDayRange(clinicDateKey(now))!;
  const [patients, appointments, scheduled, completed, todayAppointments, recentPatients] = await db.$transaction([
    db.patient.count(),
    db.appointment.count({ where: { startsAt: range } }),
    db.appointment.count({ where: { startsAt: range, status: "SCHEDULED" } }),
    db.appointment.count({ where: { startsAt: range, status: "COMPLETED" } }),
    db.appointment.findMany({ where: { startsAt: range }, include: { patient: true }, orderBy: [{ startsAt: "asc" }, { id: "asc" }], take: 6 }),
    db.patient.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 5 }),
  ]);
  return { patients, appointments, scheduled, completed, todayAppointments, recentPatients };
}
