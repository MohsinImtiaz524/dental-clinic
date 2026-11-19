"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Check, ChevronDown, LoaderCircle, Search, X } from "lucide-react";
import { Combobox } from "@base-ui/react/combobox";
import { createAppointmentAction, createPatientAction, rescheduleAppointmentAction, updateAppointmentStatusAction } from "@/app/actions/clinic";
import { APPOINTMENT_DURATIONS } from "@/lib/appointment-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PatientForm() {
  const [state, action, pending] = useActionState(createPatientAction, {});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  return <form action={action} className="space-y-6"><div className="space-y-2"><Label htmlFor="name">Full name</Label><Input className="h-11" id="name" name="name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" required minLength={2} maxLength={100} placeholder="Patient's full name" /></div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="phone">Contact number <span className="font-normal text-muted-foreground">(optional)</span></Label><Input className="h-11" id="phone" name="phone" type="tel" value={phone} onChange={event => setPhone(event.target.value)} autoComplete="tel" maxLength={25} placeholder="e.g. +92 300 1234567" /></div><div className="space-y-2"><Label htmlFor="age">Age <span className="font-normal text-muted-foreground">(optional)</span></Label><Input className="h-11" id="age" name="age" type="number" min="0" max="130" placeholder="e.g. 35" /></div><div className="space-y-2"><Label htmlFor="weightKg">Weight in kg <span className="font-normal text-muted-foreground">(optional)</span></Label><Input className="h-11" id="weightKg" name="weightKg" type="number" min="0.1" max="500" step="0.1" placeholder="e.g. 68.5" /></div><div className="space-y-2"><Label htmlFor="gender">Gender <span className="font-normal text-muted-foreground">(optional)</span></Label><Input className="h-11" id="gender" name="gender" maxLength={40} placeholder="e.g. Male, Female" /></div></div><div className="space-y-2"><Label htmlFor="address">Patient address <span className="font-normal text-muted-foreground">(optional)</span></Label><textarea id="address" name="address" rows={3} maxLength={500} autoComplete="street-address" placeholder="House, street, area and city" className="w-full rounded-lg border bg-white p-3 text-sm placeholder:text-muted-foreground"/></div>{state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}<div className="flex items-center gap-4"><Button type="submit" disabled={pending} className="h-10 bg-[#176452] px-5 text-white">{pending && <LoaderCircle className="animate-spin" />}Save patient</Button><Link href="/patients" className="text-sm text-muted-foreground hover:underline">Cancel</Link></div></form>;
}

type PatientOption = { id: string; name: string; phone: string | null };

function PatientCombobox({ patients, value, onValueChange }: { patients: PatientOption[]; value: string | null; onValueChange: (value: string | null) => void }) {
  const items = useMemo(() => Combobox.createItems(patients, { getValue: patient => patient.id, getLabel: patient => patient.name }), [patients]);
  return <Combobox.Root items={items} value={value} onValueChange={onValueChange} name="patientId" required autoHighlight limit={50}
    filter={(patient, query) => { const term = query.trim().toLocaleLowerCase(); return !term || patient.name.toLocaleLowerCase().includes(term) || (patient.phone?.toLocaleLowerCase().includes(term) ?? false); }}>
    <Combobox.InputGroup className="relative flex h-11 w-full items-center rounded-lg border border-input bg-white transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
      <Search className="ml-3 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <Combobox.Input id="patientId" placeholder="Search by name or phone…" className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground" />
      <Combobox.Clear aria-label="Clear patient" className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground data-disabled:hidden"><X className="size-3.5" /></Combobox.Clear>
      <Combobox.Trigger aria-label="Show patients" className="flex size-10 items-center justify-center border-l text-muted-foreground hover:bg-muted"><ChevronDown className="size-4" /></Combobox.Trigger>
    </Combobox.InputGroup>
    <Combobox.Portal><Combobox.Positioner sideOffset={5} className="z-50 outline-none"><Combobox.Popup className="w-[var(--anchor-width)] max-w-[var(--available-width)] overflow-hidden rounded-xl border bg-white text-foreground shadow-lg transition-[scale,opacity] duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0">
      <Combobox.Empty className="px-4 py-5 text-center text-sm text-muted-foreground">No patient matches your search.</Combobox.Empty>
      <Combobox.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto overscroll-contain p-1.5 outline-none data-empty:p-0">
        {(patient: PatientOption) => <Combobox.Item key={patient.id} value={patient.id} className="grid cursor-default grid-cols-[1.25rem_1fr] items-center gap-x-2 rounded-lg px-2.5 py-2.5 text-sm outline-none data-highlighted:bg-[#edf5f1] data-highlighted:text-[#176452]">
          <Combobox.ItemIndicator className="col-start-1 text-[#176452]"><Check className="size-4" /></Combobox.ItemIndicator><span className="col-start-2 min-w-0"><span className="block truncate font-medium">{patient.name}</span>{patient.phone && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{patient.phone}</span>}</span>
        </Combobox.Item>}
      </Combobox.List>
    </Combobox.Popup></Combobox.Positioner></Combobox.Portal>
  </Combobox.Root>;
}

