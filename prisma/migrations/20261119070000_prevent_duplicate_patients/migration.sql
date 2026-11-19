ALTER TABLE "Patient" ADD COLUMN "identityKey" TEXT;

UPDATE "Patient"
SET "identityKey" = lower(trim(replace(replace(replace(name, '  ', ' '), '  ', ' '), '  ', ' '))) || '|' ||
  replace(replace(replace(replace(replace(replace(phone, '+', ''), ' ', ''), '(', ''), ')', ''), '-', ''), '.', '')
WHERE phone IS NOT NULL AND trim(phone) <> '';

UPDATE "Appointment"
SET "patientId" = (
  SELECT keeper.id FROM "Patient" keeper
  WHERE keeper."identityKey" = (SELECT duplicate."identityKey" FROM "Patient" duplicate WHERE duplicate.id = "Appointment"."patientId")
  ORDER BY keeper."createdAt" ASC, keeper.id ASC
  LIMIT 1
)
WHERE "patientId" IN (
  SELECT duplicate.id FROM "Patient" duplicate
  WHERE duplicate."identityKey" IS NOT NULL
    AND duplicate.id <> (
      SELECT keeper.id FROM "Patient" keeper
      WHERE keeper."identityKey" = duplicate."identityKey"
      ORDER BY keeper."createdAt" ASC, keeper.id ASC
      LIMIT 1
    )
);

DELETE FROM "Patient"
WHERE "identityKey" IS NOT NULL
  AND id <> (
    SELECT keeper.id FROM "Patient" keeper
    WHERE keeper."identityKey" = "Patient"."identityKey"
    ORDER BY keeper."createdAt" ASC, keeper.id ASC
    LIMIT 1
  );

CREATE UNIQUE INDEX "Patient_identityKey_key" ON "Patient"("identityKey");
