"use client";
import { useActionState, useId, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Search, Trash2, X } from "lucide-react";
import { Autocomplete } from "@base-ui/react/autocomplete";
import {
  createPrescriptionAction,
  createMedicineCatalogAction,
  createTreatmentCatalogAction,
  createTreatmentRecordAction,
  saveConsultationAction,
  saveConsultationPanelAction,
} from "@/app/actions/treatments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEDICINE_SCHEDULES } from "@/lib/prescriptions";

function Message({ state }: { state: { error?: string; success?: string } }) {
  return (
    <>
      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {state.success}
        </p>
      )}
    </>
  );
}

export function TreatmentCatalogForm() {
  const [state, action, pending] = useActionState(
    createTreatmentCatalogAction,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <Field
        label="Treatment name"
        name="name"
        placeholder="e.g. Wound dressing"
      />
      <Field label="Description" name="description" required={false} />
      <Message state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add treatment"}
      </Button>
    </form>
  );
}

export function MedicineCatalogForm() {
  const [state, action, pending] = useActionState(createMedicineCatalogAction, {});
  return <form action={action} className="space-y-4"><Field label="Medicine name and strength" name="name" placeholder="e.g. Amoxicillin 500 mg"/><Message state={state}/><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save medicine"}</Button></form>;
}

