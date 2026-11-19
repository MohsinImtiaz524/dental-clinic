export const CLINIC_TIME_ZONE = "Asia/Karachi";

export function clinicDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function clinicDayRange(date = clinicDateKey()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const start = new Date(`${date}T00:00:00+05:00`);
  if (Number.isNaN(start.getTime()) || clinicDateKey(start) !== date) return null;
  return { gte: start, lt: new Date(start.getTime() + 86400000) };
}

export function clinicWeekRange(date = clinicDateKey()) {
  const day = clinicDayRange(date);
  if (!day) return null;
  const mondayOffset = (day.gte.getUTCDay() + 6) % 7;
  const gte = new Date(day.gte.getTime() - mondayOffset * 86400000);
  return { gte, lt: new Date(gte.getTime() + 7 * 86400000) };
}

export function clinicLocalInput(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function addClinicDays(date: string, days: number) {
  const range = clinicDayRange(date);
  return range ? clinicDateKey(new Date(range.gte.getTime() + days * 86400000)) : clinicDateKey();
}

export function formatClinicTime(date: Date) {
  return new Intl.DateTimeFormat("en", { timeZone: CLINIC_TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(date);
}

export function formatClinicDate(date: Date, long = false) {
  return new Intl.DateTimeFormat("en", { timeZone: CLINIC_TIME_ZONE, dateStyle: long ? "full" : "medium" }).format(date);
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}
