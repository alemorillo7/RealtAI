import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // Formato YYYY-MM-DD
    const phone = searchParams.get("phone_number");

    // Referencia a la colección de eventos
    let query: any = adminDb.collection("events");

    // Filtros opcionales
    if (dateStr) {
      query = query.where("date", "==", dateStr);
    }
    
    if (phone) {
      query = query.where("phone_number", "==", phone);
    }

    const snapshot = await query.get();
    
    // Interfaz para tipado seguro
    interface CalendarEvent {
      id: string;
      date?: string;
      time?: string;
      [key: string]: any;
    }

    // Mapear los documentos a un array de objetos
    const events: CalendarEvent[] = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      
      // Convertir Firestore Timestamps a strings ISO para evitar errores en el JSON
      if (data.created_at && typeof data.created_at.toDate === 'function') {
        data.created_at = data.created_at.toDate().toISOString();
      }
      if (data.updated_at && typeof data.updated_at.toDate === 'function') {
        data.updated_at = data.updated_at.toDate().toISOString();
      }

      return {
        id: doc.id,
        ...data
      } as CalendarEvent;
    });

    // Opcional: ordenar por fecha y hora si no filtramos por fecha exacta
    // (Asumiendo que date y time están guardados como strings YYYY-MM-DD y HH:mm)
    events.sort((a, b) => {
      const dateA = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}:00`);
      const dateB = new Date(`${b.date || "1970-01-01"}T${b.time || "00:00"}:00`);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json({
      success: true,
      count: events.length,
      events: events
    });

  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return NextResponse.json({ error: "Error interno al obtener eventos" }, { status: 500 });
  }
}
