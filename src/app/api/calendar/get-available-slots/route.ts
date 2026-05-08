import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { date } = await req.json(); // Formato "YYYY-MM-DD"

    if (!date) {
      return NextResponse.json({ error: "Falta la fecha" }, { status: 400 });
    }

    // 1. Obtener configuración de horarios
    const configDoc = await adminDb.collection("calendar_configs").doc("settings").get();
    const businessHours = configDoc.exists 
      ? configDoc.data()?.businessHours 
      : { start: "09:00", end: "18:00" };

    // 2. Obtener eventos para ese día
    const eventsSnap = await adminDb.collection("events")
      .where("date", "==", date)
      .get();
    
    const busySlots = eventsSnap.docs.map(d => ({
      start: d.data().time,
      end: d.data().endTime || d.data().time // fallback si no tiene end
    }));

    // 3. Generar slots (cada 30 min por defecto)
    const slots = [];
    let current = new Date(`1970-01-01T${businessHours.start}:00`);
    const end = new Date(`1970-01-01T${businessHours.end}:00`);

    while (current < end) {
      const timeStr = current.toTimeString().substring(0, 5);
      
      // Verificar si el slot está ocupado
      const isBusy = busySlots.some(busy => {
        const bStart = busy.start;
        const bEnd = busy.end;
        // Si el slot actual está dentro del rango ocupado
        return timeStr >= bStart && timeStr < bEnd;
      });

      if (!isBusy) {
        slots.push(timeStr);
      }

      // Avanzar 30 minutos
      current.setMinutes(current.getMinutes() + 30);
    }

    return NextResponse.json({ 
      date, 
      businessHours, 
      availableSlots: slots 
    });

  } catch (error) {
    console.error("Error en get-available-slots:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
