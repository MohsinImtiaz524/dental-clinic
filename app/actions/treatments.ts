"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { medicineSchedule, parsePrescriptionItems } from "@/lib/prescriptions";

export type TreatmentFormState = { error?: string; success?: string };
const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

async function prescriptionImage(form: FormData, key: string) {
  const file = form.get(key);
  if (!(file instanceof File) || !file.size) return undefined;
  if (file.size > 2 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Each print image must be PNG, JPG, or WebP and no larger than 2 MB.");
  return `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
}

function uploadError(error: unknown, fallback: string) {
  if (error instanceof Error && (error.message.startsWith("Each print image") || error.message.startsWith("Image width"))) return error.message;
  return fallback;
}

function imageDimensions(form: FormData) {
  const width = Number(field(form, "imageWidthMm") || 30);
  const height = Number(field(form, "imageHeightMm") || 59.4);
  if (!Number.isFinite(width) || width < 15 || width > 70 || !Number.isFinite(height) || height < 15 || height > 120) throw new Error("Image width must be 15–70 mm and height must be 15–120 mm.");
  return { imageWidthMm: width, imageHeightMm: height };
}

function refreshRecords(patientId?: string, appointmentId?: string) {
  revalidatePath("/treatments");
  revalidatePath("/patients");
  if (patientId) revalidatePath(`/patients/${patientId}`);
  if (appointmentId) revalidatePath(`/appointments/${appointmentId}/consultation`);
}

export async function createTreatmentCatalogAction(_: TreatmentFormState, form: FormData): Promise<TreatmentFormState> {
  await requireUser();
  const name = field(form, "name");
  const description = field(form, "description");
  if (name.length < 2 || name.length > 100) return { error: "Enter a treatment name between 2 and 100 characters." };
  if (description.length > 300) return { error: "Description must be 300 characters or fewer." };
  try {
    await db.treatmentCatalog.create({ data: { name, description: description || null } });
  } catch { return { error: "That treatment already exists or could not be saved." }; }
  refreshRecords();
  redirect("/treatments?created=1");
}

export async function createMedicineCatalogAction(_: TreatmentFormState, form: FormData): Promise<TreatmentFormState> {
  await requireUser();
  const name = field(form, "name").replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) return { error: "Enter a medicine name between 2 and 120 characters." };
  try {
    await db.medicineCatalog.create({ data: { name } });
  } catch { return { error: "That medicine is already saved or could not be added." }; }
  revalidatePath("/treatments");
  revalidatePath("/appointments/[id]/consultation", "page");
  redirect("/treatments?medicine=created");
}

export async function createTreatmentRecordAction(_: TreatmentFormState, form: FormData): Promise<TreatmentFormState> {
  await requireUser();
  const appointmentId = field(form, "appointmentId");
  const treatmentId = field(form, "treatmentId");
  const notes = field(form, "notes");
  if (!treatmentId) return { error: "Select a treatment." };
  if (notes.length > 1000) return { error: "Treatment notes must be 1,000 characters or fewer." };
  try {
    const [appointment, treatment] = await Promise.all([
      db.appointment.findUnique({ where: { id: appointmentId }, select: { patientId: true } }),
      db.treatmentCatalog.findUnique({ where: { id: treatmentId }, select: { active: true } }),
    ]);
    if (!appointment) return { error: "This consultation no longer exists." };
    if (!treatment?.active) return { error: "Select an active treatment." };
    await db.treatmentRecord.create({ data: { appointmentId, patientId: appointment.patientId, treatmentId, notes: notes || null } });
    refreshRecords(appointment.patientId, appointmentId);
  } catch { return { error: "Unable to save the treatment record. Please try again." }; }
  redirect(`/appointments/${appointmentId}/consultation?saved=1`);
}

export async function createPrescriptionAction(_: TreatmentFormState, form: FormData): Promise<TreatmentFormState> {
  await requireUser();
  const appointmentId = field(form, "appointmentId");
  const notes = field(form, "notes");
  const intent = field(form, "intent") === "finalize" ? "FINALIZED" : "DRAFT";
  if (notes.length > 1000) return { error: "Prescription notes must be 1,000 characters or fewer." };
  const parsed = parsePrescriptionItems(form);
  if ("error" in parsed) return { error: parsed.error };
  let prescriptionId: string;
  try {
    const [image1DataUrl, image2DataUrl, image3DataUrl] = await Promise.all([prescriptionImage(form,"image1"),prescriptionImage(form,"image2"),prescriptionImage(form,"image3")]);
    const dimensions = imageDimensions(form);
    const appointment = await db.appointment.findUnique({ where: { id: appointmentId }, select: { patientId: true } });
    if (!appointment) return { error: "This consultation no longer exists." };
    const [clinic, doctor] = await Promise.all([db.clinicSettings.findUnique({ where: { singleton: "clinic" } }), db.doctorProfile.findUnique({ where: { singleton: "doctor" } })]);
    if (intent === "FINALIZED" && (!clinic || !doctor)) return { error: "Complete Clinic & Doctor prescription settings before finalizing." };
    const followUp = field(form, "followUpDate");
    const followUpDate = followUp ? new Date(`${followUp}T12:00:00+05:00`) : null;
    const prescription = await db.$transaction(async tx => tx.prescription.create({
      data: {
        appointmentId, patientId: appointment.patientId, notes: notes || null, status: intent, finalizedAt: intent === "FINALIZED" ? new Date() : null, followUpDate, image1DataUrl, image2DataUrl, image3DataUrl, ...dimensions,
        profileSnapshot: JSON.stringify({ clinic, doctor }),
        items: { create: parsed.items.map((item, sortOrder) => ({ ...item, sortOrder })) },
      }, select: { id: true },
    }));
    prescriptionId = prescription.id;
    refreshRecords(appointment.patientId, appointmentId);
  } catch (error) { return { error: uploadError(error, "Unable to save the prescription. Nothing was partially saved; please try again.") }; }
  redirect(`/prescriptions/${prescriptionId}`);
}

export async function saveConsultationAction(_: TreatmentFormState, form: FormData): Promise<TreatmentFormState> {
  await requireUser(); const appointmentId=field(form,"appointmentId");
  const appointment=await db.appointment.findUnique({where:{id:appointmentId},select:{id:true}}); if(!appointment)return{error:"Consultation not found."};
  const patientConsent=field(form,"patientConsent")==="yes";
  const data={presentingComplaints:field(form,"presentingComplaints")||null,medicalHistory:field(form,"medicalHistory")||null,allergies:field(form,"allergies")||null,clinicalFindings:field(form,"clinicalFindings")||null,diagnosis:field(form,"diagnosis")||null,procedures:field(form,"procedures")||null,referralSpecialist:field(form,"referralSpecialist")||null,referralReason:field(form,"referralReason")||null,referralInstructions:field(form,"referralInstructions")||null,patientConsent,consentNotes:field(form,"consentNotes")||null,consentedAt:patientConsent?new Date():null};
  try{await db.consultation.upsert({where:{appointmentId},create:{appointmentId,...data},update:data});}catch{return{error:"Unable to save consultation findings."};}
  revalidatePath(`/appointments/${appointmentId}/consultation`); return {success:"Consultation findings saved."};
}

export async function saveConsultationPanelAction(_: TreatmentFormState, form: FormData): Promise<TreatmentFormState> {
  await requireUser(); const appointmentId=field(form,"appointmentId");
  const appointment=await db.appointment.findUnique({where:{id:appointmentId},select:{patientId:true}}); if(!appointment)return{error:"Consultation not found."};
  const medicine=form.getAll("medicine").map(String); const dosage=form.getAll("dosage").map(String); const scheduleCodes=form.getAll("scheduleCode").map(String); const duration=form.getAll("duration").map(String); const instructions=form.getAll("instructions").map(String);
  const items=medicine.map((name,index)=>{const code=(scheduleCodes[index]||"BD").trim().toUpperCase();const schedule=medicineSchedule(code);return{medicine:name.trim(),strength:"",route:"",quantity:"",dosage:(dosage[index]||"").trim(),frequency:schedule?.urdu||"",timing:code,duration:(duration[index]||"").trim(),instructions:(instructions[index]||"").trim(),sortOrder:index};}).filter(item=>item.medicine||item.dosage||item.duration||item.instructions);
  if(items.some(item=>!item.medicine))return{error:"Enter a medicine name for each medicine row you use."};
  if(items.some(item=>!item.frequency))return{error:"Choose a valid schedule for every medicine row you use."};
  const patientConsent=field(form,"patientConsent")==="yes";
  const clinical={presentingComplaints:field(form,"presentingComplaints")||null,medicalHistory:field(form,"medicalHistory")||null,clinicalFindings:field(form,"clinicalFindings")||null,diagnosis:field(form,"diagnosis")||null,procedures:field(form,"procedures")||null,patientConsent,consentNotes:field(form,"consentNotes")||null,consentedAt:patientConsent?new Date():null};
  const treatmentId=field(form,"treatmentId"); const treatmentNotes=field(form,"treatmentNotes");
  const patientAgeValue=field(form,"patientAge"); const patientWeightValue=field(form,"patientWeightKg"); const patientAddress=field(form,"patientAddress");
  const patientAge=patientAgeValue?Number(patientAgeValue):null; const patientWeightKg=patientWeightValue?Number(patientWeightValue):null;
  if(patientAge!==null&&(!Number.isInteger(patientAge)||patientAge<0||patientAge>130))return{error:"Enter a patient age between 0 and 130."};
  if(patientWeightKg!==null&&(!Number.isFinite(patientWeightKg)||patientWeightKg<=0||patientWeightKg>500))return{error:"Enter a valid patient weight up to 500 kg."};
  if(patientAddress.length>500)return{error:"Patient address must be 500 characters or fewer."};
  try {
    const [image1DataUrl,image2DataUrl,image3DataUrl]=await Promise.all([prescriptionImage(form,"image1"),prescriptionImage(form,"image2"),prescriptionImage(form,"image3")]);
    const dimensions=imageDimensions(form);
    const [clinic,doctor]=await Promise.all([db.clinicSettings.findUnique({where:{singleton:"clinic"}}),db.doctorProfile.findUnique({where:{singleton:"doctor"}})]);
    await db.$transaction(async tx=>{
      await tx.patient.update({where:{id:appointment.patientId},data:{age:patientAge,weightKg:patientWeightKg,address:patientAddress||null}});
      await tx.consultation.upsert({where:{appointmentId},create:{appointmentId,...clinical},update:clinical});
      let linkedTreatmentId=treatmentId;
      if(!linkedTreatmentId&&clinical.procedures){const catalog=await tx.treatmentCatalog.findMany({where:{active:true},select:{id:true,name:true}});const procedureText=clinical.procedures.toLocaleLowerCase();linkedTreatmentId=catalog.find(item=>procedureText.includes(item.name.toLocaleLowerCase()))?.id||"";}
      if(linkedTreatmentId){const valid=await tx.treatmentCatalog.findUnique({where:{id:linkedTreatmentId},select:{active:true}});if(!valid?.active)throw new Error("invalid treatment");const existing=await tx.treatmentRecord.findFirst({where:{appointmentId,treatmentId:linkedTreatmentId},select:{id:true}});if(existing)await tx.treatmentRecord.update({where:{id:existing.id},data:{notes:treatmentNotes||clinical.procedures||null}});else await tx.treatmentRecord.create({data:{appointmentId,patientId:appointment.patientId,treatmentId:linkedTreatmentId,notes:treatmentNotes||clinical.procedures||null}});}
      const hasImages=Boolean(image1DataUrl||image2DataUrl||image3DataUrl);
      if(items.length||hasImages){
        const draft=await tx.prescription.findFirst({where:{appointmentId,status:"DRAFT"},select:{id:true}});
        if(draft){
          if(items.length)await tx.prescriptionItem.deleteMany({where:{prescriptionId:draft.id}});
          await tx.prescription.update({where:{id:draft.id},data:{notes:null,profileSnapshot:JSON.stringify({clinic,doctor}),...dimensions,...(image1DataUrl?{image1DataUrl}:{}),...(image2DataUrl?{image2DataUrl}:{}),...(image3DataUrl?{image3DataUrl}:{}),...(items.length?{items:{create:items}}:{})}});
        }else await tx.prescription.create({data:{appointmentId,patientId:appointment.patientId,status:"DRAFT",notes:null,profileSnapshot:JSON.stringify({clinic,doctor}),image1DataUrl,image2DataUrl,image3DataUrl,...dimensions,...(items.length?{items:{create:items}}:{})}});
      }
    });
  } catch (error) { return {error:uploadError(error,"Unable to save the consultation data. Nothing was partially saved.")}; }
  refreshRecords(appointment.patientId,appointmentId); redirect(`/appointments/${appointmentId}/consultation?saved=all`);
}
