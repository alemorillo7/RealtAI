import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("DEBUG ADD EVENT BODY:", body);
    
    const { datetime, title, phone_number, description, location } = body;

    if (!datetime || !title) {
      return NextResponse.json({ error: "Faltan campos obligatorios: datetime, title" }, { status: 400 });
    }

    // Extraer date y time de forma segura
    let date = "";
    let time = "";

    try {
      if (datetime.includes('T')) {
        date = datetime.split('T')[0];
        time = datetime.split('T')[1].substring(0, 5);
      } else {
        // Soporte para formato "YYYY-MM-DD HH:mm:ss"
        const parts = datetime.split(' ');
        date = parts[0];
        time = parts[1] ? parts[1].substring(0, 5) : "00:00";
      }
    } catch (e) {
      return NextResponse.json({ error: "Formato de datetime inválido. Use YYYY-MM-DDTHH:mm:ss" }, { status: 400 });
    }

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
