import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { phone_number } = await req.json();
    if (!phone_number) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // Normalizar a siempre tener '+'
    const num = phone_number.replace(/^\+/, '');
    const finalPhone = '+' + num;

    // Eliminar el documento del chat principal
    await adminDb.collection("chats").doc(finalPhone).delete();

    // Eliminar todos los mensajes asociados a ese número
    const msgsSnapshot = await adminDb.collection("messages").where("phone_number", "==", finalPhone).get();
    
    // Firestore permite eliminar en lotes (batch) de hasta 500 documentos
    const batch = adminDb.batch();
    msgsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({ success: true, deleted_messages: msgsSnapshot.size });
  } catch (error) {
    console.error("Error al eliminar chat:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
