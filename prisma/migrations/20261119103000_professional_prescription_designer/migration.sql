ALTER TABLE "Patient" ADD COLUMN "age" INTEGER;
ALTER TABLE "Patient" ADD COLUMN "gender" TEXT;
ALTER TABLE "Prescription" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Prescription" ADD COLUMN "finalizedAt" DATETIME;
ALTER TABLE "Prescription" ADD COLUMN "profileSnapshot" TEXT;
ALTER TABLE "Prescription" ADD COLUMN "followUpDate" DATETIME;
ALTER TABLE "PrescriptionItem" ADD COLUMN "strength" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PrescriptionItem" ADD COLUMN "route" TEXT NOT NULL DEFAULT 'Oral';
ALTER TABLE "PrescriptionItem" ADD COLUMN "quantity" TEXT NOT NULL DEFAULT '';

CREATE TABLE "Consultation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "appointmentId" TEXT NOT NULL,
  "medicalHistory" TEXT,
  "allergies" TEXT,
  "currentMedications" TEXT,
  "dentalHistory" TEXT,
  "clinicalFindings" TEXT,
  "toothNumbers" TEXT,
  "diagnosis" TEXT,
  "procedures" TEXT,
  "referralSpecialist" TEXT,
  "referralReason" TEXT,
  "referralInstructions" TEXT,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Consultation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Consultation_appointmentId_key" ON "Consultation"("appointmentId");

CREATE TABLE "ClinicSettings" (
  "singleton" TEXT NOT NULL PRIMARY KEY DEFAULT 'clinic',
  "clinicName" TEXT NOT NULL DEFAULT 'Rashid Clinic',
  "logoDataUrl" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "email" TEXT,
  "openingDays" TEXT,
  "openingHours" TEXT,
  "breakTimings" TEXT,
  "appointmentContact" TEXT,
  "emergencyContact" TEXT,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "DoctorProfile" (
  "singleton" TEXT NOT NULL PRIMARY KEY DEFAULT 'doctor',
  "fullName" TEXT NOT NULL DEFAULT 'Doctor',
  "title" TEXT NOT NULL DEFAULT 'Dr.',
  "qualifications" TEXT,
  "specialization" TEXT,
  "pmdcNumber" TEXT,
  "designation" TEXT,
  "signatureDataUrl" TEXT,
  "updatedAt" DATETIME NOT NULL
);
