import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let phone_number = body.phone_number as string;
    const user_name = body.user_name as string | undefined;
    const message = body.message as string;
    const sender = (body.sender as string | undefined) || "user";

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
      const newContactRef = contactsRef.doc();
      await newContactRef.set({
        profile_id: newContactRef.id,
        phone_number,
        name: "-", 
        user_name: cleanWhatsAppName,
        created_at: timestamp,
      });
    } else {
      // Si ya existe, recuperamos el nombre real que pusimos en el CRM
      const existingContact = contactSnapshot.docs[0];
      dbRealName = existingContact.data().name || "";

      if (!existingContact.data().profile_id) {
        await existingContact.ref.update({
          profile_id: existingContact.id
        });
      }

      // SOLO actualizamos el nick si viene un nombre nuevo y no está vacío
      if (cleanWhatsAppName && sender === "user") {
        await existingContact.ref.update({
          user_name: cleanWhatsAppName
        });
      }
    }

    // 1. Guardar o actualizar el Chat
    const chatRef = adminDb.collection("chats").doc(phone_number);
    const chatSnap = await chatRef.get();

    const chatData: {
      phone_number: string;
      updated_at: Date;
      real_name: string;
      user_name?: string;
    } = {
      phone_number,
      updated_at: timestamp,
      real_name: dbRealName,
    };

    // Solo actualizar el user_name en el chat si viene uno válido
    if (cleanWhatsAppName && sender === "user") {
      chatData.user_name = cleanWhatsAppName;
    }

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
