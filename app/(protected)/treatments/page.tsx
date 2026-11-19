import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatClinicDate } from "@/lib/clinic-time";
import { PageHeading } from "@/components/clinic-ui";
import { MedicineCatalogForm, TreatmentCatalogForm } from "@/components/treatment-forms";
import { Card, CardContent } from "@/components/ui/card";

export default async function TreatmentsPage() {
  await requireUser();
  const [catalog, medicines, prescriptions] = await Promise.all([
    db.treatmentCatalog.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { records: true } } } }),
    db.medicineCatalog.findMany({ orderBy: { name: "asc" } }),
    db.prescription.findMany({ take: 30, orderBy: { createdAt: "desc" }, include: { patient: true, _count: { select: { items: true } } } }),
  ]);

  return <>
    <PageHeading eyebrow="Clinical records" title="Treatments, medicines & prescriptions" description="Maintain reusable catalogs and retrieve previous prescriptions." />
    <div className="grid items-start gap-6 xl:grid-cols-3">
      <div className="space-y-6">
        <Card><CardContent className="p-6"><h2 className="mb-5 font-semibold">Save a medicine</h2><p className="mb-4 text-sm text-muted-foreground">Include the strength in the saved name so it is ready to select while writing a prescription.</p><MedicineCatalogForm /></CardContent></Card>
        <Card><CardContent className="p-6"><h2 className="font-semibold">Saved medicines</h2>{medicines.length ? <ul className="mt-3 max-h-96 divide-y overflow-y-auto">{medicines.map(item => <li key={item.id} className="py-3 text-sm font-medium">{item.name}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No medicines saved yet.</p>}</CardContent></Card>
      </div>
      <div className="space-y-6">
        <Card><CardContent className="p-6"><h2 className="mb-5 font-semibold">Add catalog treatment</h2><TreatmentCatalogForm /></CardContent></Card>
        <Card><CardContent className="p-6"><h2 className="font-semibold">Treatment catalog</h2><ul className="mt-3 divide-y">{catalog.map(item => <li key={item.id} className="py-3 text-sm"><div className="flex justify-between"><b>{item.name}</b><span className="text-muted-foreground">Used {item._count.records}×</span></div>{item.description && <p className="mt-1 text-muted-foreground">{item.description}</p>}</li>)}</ul></CardContent></Card>
      </div>
      <Card><CardContent className="p-6"><h2 className="font-semibold">Previous prescriptions</h2>{prescriptions.length ? <ul className="mt-3 divide-y">{prescriptions.map(item => <li key={item.id} className="flex justify-between gap-3 py-4 text-sm"><div><b>{item.patient.name}</b><p className="text-muted-foreground">{formatClinicDate(item.createdAt)} · {item._count.items} medicine(s)</p></div><Link className="text-[#176452] underline" href={`/prescriptions/${item.id}`}>Preview</Link></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No prescriptions yet.</p>}</CardContent></Card>
    </div>
  </>;
}
