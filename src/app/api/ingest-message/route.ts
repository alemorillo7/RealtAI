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
    const cleanWhatsAppName = user_name || "";

    // 1.5 Verificar si existe en Contactos, si no, auto-crearlo
    const contactsRef = adminDb.collection("contacts");
    const contactSnapshot = await contactsRef.where("phone_number", "==", phone_number).limit(1).get();
    
    let dbRealName = "";

    if (contactSnapshot.empty) {
      // Si es nuevo, dejamos el nombre completo vacío (-) y el nick es el de WhatsApp
      await contactsRef.add({
        phone_number,
        name: "-", // Ya no ponemos el número aquí
        user_name: cleanWhatsAppName,
        created_at: timestamp,
      });
    } else {
      // Si ya existe, recuperamos el nombre real que pusimos en el CRM
      dbRealName = contactSnapshot.docs[0].data().name || "";
      // Aprovechamos para actualizar el nick por si cambió en WhatsApp
      await contactSnapshot.docs[0].ref.update({
        user_name: cleanWhatsAppName
      });
    }

    // 1. Guardar o actualizar el Chat
    const chatRef = adminDb.collection("chats").doc(phone_number);
    const chatSnap = await chatRef.get();

    const chatData: any = {
      phone_number,
      user_name: cleanWhatsAppName, // Este sigue siendo el nombre original para compatibilidad
      real_name: dbRealName,        // Este es el que el dashboard prioriza
      updated_at: timestamp,
    };

    if (!chatSnap.exists) {
      await chatRef.set({
        ...chatData,
        agent_active: true,
        tags: [],
      });
    } else {
      await chatRef.update(chatData);
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
