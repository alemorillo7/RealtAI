import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { format, addMinutes, startOfDay, endOfDay, isBefore, parse } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // Formato YYYY-MM-DD

    if (!dateStr) {
      return NextResponse.json({ error: "Falta el parámetro 'date'" }, { status: 400 });
    }

    // 1. Obtener configuración con valores por defecto ultra-seguros
    const configSnap = await adminDb.collection("settings").doc("calendar").get();
    const dbData = configSnap.exists ? configSnap.data() : {};
    
    const config = {
      working_days: dbData?.working_days || [1, 2, 3, 4, 5],
      start_time: dbData?.start_time || "09:00",
      end_time: dbData?.end_time || "18:00",
      slot_duration: Number(dbData?.slot_duration) || 60,
      time_ranges: dbData?.time_ranges || null
    };

    const targetDate = new Date(dateStr + "T00:00:00");
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Fecha inválida. Use formato YYYY-MM-DD" }, { status: 400 });
    }
    const dayOfWeek = targetDate.getDay();

    // 2. Verificar si es día laboral
    if (!config.working_days.includes(dayOfWeek)) {
      return NextResponse.json({ 
        available: false, 
        message: "La inmobiliaria no trabaja este día",
        slots: [] 
      });
    }

    // 3. Obtener citas ya agendadas para ese día (en la colección 'events')
    const appointmentsSnap = await adminDb.collection("events")
      .where("date", "==", dateStr)
      .get();
    
    const bookedSlots = appointmentsSnap.docs.map(d => d.data().time); // Ej: ["10:00", "15:30"]

    // 4. Generar todos los slots posibles recorriendo todos los rangos (horario cortado)
    const slots = [];
    const ranges = config.time_ranges || [{ start: config.start_time || "09:00", end: config.end_time || "18:00" }];

    for (const range of ranges) {
      let current = parse(range.start, "HH:mm", targetDate);
      const end = parse(range.end, "HH:mm", targetDate);

      while (isBefore(current, end)) {
        const timeStr = format(current, "HH:mm");
        
        // Solo agregar si no está ocupado
        if (!bookedSlots.includes(timeStr)) {
          slots.push(timeStr);
        }
        
        current = addMinutes(current, config.slot_duration || 60);
      }
    }

    return NextResponse.json({
      available: slots.length > 0,
      date: dateStr,
      slots: slots
    });

  } catch (error) {
    console.error("Error en disponibilidad:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
