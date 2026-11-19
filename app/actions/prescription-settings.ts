"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type SettingsState = { error?: string };
const value = (form: FormData, name: string, max = 300) => String(form.get(name) ?? "").trim().slice(0, max);
async function imageData(form: FormData, name: string, existing?: string | null) {
  const file = form.get(name);
  if (!(file instanceof File) || !file.size) return existing || null;
  if (file.size > 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Use a PNG, JPG, or WebP image smaller than 1 MB.");
  return `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
}
export async function savePrescriptionSettingsAction(_: SettingsState, form: FormData): Promise<SettingsState> {
  await requireUser();
  const clinicName = value(form, "clinicName", 120); const fullName = value(form, "fullName", 120);
  if (!clinicName || !fullName) return { error: "Clinic name and doctor's full name are required." };
  try {
    const [clinic, doctor] = await Promise.all([db.clinicSettings.findUnique({ where: { singleton: "clinic" } }), db.doctorProfile.findUnique({ where: { singleton: "doctor" } })]);
    const [logoDataUrl, signatureDataUrl] = await Promise.all([imageData(form, "logo", clinic?.logoDataUrl), imageData(form, "signature", doctor?.signatureDataUrl)]);
    await db.$transaction([
      db.clinicSettings.upsert({ where: { singleton: "clinic" }, create: { singleton: "clinic", clinicName, logoDataUrl, address: value(form,"address",500), phone:value(form,"phone",40), whatsapp:value(form,"whatsapp",40), email:value(form,"email",150), openingDays:value(form,"openingDays",150), openingTime:value(form,"openingTime",40), closingTime:value(form,"closingTime",40), breakTimings:value(form,"breakTimings",150), phcRegistrationNumber:value(form,"phcRegistrationNumber",80), phcLicenseNumber:value(form,"phcLicenseNumber",80), appointmentContact:value(form,"appointmentContact",40), emergencyContact:value(form,"emergencyContact",40) }, update: { clinicName, logoDataUrl, address:value(form,"address",500), phone:value(form,"phone",40), whatsapp:value(form,"whatsapp",40), email:value(form,"email",150), openingDays:value(form,"openingDays",150), openingTime:value(form,"openingTime",40), closingTime:value(form,"closingTime",40), breakTimings:value(form,"breakTimings",150), phcRegistrationNumber:value(form,"phcRegistrationNumber",80), phcLicenseNumber:value(form,"phcLicenseNumber",80), appointmentContact:value(form,"appointmentContact",40), emergencyContact:value(form,"emergencyContact",40) } }),
      db.doctorProfile.upsert({ where: { singleton: "doctor" }, create: { singleton:"doctor", fullName, title:value(form,"title",20)||"Dr.", qualifications:value(form,"qualifications",150), specialization:value(form,"specialization",150), experiences:value(form,"experiences",1000), pmdcNumber:value(form,"pmdcNumber",80), designation:value(form,"designation",150), signatureDataUrl }, update: { fullName, title:value(form,"title",20)||"Dr.", qualifications:value(form,"qualifications",150), specialization:value(form,"specialization",150), experiences:value(form,"experiences",1000), pmdcNumber:value(form,"pmdcNumber",80), designation:value(form,"designation",150), signatureDataUrl } })
    ]);
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to save prescription settings." }; }
  revalidatePath("/prescription-settings"); redirect("/prescription-settings?saved=1");
}
