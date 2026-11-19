export type PrescriptionItemInput = {
  medicine: string;
  strength: string;
  dosage: string;
  route: string;
  frequency: string;
  timing: string;
  duration: string;
  instructions: string;
  quantity: string;
};

const limits = { medicine: 120, strength: 80, dosage: 80, route: 80, frequency: 80, timing: 80, duration: 80, instructions: 240, quantity: 80 } as const;

export function parsePrescriptionItems(form: FormData): { items: PrescriptionItemInput[] } | { error: string } {
  const values = {
    medicine: form.getAll("medicine").map(String), strength: form.getAll("strength").map(String), dosage: form.getAll("dosage").map(String), route: form.getAll("route").map(String),
    frequency: form.getAll("frequency").map(String), timing: form.getAll("timing").map(String), duration: form.getAll("duration").map(String),
    instructions: form.getAll("instructions").map(String), quantity: form.getAll("quantity").map(String),
  };
  const count = values.medicine.length;
  if (!count || count > 20 || Object.values(values).some(items => items.length !== count)) return { error: "Add between 1 and 20 complete medicine rows." };
  const items = Array.from({ length: count }, (_, index) => ({
    medicine: values.medicine[index].trim(), strength: values.strength[index].trim(), dosage: values.dosage[index].trim(), route: values.route[index].trim(),
    frequency: values.frequency[index].trim(), timing: values.timing[index].trim(), duration: values.duration[index].trim(),
    instructions: values.instructions[index].trim(), quantity: values.quantity[index].trim(),
  }));
  const required: (keyof PrescriptionItemInput)[] = ["medicine", "dosage", "frequency", "timing", "duration", "instructions"];
  for (const item of items) for (const key of Object.keys(limits) as (keyof PrescriptionItemInput)[]) {
    if (required.includes(key) && !item[key]) return { error: `Complete the six fields for every medicine.` };
    if (item[key].length > limits[key]) return { error: `${key[0].toUpperCase() + key.slice(1)} is too long.` };
  }
  return { items };
}