export function AppointmentForm({ patients, defaultPatientId = "", today, appointment }: { patients: PatientOption[]; defaultPatientId?: string; today: string; appointment?: { id: string; patientId: string; startsAt: string; durationMinutes: number; reason: string } }) {
  const [state, action, pending] = useActionState(appointment ? rescheduleAppointmentAction : createAppointmentAction, {});
  const [patient, setPatient] = useState<string | null>(appointment?.patientId || defaultPatientId || null);
  const [startsAt, setStartsAt] = useState(appointment?.startsAt || `${today}T09:00`);
  const [duration, setDuration] = useState(String(appointment?.durationMinutes || 30));
  const [reason, setReason] = useState(appointment?.reason || "");
  return <form action={action} className="space-y-6">
    {appointment && <input type="hidden" name="id" value={appointment.id} />}
    <div className="space-y-2"><Label htmlFor="patientId">Patient</Label><PatientCombobox patients={patients} value={patient} onValueChange={setPatient} /><p className="text-xs text-muted-foreground">Type a name or phone number, then choose a patient. New to the clinic? <Link href="/patients/new" className="text-[#176452] underline">Register a patient first</Link>.</p></div>
    <div className="grid gap-5 sm:grid-cols-[1fr_10rem]"><div className="space-y-2"><Label htmlFor="startsAt">Date and time</Label><Input className="h-11" type="datetime-local" id="startsAt" name="startsAt" value={startsAt} onChange={event => setStartsAt(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="durationMinutes">Duration</Label><select id="durationMinutes" name="durationMinutes" value={duration} onChange={event => setDuration(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm" required>{APPOINTMENT_DURATIONS.map(minutes => <option key={minutes} value={minutes}>{minutes < 60 ? `${minutes} min` : `${minutes / 60} ${minutes === 60 ? "hour" : "hours"}`}</option>)}</select></div></div><p className="-mt-4 text-xs text-muted-foreground">Pakistan Standard Time (Asia/Karachi)</p>
    <div className="space-y-2"><Label htmlFor="reason">Appointment reason</Label><Input className="h-11" id="reason" name="reason" value={reason} onChange={event => setReason(event.target.value)} required maxLength={150} placeholder="e.g. General consultation" /></div>
    {state.conflict && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-medium">Scheduling conflict</p><p className="mt-1 leading-6">{state.conflict}</p><label className="mt-3 flex items-center gap-2"><input type="checkbox" name="allowConflict" value="yes" required /> I understand and want to continue.</label></div>}
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
    <div className="flex items-center gap-4"><Button className="h-10 bg-[#176452] px-5 text-white" type="submit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}{appointment ? "Save new time" : state.conflict ? "Confirm booking" : "Book appointment"}</Button><Link href="/appointments" className="text-sm text-muted-foreground hover:underline">Cancel</Link></div>
  </form>;
}

export function AppointmentStatusForm({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(updateAppointmentStatusAction, {});
  return <form action={action} className="flex flex-col items-end gap-1"><input type="hidden" name="id" value={id} /><div className="flex items-center gap-2"><select name="status" aria-label="Appointment status" defaultValue={status} className="h-8 rounded-lg border bg-white px-2 text-xs" disabled={pending}><option value="SCHEDULED">Scheduled</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select><Button type="submit" variant="outline" size="sm" disabled={pending}>{pending ? "Saving…" : "Save"}</Button></div>{state.error && <p role="alert" className="max-w-52 whitespace-normal text-xs text-red-800">{state.error}</p>}</form>;
}
