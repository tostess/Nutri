import { NextResponse } from "next/server";
import { envioLiberado } from "@/lib/whatsapp/zapi";

export const dynamic = "force-dynamic";

export function GET() {
  const l = envioLiberado();
  return NextResponse.json({ automatico: l.ok, motivo: l.motivo });
}
