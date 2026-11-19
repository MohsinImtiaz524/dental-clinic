import { APPOINTMENT_DURATIONS } from "@/lib/appointment-constants";
import { clinicDayRange } from "@/lib/clinic-time";

export function parseAppointmentInput(localDate: string, durationValue: string, reason: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localDate) || !clinicDayRange(localDate.slice(0, 10))) return { error: "Choose a valid appointment date and time." } as const;
  const hour = Number(localDate.slice(11, 13));
  const minute = Number(localDate.slice(14, 16));
  const startsAt = new Date(`${localDate}:00+05:00`);
  if (Number.isNaN(startsAt.getTime()) || hour > 23 || minute > 59) return { error: "Choose a valid appointment time." } as const;
  const durationMinutes = Number(durationValue);
  if (!APPOINTMENT_DURATIONS.includes(durationMinutes as (typeof APPOINTMENT_DURATIONS)[number])) return { error: "Choose a valid appointment duration." } as const;
  if (!reason || reason.length > 150) return { error: "Enter a visit reason of up to 150 characters." } as const;
  return { startsAt, durationMinutes, reason } as const;
}
