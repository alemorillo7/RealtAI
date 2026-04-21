import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const N8N_WEBHOOK_URL = "https://automation8n.fluxia.site/webhook/215cda7d-ad06-40f8-babd-726ad0ab948b";

export async function POST(req: Request) {
  try {
    const { phone_number, message } = await req.json();

    if (!phone_number || !message) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // 1. Guardar mensaje optimísticamente en Firebase DB
    const timestamp = new Date();
    await adminDb.collection("messages").add({
      phone_number,
      message,
      sender: "agent",
      created_at: timestamp,
    });

    await adminDb.collection("chats").doc(phone_number).set({
      phone_number,
      updated_at: timestamp,
    }, { merge: true });

    // 2. Enviar a n8n para que dispare a WhatsApp
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number, message }),
    });

    if (!response.ok) {
      console.error("n8n webhook error:", await response.text());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en send-message:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
