import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const { datetime, title, phone_number, description, location } = await req.json();

    if (!datetime || !title) {
      return NextResponse.json({ error: "Faltan campos obligatorios: datetime, title" }, { status: 400 });
    }

    // Extraer date (YYYY-MM-DD) y time (HH:mm) del string ISO
    const date = datetime.split('T')[0];
    const time = datetime.split('T')[1].substring(0, 5);

    // 1. Crear el evento en la colección 'events' (la que usa el calendario del CRM)
    const eventData = {
      date, // Formato YYYY-MM-DD
      time, // Formato HH:mm
      title,
      phone_number: phone_number || "",
      description: description || `Cita agendada por Bot para el número ${phone_number}`,
      location: location || "Oficina / Virtual",
      color: "bg-primary", // Color dorado por defecto para citas de bot
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await adminDb.collection("events").add(eventData);

    return NextResponse.json({ 
      success: true, 
      event_id: docRef.id,
      message: "Cita agendada correctamente" 
    });

  } catch (error) {
    console.error("Error al crear evento:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
