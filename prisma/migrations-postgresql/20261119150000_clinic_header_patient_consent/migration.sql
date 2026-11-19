ALTER TABLE "Patient"
  ADD COLUMN "weightKg" DOUBLE PRECISION,
  ADD COLUMN "address" TEXT;

ALTER TABLE "Consultation"
  ADD COLUMN "patientConsent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consentNotes" TEXT,
  ADD COLUMN "consentedAt" TIMESTAMP(3);

ALTER TABLE "ClinicSettings"
  ADD COLUMN "openingTime" TEXT,
  ADD COLUMN "closingTime" TEXT,
  ADD COLUMN "phcRegistrationNumber" TEXT,
  ADD COLUMN "phcLicenseNumber" TEXT;

ALTER TABLE "DoctorProfile"
  ADD COLUMN "experiences" TEXT;
