import Link from "next/link";
import { CalendarPlus, Plus, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function ActionLink({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  return <Link href={href} className={buttonVariants({ variant: secondary ? "outline" : "default", className: `h-10 gap-2 px-4 ${secondary ? "bg-white text-[#335b48]" : "bg-[#176452] text-white hover:bg-[#104e40]"}` })}>{secondary ? <CalendarPlus className="size-4" /> : <Plus className="size-4" />}{children}</Link>;
}

export function PageHeading({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description: string; children?: React.ReactNode }) {
  void eyebrow;
  void description;
  return <div className="mb-8 flex flex-wrap items-center justify-between gap-5"><h1 className="text-2xl font-semibold tracking-tight sm:text-[29px]">{title}</h1>{children && <div className="flex flex-wrap gap-3">{children}</div>}</div>;
}

export function EmptyState({ icon: Icon, title, description, href, action }: { icon: LucideIcon; title: string; description: string; href: string; action: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-5 py-9 text-center"><span className="mb-4 rounded-2xl bg-[#f0f5f1] p-3 text-[#7c9b82]"><Icon className="size-6" /></span><h3 className="text-sm font-semibold">{title}</h3><p className="mb-5 mt-2 max-w-xs text-xs leading-6 text-[#8b9a90]">{description}</p><Link href={href} className="text-xs font-semibold text-[#176452] hover:underline">{action} →</Link></div>;
}

const statuses = {
  SCHEDULED: { label: "Scheduled", style: "bg-[#fff6df] text-[#a58228]" },
  COMPLETED: { label: "Completed", style: "bg-[#e9f4ed] text-[#4e8a62]" },
  CANCELLED: { label: "Cancelled", style: "bg-[#f4eded] text-[#a27373]" },
};
export function StatusBadge({ status }: { status: keyof typeof statuses }) {
  const item = statuses[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${item.style}`}><span className="size-1 rounded-full bg-current" />{item.label}</span>;
}
