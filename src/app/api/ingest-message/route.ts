import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    let { phone_number, user_name, message, sender = "user" } = await req.json();

    if (!phone_number || !message) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Normalizar asegurando que SIEMPRE empiece con '+'
    if (!phone_number.startsWith('+')) {
      phone_number = '+' + phone_number;
    }

    const timestamp = new Date();

    // 1.5 Verificar si existe en Contactos, si no, auto-crearlo
    const contactsRef = adminDb.collection("contacts");
    const contactSnapshot = await contactsRef.where("phone_number", "==", phone_number).limit(1).get();
    
    let finalUserName = user_name || phone_number;

    if (contactSnapshot.empty) {
      await contactsRef.add({
        phone_number,
        name: finalUserName,
        created_at: timestamp,
      });
    } else {
      // Si ya exite el contacto, usamos el nombre que tenga guardado en el CRM
      finalUserName = contactSnapshot.docs[0].data().name || finalUserName;
    }

    // 1. Guardar o actualizar el Chat
    const chatRef = adminDb.collection("chats").doc(phone_number);
    const chatSnap = await chatRef.get();

    if (!chatSnap.exists) {
      await chatRef.set({
        phone_number,
        user_name: finalUserName,
        agent_active: true, // Bot is active by default
        updated_at: timestamp,
        tags: [],
      });
    } else {
      await chatRef.update({
        updated_at: timestamp,
        user_name: finalUserName,
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
