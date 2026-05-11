import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    let { phone_number, message, sender, user_name: cleanWhatsAppName, name, full_name, email } = payload;

    // LOG DE EMERGENCIA en Mensajes
    await adminDb.collection("debug_n8n").add({
      type: "ingest-message",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      payload: payload
    });

    if (!phone_number || !message || !sender) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const cleanPhone = String(phone_number).replace(/\D/g, '');
    const last9 = cleanPhone.slice(-9);

    // 1. Buscar el nombre real actual en cualquier colección (Búsqueda Robusta)
    let dbRealName = name || full_name || "";
    let dbEmail = email || "";

    const collections = ["contacts", "leads", "Leads"];
    for (const colName of collections) {
      const snap = await adminDb.collection(colName).get();
      const match = snap.docs.find(doc => 
        String(doc.data().phone_number || "").replace(/\D/g, '').endsWith(last9)
      );
      if (match) {
        if (!dbRealName) dbRealName = match.data().name || "";
        if (!dbEmail) dbEmail = match.data().email || "";
        
        // Si n8n nos mandó datos nuevos, actualizamos el contacto de una vez
        const updateData: any = { updated_at: timestamp };
        if (name || full_name) updateData.name = (name || full_name).trim();
        if (email) updateData.email = email.trim();
        if (cleanWhatsAppName && sender === "user") updateData.user_name = cleanWhatsAppName;
        
        if (Object.keys(updateData).length > 1) {
          await match.ref.update(updateData);
        }
      }
    }

    // 2. Guardar el mensaje en la colección de mensajes
    await adminDb.collection("messages").add({
      phone_number,
      message,
      sender,
      timestamp,
      user_name: cleanWhatsAppName || null
    });

    // 3. Actualizar o crear el chat en la lista de Agentes
    const chatRef = adminDb.collection("chats").doc(phone_number);
    const chatSnap = await chatRef.get();

    const chatData: any = {
      phone_number,
      updated_at: timestamp,
      last_message: message,
      real_name: dbRealName || "-",
    };

    if (cleanWhatsAppName && sender === "user") {
      chatData.user_name = cleanWhatsAppName;
    }

    if (chatSnap.exists) {
      await chatRef.update(chatData);
    } else {
      await chatRef.set({
        ...chatData,
        created_at: timestamp,
        agent_active: true
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en ingest-message:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
