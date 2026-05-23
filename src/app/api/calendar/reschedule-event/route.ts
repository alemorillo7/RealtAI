import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const { event_id, phone_number, old_datetime, new_datetime } = await req.json();

    if (!new_datetime) {
      return NextResponse.json({ error: "Falta el campo new_datetime" }, { status: 400 });
    }

    // Extraer nueva fecha y hora
    let newDate = "";
    let newTime = "";
    try {
      if (new_datetime.includes('T')) {
        newDate = new_datetime.split('T')[0];
        newTime = new_datetime.split('T')[1].substring(0, 5);
      } else {
        const parts = new_datetime.split(' ');
        newDate = parts[0];
        newTime = parts[1] ? parts[1].substring(0, 5) : "00:00";
      }
    } catch (e) {
      return NextResponse.json({ error: "Formato de new_datetime inválido" }, { status: 400 });
    }

    let eventRef;

    // Opción A: Identificar por event_id
    if (event_id) {
      eventRef = adminDb.collection("events").doc(event_id);
    } 
    // Opción B: Identificar por teléfono y fecha antigua
    else if (phone_number && old_datetime) {
      let oldDate = "";
      let oldTime = "";
      
      if (old_datetime.includes('T')) {
        oldDate = old_datetime.split('T')[0];
        oldTime = old_datetime.split('T')[1].substring(0, 5);
      } else {
        const parts = old_datetime.split(' ');
        oldDate = parts[0];
        oldTime = parts[1] ? parts[1].substring(0, 5) : "";
      }

      const querySnap = await adminDb.collection("events")
        .where("phone_number", "==", phone_number)
        .where("date", "==", oldDate)
        .where("time", "==", oldTime)
        .limit(1)
        .get();

      if (querySnap.empty) {
        return NextResponse.json({ error: "No se encontró la cita original para reprogramar" }, { status: 404 });
      }
      eventRef = querySnap.docs[0].ref;
    } else {
      return NextResponse.json({ error: "Falta event_id o datos de la cita antigua" }, { status: 400 });
    }

    // Actualizar la cita
    await eventRef.update({
      date: newDate,
      time: newTime,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      message: "Cita reprogramada correctamente",
      new_date: newDate,
      new_time: newTime
    });

  } catch (error) {
    console.error("Error al reprogramar evento:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
