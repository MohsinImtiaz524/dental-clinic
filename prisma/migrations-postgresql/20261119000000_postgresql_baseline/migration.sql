CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'FINALIZED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "singleton" TEXT NOT NULL DEFAULT 'administrator',
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("tokenHash")
);

CREATE TABLE "PasswordReset" (
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("tokenHash")
);

CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "identityKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "reason" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicSettings" (
    "singleton" TEXT NOT NULL DEFAULT 'clinic',
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClinicSettings_pkey" PRIMARY KEY ("singleton")
);

CREATE TABLE "DoctorProfile" (
    "singleton" TEXT NOT NULL DEFAULT 'doctor',
    "fullName" TEXT NOT NULL DEFAULT 'Doctor',
    "title" TEXT NOT NULL DEFAULT 'Dr.',
    "qualifications" TEXT,
    "specialization" TEXT,
    "pmdcNumber" TEXT,
    "designation" TEXT,
    "signatureDataUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY ("singleton")
);

CREATE TABLE "TreatmentCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TreatmentCatalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TreatmentRecord" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TreatmentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "notes" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "finalizedAt" TIMESTAMP(3),
    "profileSnapshot" TEXT,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicine" TEXT NOT NULL,
    "strength" TEXT NOT NULL DEFAULT '',
    "dosage" TEXT NOT NULL,
    "route" TEXT NOT NULL DEFAULT 'Oral',
    "frequency" TEXT NOT NULL,
    "timing" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "quantity" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_singleton_key" ON "User"("singleton");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "PasswordReset_userId_key" ON "PasswordReset"("userId");
CREATE UNIQUE INDEX "Patient_identityKey_key" ON "Patient"("identityKey");
CREATE INDEX "Patient_createdAt_idx" ON "Patient"("createdAt");
CREATE INDEX "Appointment_startsAt_status_idx" ON "Appointment"("startsAt", "status");
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");
CREATE UNIQUE INDEX "Consultation_appointmentId_key" ON "Consultation"("appointmentId");
CREATE UNIQUE INDEX "TreatmentCatalog_name_key" ON "TreatmentCatalog"("name");
CREATE INDEX "TreatmentRecord_appointmentId_idx" ON "TreatmentRecord"("appointmentId");
CREATE INDEX "TreatmentRecord_patientId_createdAt_idx" ON "TreatmentRecord"("patientId", "createdAt");
CREATE INDEX "Prescription_appointmentId_idx" ON "Prescription"("appointmentId");
CREATE INDEX "Prescription_patientId_createdAt_idx" ON "Prescription"("patientId", "createdAt");
CREATE INDEX "PrescriptionItem_prescriptionId_sortOrder_idx" ON "PrescriptionItem"("prescriptionId", "sortOrder");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TreatmentRecord" ADD CONSTRAINT "TreatmentRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TreatmentRecord" ADD CONSTRAINT "TreatmentRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TreatmentRecord" ADD CONSTRAINT "TreatmentRecord_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "TreatmentCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
