export function patientIdentityKey(name: string, phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  if (!normalizedPhone) return null;
  const normalizedName = name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
  return `${normalizedName}|${normalizedPhone}`;
}
