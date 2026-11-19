import { db } from "@/lib/db";
export { parseAppointmentInput } from "@/lib/appointment-input";

export async function findAppointmentConflict(startsAt: Date, durationMinutes: number, excludeId?: string) {
  const proposedEnd = new Date(startsAt.getTime() + durationMinutes * 60000);
  const candidates = await db.appointment.findMany({
    where: { status: { not: "CANCELLED" }, startsAt: { lt: proposedEnd }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    include: { patient: true }, orderBy: { startsAt: "asc" },
  });
  return candidates.find(item => new Date(item.startsAt.getTime() + item.durationMinutes * 60000) > startsAt) ?? null;
}
