"use client";
import { Printer } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
export function PrintButton() {
  useEffect(() => { if (new URLSearchParams(window.location.search).get("print") === "1") { const timer=window.setTimeout(()=>window.print(),350); return ()=>window.clearTimeout(timer); } }, []);
  return <Button type="button" variant="outline" className="print:hidden" onClick={() => window.print()}><Printer />Print / print again</Button>;
}
