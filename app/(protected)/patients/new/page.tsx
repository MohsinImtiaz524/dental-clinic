import { requireUser } from "@/lib/auth";
import { PatientForm } from "@/components/clinic-forms";
import { PageHeading } from "@/components/clinic-ui";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewPatientPage() {
  await requireUser();
  return <><PageHeading eyebrow="Patient directory" title="Add a patient" description="A few details to make their next visit a little simpler." /><Card className="max-w-xl rounded-2xl py-7 ring-[#e5ebe7]"><CardContent className="px-7"><PatientForm /></CardContent></Card></>;
}