export function TreatmentRecordForm({
  appointmentId,
  treatments,
}: {
  appointmentId: string;
  treatments: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(
    createTreatmentRecordAction,
    {},
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <div className="space-y-2">
        <Label htmlFor="treatmentId">Treatment</Label>
        <select
          id="treatmentId"
          name="treatmentId"
          required
          defaultValue=""
          className="h-10 w-full rounded-lg border bg-white px-3 text-sm"
        >
          <option value="" disabled>
            Select treatment
          </option>
          {treatments.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </div>
      <TextArea label="Clinical notes" name="notes" />
      <Message state={state} />
      <Button type="submit" disabled={pending}>
        Save treatment
      </Button>
    </form>
  );
}

type Consultation = {
  medicalHistory?: string | null;
  bloodPressure?: string | null;
  bloodSugar?: string | null;
  liverDisease?: string | null;
  heartDisease?: string | null;
  presentingComplaints?: string | null;
  allergies?: string | null;
  currentMedications?: string | null;
  dentalHistory?: string | null;
  clinicalFindings?: string | null;
  toothNumbers?: string | null;
  diagnosis?: string | null;
  procedures?: string | null;
  referralSpecialist?: string | null;
  referralReason?: string | null;
  referralInstructions?: string | null;
  patientConsent?: boolean;
  consentNotes?: string | null;
};
export function ConsultationForm({
  appointmentId,
  consultation,
}: {
  appointmentId: string;
  consultation?: Consultation | null;
}) {
  const [state, action, pending] = useActionState(saveConsultationAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea
          label="Presenting complaints"
          name="presentingComplaints"
          value={consultation?.presentingComplaints}
        />
        <TextArea
          label="History"
          name="medicalHistory"
          value={consultation?.medicalHistory}
        />
        <TextArea
          label="Allergies"
          name="allergies"
          value={consultation?.allergies}
        />
        <TextArea
          label="Clinical findings"
          name="clinicalFindings"
          value={consultation?.clinicalFindings}
        />
        <TextArea
          label="Diagnosis"
          name="diagnosis"
          value={consultation?.diagnosis}
        />
        <TextArea
          label="Procedures / treatment details"
          name="procedures"
          value={consultation?.procedures}
        />
        <Field
          label="Referral specialist"
          name="referralSpecialist"
          value={consultation?.referralSpecialist}
          required={false}
        />
        <TextArea
          label="Referral reason"
          name="referralReason"
          value={consultation?.referralReason}
        />
        <div className="md:col-span-2">
          <TextArea
            label="Referral instructions"
            name="referralInstructions"
            value={consultation?.referralInstructions}
          />
        </div>
      </div>
      <ConsentFields consultation={consultation} />
      <Message state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save consultation findings"}
      </Button>
    </form>
  );
}

type MedicineRow = { key: number };
export function ConsultationPanelForm({
  appointmentId,
  patient,
  consultation,
  treatments,
  medicines,
}: {
  appointmentId: string;
  patient: { age: number | null; weightKg: number | null; address: string | null };
  consultation?: Consultation | null;
  treatments: { id: string; name: string }[];
  medicines: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(
    saveConsultationPanelAction,
    {},
  );
  const [rows, setRows] = useState<MedicineRow[]>([{ key: 1 }]);
  const [next, setNext] = useState(2);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <section>
        <h2 className="mb-3 text-base font-semibold">Patient details <span className="text-xs font-normal text-muted-foreground">(shown on prescription)</span></h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Age" name="patientAge" value={patient.age?.toString()} type="number" required={false} />
          <Field label="Weight (kg)" name="patientWeightKg" value={patient.weightKg?.toString()} type="number" required={false} />
          <div className="sm:col-span-2"><TextArea label="Patient address" name="patientAddress" value={patient.address} placeholder="House, street, area and city" /></div>
        </div>
      </section>
      <section className="border-t pt-5">
        <h2 className="mb-3 text-base font-semibold">
          Clinical details{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <TextArea
            label="Presenting complaints"
            name="presentingComplaints"
            value={consultation?.presentingComplaints}
            placeholder="e.g. Pain in lower-right tooth for three days"
          />
          <TextArea
            label="History"
            name="medicalHistory"
            value={consultation?.medicalHistory}
            placeholder="e.g. Diabetes, hypertension, allergies, or relevant medicines"
          />
          <Field label="Blood pressure" name="bloodPressure" value={consultation?.bloodPressure} placeholder="e.g. 120/80 mmHg" required={false} />
          <Field label="Blood sugar" name="bloodSugar" value={consultation?.bloodSugar} placeholder="e.g. 110 mg/dL" required={false} />
          <Field label="Liver disease" name="liverDisease" value={consultation?.liverDisease} placeholder="e.g. None" required={false} />
          <Field label="Heart disease" name="heartDisease" value={consultation?.heartDisease} placeholder="e.g. None" required={false} />
          <TextArea
            label="Clinical findings"
            name="clinicalFindings"
            value={consultation?.clinicalFindings}
            placeholder="e.g. Swelling near tooth 46, tenderness on examination"
          />
          <TextArea
            label="Diagnosis"
            name="diagnosis"
            value={consultation?.diagnosis}
            placeholder="e.g. Dental caries affecting tooth 46"
          />
          <TextArea
            label="Procedure details"
            name="procedures"
            value={consultation?.procedures}
            placeholder="e.g. Examination completed; temporary filling placed"
          />
        </div>
        <ConsentFields consultation={consultation} />
      </section>
      <section className="border-t pt-5">
        <h2 className="mb-3 text-base font-semibold">
          Treatment{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="panel-treatment">Select treatment</Label>
            <select
              id="panel-treatment"
              name="treatmentId"
              defaultValue=""
              className="h-9 w-full rounded-lg border bg-white px-3 text-sm"
            >
              <option value="">Choose a treatment if one was performed</option>
              {treatments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Treatment notes"
            name="treatmentNotes"
            placeholder="e.g. Completed successfully for tooth 46"
            required={false}
          />
        </div>
      </section>
      <section className="border-t pt-5">
        <h2 className="mb-3 text-base font-semibold">
          Prescription{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        </h2>
        {rows.map((row, index) => (
          <fieldset
            key={row.key}
            className="mb-3 rounded-xl border bg-[#fafcfb] p-4"
          >
            <div className="mb-3 flex justify-between">
              <legend className="text-sm font-semibold">
                Medicine {index + 1}
              </legend>
              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setRows((items) =>
                      items.filter((item) => item.key !== row.key),
                    )
                  }
                >
                  <Trash2 />
                  Remove
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MedicineField medicines={medicines} required={false} />
              <Field
                label="Dosage"
                name="dosage"
                placeholder="e.g. 1 tablet"
                required={false}
              />
              <ScheduleField required={false} />
              <Field
                label="Duration"
                name="duration"
                placeholder="e.g. 5 days"
                required={false}
              />
              <Field
                label="Instructions"
                name="instructions"
                placeholder="e.g. Take after meals"
                required={false}
              />
            </div>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setRows((items) => [...items, { key: next }]);
            setNext((value) => value + 1);
          }}
        >
          <Plus />
          Add medicine
        </Button>
        <PrintImagesFields />
      </section>
      <Message state={state} />
      <div className="sticky bottom-4 rounded-xl border bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
          {pending ? "Saving all data…" : "Save consultation data"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Saves clinical details, selected treatment, and prescription draft
          together.
        </p>
      </div>
    </form>
  );
}

export function PrescriptionForm({ appointmentId, medicines = [] }: { appointmentId: string; medicines?: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createPrescriptionAction, {});
  const [rows, setRows] = useState<MedicineRow[]>([{ key: 1 }]);
  const [next, setNext] = useState(2);
  const move = (index: number, direction: number) =>
    setRows((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      {rows.map((row, index) => (
        <fieldset
          key={row.key}
          className="break-inside-avoid rounded-xl border bg-[#fafcfb] p-4"
        >
          <input type="hidden" name="strength" value="" />
          <input type="hidden" name="quantity" value="" />
          <div className="mb-3 flex items-center justify-between">
            <legend className="text-sm font-semibold">
              Medicine {index + 1}
            </legend>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move medicine up"
                disabled={!index}
                onClick={() => move(index, -1)}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move medicine down"
                disabled={index === rows.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown />
              </Button>
              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove medicine"
                  onClick={() =>
                    setRows((items) =>
                      items.filter((item) => item.key !== row.key),
                    )
                  }
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <MedicineField medicines={medicines} />
            </div>
            <Field label="Dosage" name="dosage" placeholder="1 tablet" />
            <ScheduleField />
            <Field label="Duration" name="duration" placeholder="5 days" />
            <Field
              label="Instructions"
              name="instructions"
              placeholder="After meals"
            />
          </div>
        </fieldset>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setRows((items) => [...items, { key: next }]);
          setNext((value) => value + 1);
        }}
      >
        <Plus />
        Add another medicine
      </Button>
      <PrintImagesFields />
      <div className="max-w-xs">
        <Field
          label="Follow-up date (optional)"
          name="followUpDate"
          type="date"
          required={false}
        />
      </div>
      <Message state={state} />
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          name="intent"
          value="draft"
          variant="outline"
          disabled={pending}
        >
          Save draft
        </Button>
        <Button type="submit" name="intent" value="finalize" disabled={pending}>
          Finalize & preview
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  value?: string | null;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={value || ""}
        placeholder={placeholder}
        required={required}
        maxLength={240}
        className="h-9"
      />
    </div>
  );
}

function MedicineField({ medicines, required = true }: { medicines: { id: string; name: string }[]; required?: boolean }) {
  const id = useId();
  const names = medicines.map(item => item.name);
  return <div className="space-y-1.5"><Label htmlFor={id}>Medicine & strength</Label><Autocomplete.Root items={names} autoHighlight mode="list"><Autocomplete.InputGroup className="relative flex h-10 w-full items-center rounded-lg border border-input bg-white transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30"><Search className="ml-3 size-4 shrink-0 text-muted-foreground" aria-hidden="true"/><Autocomplete.Input id={id} name="medicine" required={required} maxLength={120} autoComplete="off" placeholder="Search saved medicines or type a new name" className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"/><Autocomplete.Clear aria-label="Clear medicine" className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground data-disabled:hidden"><X className="size-3.5"/></Autocomplete.Clear><Autocomplete.Trigger aria-label="Show saved medicines" className="flex size-10 items-center justify-center border-l text-muted-foreground hover:bg-muted"><ChevronDown className="size-4"/></Autocomplete.Trigger></Autocomplete.InputGroup><Autocomplete.Portal><Autocomplete.Positioner sideOffset={5} className="z-50 outline-none"><Autocomplete.Popup className="w-[var(--anchor-width)] max-w-[var(--available-width)] overflow-hidden rounded-xl border bg-white text-foreground shadow-lg transition-[scale,opacity] duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0"><Autocomplete.Empty className="px-4 py-5 text-center text-sm text-muted-foreground">No saved medicine matches. Keep typing to use a new name.</Autocomplete.Empty><Autocomplete.List className="max-h-[min(18rem,var(--available-height))] overflow-y-auto overscroll-contain p-1.5 outline-none data-empty:p-0">{(name: string) => <Autocomplete.Item key={name} value={name} className="cursor-default rounded-lg px-3 py-2.5 text-sm font-medium outline-none data-highlighted:bg-[#edf5f1] data-highlighted:text-[#176452]">{name}</Autocomplete.Item>}</Autocomplete.List></Autocomplete.Popup></Autocomplete.Positioner></Autocomplete.Portal></Autocomplete.Root><p className="text-xs text-muted-foreground">Choose a saved medicine or keep your typed name.</p></div>;
}

function TextArea({
  label,
  name,
  value,
  placeholder,
}: {
  label: string;
  name: string;
  value?: string | null;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        name={name}
        defaultValue={value || ""}
        placeholder={placeholder}
        rows={2}
        maxLength={3000}
        className="w-full rounded-lg border bg-white p-2.5 text-sm placeholder:text-muted-foreground"
      />
    </div>
  );
}

function ScheduleField({ required = true }: { required?: boolean }) {
  const id = useId();
  const [selected, setSelected] = useState("BD");
  const schedule = MEDICINE_SCHEDULES.find(item => item.code === selected);
  return <fieldset className="space-y-2"><legend id={id} className="text-sm font-medium">Schedule</legend><input type="hidden" name="scheduleCode" value={selected} required={required}/><div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">{MEDICINE_SCHEDULES.map(item => <button key={item.code} type="button" aria-pressed={selected === item.code} onClick={() => setSelected(item.code)} className="min-w-11 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors aria-pressed:border-[#176452] aria-pressed:bg-[#176452] aria-pressed:text-white">{item.code}</button>)}</div><p className="text-sm font-medium text-[#176452]" dir="auto">{schedule?.urdu}</p></fieldset>;
}

async function optimizePrintImage(file: File) {
  const supportedType = ["image/png", "image/jpeg", "image/webp", "image/bmp", "image/x-ms-bmp"].includes(file.type);
  if (!supportedType && !/\.bmp$/i.test(file.name)) throw new Error("Choose a BMP, PNG, JPG, or WebP image.");
  let source: ImageBitmap | HTMLImageElement;
  let objectUrl = "";
  try {
    source = await createImageBitmap(file);
  } catch {
    objectUrl = URL.createObjectURL(file);
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("This bitmap image could not be opened by the browser."));
      image.src = objectUrl;
    });
  }
  const scale = Math.min(1, 2200 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the image.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.filter = "contrast(1.25) brightness(1.05) saturate(1.02)";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (source instanceof ImageBitmap) source.close();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  let blob: Blob | null = null;
  for (const quality of [0.94, 0.9, 0.84, 0.76]) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (blob && blob.size <= 1.2 * 1024 * 1024) break;
  }
  if (!blob || blob.size > 1.2 * 1024 * 1024) throw new Error("This image could not be prepared clearly below 1.2 MB. Please choose a smaller image.");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp", lastModified: Date.now() });
}

function PrintImageInput({ number }: { number: number }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  return <div className="space-y-1.5"><Label htmlFor={`prescription-image-${number}`}>Image {number}</Label><Input id={`prescription-image-${number}`} name={`image${number}`} type="file" accept=".bmp,image/bmp,image/x-ms-bmp,image/png,image/jpeg,image/webp" className="h-auto py-2" onChange={async event => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    setError("");
    if (!file) { setStatus(""); return; }
    input.setCustomValidity("Please wait while the image is prepared.");
    setStatus("Preparing image…");
    try {
      const optimized = await optimizePrintImage(file);
      const files = new DataTransfer();
      files.items.add(optimized);
      input.files = files.files;
      input.setCustomValidity("");
      setStatus(`Enhanced & ready · ${Math.max(1, Math.round(optimized.size / 1024))} KB`);
    } catch (reason) {
      input.value = "";
      input.setCustomValidity("");
      setStatus("");
      setError(reason instanceof Error ? reason.message : "Unable to prepare this image.");
    }
  }}/>{status && <p className="text-xs font-medium text-emerald-700">{status}</p>}{error && <p role="alert" className="text-xs text-red-700">{error}</p>}</div>;
}

function PrintImagesFields() {
  return <div className="mt-5 rounded-xl border bg-[#fafcfb] p-4"><h3 className="text-sm font-semibold">Prescription print images <span className="font-normal text-muted-foreground">(optional, up to 3)</span></h3><p className="mt-1 text-xs text-muted-foreground">PNG, JPG, or WebP. Large images are automatically prepared for reliable saving and printing.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{[1,2,3].map(number => <PrintImageInput number={number} key={number}/>)}</div><div className="mt-4 grid max-w-md grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="imageWidthMm">Print width (mm)</Label><Input id="imageWidthMm" name="imageWidthMm" type="number" min="15" max="70" step="0.1" defaultValue="30"/></div><div className="space-y-1.5"><Label htmlFor="imageHeightMm">Print height (mm)</Label><Input id="imageHeightMm" name="imageHeightMm" type="number" min="15" max="120" step="0.1" defaultValue="59.4"/></div></div></div>;
}

function ConsentFields({ consultation }: { consultation?: Consultation | null }) {
  const id = useId();
  return (
    <div className="mt-4 rounded-xl border bg-[#fafcfb] p-4">
      <label className="flex items-start gap-3 text-sm font-medium">
        <input className="mt-1" type="checkbox" name="patientConsent" value="yes" defaultChecked={consultation?.patientConsent} />
        The patient or guardian has understood the proposed treatment and given consent.
      </label>
      <div className="mt-3">
        <Label htmlFor={id}>Consent notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <textarea id={id} name="consentNotes" defaultValue={consultation?.consentNotes || ""} rows={2} maxLength={500} placeholder="e.g. Verbal consent given; guardian name if applicable" className="mt-1.5 w-full rounded-lg border bg-white p-2.5 text-sm placeholder:text-muted-foreground" />
      </div>
    </div>
  );
}
