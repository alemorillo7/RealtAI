import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { event_id, phone_number, datetime } = await req.json();

    // Opción A: Cancelar por ID directo
    if (event_id) {
      await adminDb.collection("events").doc(event_id).delete();
      return NextResponse.json({ success: true, message: "Evento eliminado por ID" });
    }

    // Opción B: Cancelar buscando por teléfono y fecha
    if (phone_number && datetime) {
      const date = datetime.split('T')[0];
      const time = datetime.split('T')[1].substring(0, 5);

      const querySnap = await adminDb.collection("events")
        .where("phone_number", "==", phone_number)
        .where("date", "==", date)
        .where("time", "==", time)
        .get();

      if (querySnap.empty) {
        return NextResponse.json({ error: "No se encontró ninguna cita para cancelar con esos datos" }, { status: 404 });
      }

      // Eliminar todos los encontrados (debería ser uno solo)
      const batch = adminDb.batch();
      querySnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      return NextResponse.json({ success: true, message: "Cita cancelada correctamente" });
    }

    return NextResponse.json({ error: "Falta event_id o la combinación de phone_number y datetime" }, { status: 400 });

  } catch (error) {
    console.error("Error al cancelar evento:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
