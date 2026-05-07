import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Falta eventId" }, { status: 400 });
    }

    await adminDb.collection("events").doc(eventId).delete();

    return NextResponse.json({ success: true, message: "Evento eliminado" });
  } catch (error) {
    console.error("Error en delete-event:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
