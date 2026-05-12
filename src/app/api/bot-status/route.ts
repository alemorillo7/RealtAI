import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let phone_number = searchParams.get("phone_number");

    if (!phone_number) {
      return NextResponse.json({ error: "Falta phone_number" }, { status: 400 });
    }

    // 2. Localizar el chat de forma flexible
    const phoneWithPlus = phone_number.startsWith('+') ? phone_number : '+' + phone_number;
    const phoneWithoutPlus = phone_number.startsWith('+') ? phone_number.substring(1) : phone_number;
    
    let chatSnap = await adminDb.collection("chats").doc(phoneWithPlus).get();

    // Si no existe con +, probar sin +
    if (!chatSnap.exists) {
      chatSnap = await adminDb.collection("chats").doc(phoneWithoutPlus).get();
    }

    // Si sigue sin existir, buscar por el campo phone_number
    if (!chatSnap.exists) {
      const querySnap = await adminDb.collection("chats")
        .where("phone_number", "in", [phoneWithPlus, phoneWithoutPlus])
        .limit(1)
        .get();
      
      if (!querySnap.empty) {
        chatSnap = querySnap.docs[0];
      }
    }

    if (!chatSnap.exists) {
      // Si el chat no existe en el CRM, el bot debe estar activo por defecto para atenderlo
      return NextResponse.json({ agent_active: true, bot_active: true, source: "default" });
    }

    const data = chatSnap.data();
    console.log("DEBUG BOT STATUS:", { id: chatSnap.id, data });
    
    // Es activo si CUALQUIERA de los dos campos es true
    const isActive = data?.agent_active === true || data?.bot_active === true;

    return NextResponse.json({ 
      agent_active: isActive, 
      bot_active: isActive,
      chat_id: chatSnap.id,
      debug_data: data
    });
  } catch (error) {
    console.error("Error en bot-status:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
