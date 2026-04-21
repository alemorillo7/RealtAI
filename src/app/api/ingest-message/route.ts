import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    let { phone_number, user_name, message, sender = "user" } = await req.json();

    if (!phone_number || !message) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Normalizar quitando el '+' si viene incluido
    phone_number = phone_number.replace(/^\+/, '');

    const timestamp = new Date();

    // 1. Guardar o actualizar el Chat
    const chatRef = adminDb.collection("chats").doc(phone_number);
    const chatSnap = await chatRef.get();

    if (!chatSnap.exists) {
      await chatRef.set({
        phone_number,
        user_name: user_name || phone_number,
        agent_active: true, // Bot is active by default
        updated_at: timestamp,
        tags: [],
      });
    } else {
      await chatRef.update({
        updated_at: timestamp,
        ...(user_name && { user_name }), // update user_name if provided
      });
    }

    // 2. Insertar el Mensaje
    await adminDb.collection("messages").add({
      phone_number,
      message,
      sender: sender,
      created_at: timestamp,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en ingest-message:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
