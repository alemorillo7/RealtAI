import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    let { phone_number, agent_active, bot_active, tags, tag } = await req.json();

    if (!phone_number) {
      return NextResponse.json({ error: "Falta phone_number" }, { status: 400 });
    }

    // 1. Preparar los datos de actualización
    const updateData: any = {};
    const isActive = typeof agent_active === "boolean" ? agent_active : (typeof bot_active === "boolean" ? bot_active : null);
    
    if (isActive !== null) {
      updateData.agent_active = isActive;
      updateData.bot_active = isActive;
    }

    // 2. Localizar el chat (intentar varias formas para asegurar sincronización)
    const phoneWithPlus = phone_number.startsWith('+') ? phone_number : '+' + phone_number;
    const phoneWithoutPlus = phone_number.startsWith('+') ? phone_number.substring(1) : phone_number;
    
    let chatRef = adminDb.collection("chats").doc(phoneWithPlus);
    let chatSnap = await chatRef.get();

    // Si no existe con +, probar sin +
    if (!chatSnap.exists) {
      chatRef = adminDb.collection("chats").doc(phoneWithoutPlus);
      chatSnap = await chatRef.get();
    }

    // Si sigue sin existir, buscar un documento que tenga ese número de teléfono dentro
    if (!chatSnap.exists) {
      const querySnap = await adminDb.collection("chats")
        .where("phone_number", "in", [phoneWithPlus, phoneWithoutPlus])
        .limit(1)
        .get();
      
      if (!querySnap.empty) {
        chatRef = querySnap.docs[0].ref;
        chatSnap = await chatRef.get();
      }
    }

    if (tag || tags) {
      let currentTags = chatSnap.exists ? (chatSnap.data()?.tags || []) : [];
      if (tag) {
        if (!currentTags.includes(tag)) currentTags.push(tag);
      } else if (tags) {
        currentTags = tags;
      }
      updateData.tags = currentTags;
    }

    // Actualizar el documento encontrado (o crear el de con + si no existe nada)
    await chatRef.set(updateData, { merge: true });

    return NextResponse.json({ 
      success: true, 
      id_actualizado: chatRef.id,
      data: updateData 
    });
  } catch (error) {
    console.error("Error en toggle-bot:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
