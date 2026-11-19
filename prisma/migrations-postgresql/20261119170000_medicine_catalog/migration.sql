CREATE TABLE "MedicineCatalog" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MedicineCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MedicineCatalog_name_key" ON "MedicineCatalog"("name");
CREATE INDEX "MedicineCatalog_name_idx" ON "MedicineCatalog"("name");
