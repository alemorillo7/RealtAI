import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { format, addMinutes, startOfDay, endOfDay, isBefore, parse, addDays } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // Formato YYYY-MM-DD

    // 1. Obtener configuración con valores por defecto
    const configSnap = await adminDb.collection("settings").doc("calendar").get();
    const dbData = configSnap.exists ? configSnap.data() : {};
    
    const config = {
      working_days: dbData?.working_days || [1, 2, 3, 4, 5],
      start_time: dbData?.start_time || "09:00",
      end_time: dbData?.end_time || "18:00",
      slot_duration: Number(dbData?.slot_duration) || 60,
      time_ranges: dbData?.time_ranges || null
    };

    // 2. Determinar el rango de fechas a consultar
    const daysToConsult: string[] = [];
    
    if (dateStr) {
      daysToConsult.push(dateStr);
    } else {
      // Si no hay fecha, consultamos los próximos 7 días
      for (let i = 0; i < 7; i++) {
        const d = addDays(new Date(), i);
        daysToConsult.push(format(d, "yyyy-MM-dd"));
      }
    }

    const fullAvailability: any[] = [];

    for (const currentTargetDateStr of daysToConsult) {
      const targetDate = new Date(currentTargetDateStr + "T00:00:00");
      if (isNaN(targetDate.getTime())) continue;

      const dayOfWeek = targetDate.getDay();

      // Verificar si es día laboral
      if (!config.working_days.includes(dayOfWeek)) {
        continue; // Saltamos días no laborales
      }

      // Obtener citas ya agendadas
      const appointmentsSnap = await adminDb.collection("events")
        .where("date", "==", currentTargetDateStr)
        .get();
      
      const bookedSlots = appointmentsSnap.docs.map(d => d.data().time);

      // Generar slots
      const daySlots = [];
      const ranges = config.time_ranges || [{ start: config.start_time || "09:00", end: config.end_time || "18:00" }];

      for (const range of ranges) {
        let current = parse(range.start, "HH:mm", targetDate);
        const end = parse(range.end, "HH:mm", targetDate);

        while (isBefore(current, end)) {
          const timeStr = format(current, "HH:mm");
          
          // Solo agregar si no está ocupado Y si no ha pasado la hora (si es hoy)
          const now = new Date();
          const slotDateTime = parse(timeStr, "HH:mm", targetDate);
          
          if (!bookedSlots.includes(timeStr) && isBefore(now, slotDateTime)) {
            daySlots.push(timeStr);
          }
          
          current = addMinutes(current, config.slot_duration || 60);
        }
      }

      if (daySlots.length > 0) {
        fullAvailability.push({
          date: currentTargetDateStr,
          day_name: format(targetDate, "EEEE", { locale: es }),
          slots: daySlots
        });
      }
    }

    return NextResponse.json({
      success: true,
      availability: fullAvailability
    });

  } catch (error) {
    console.error("Error en disponibilidad:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
