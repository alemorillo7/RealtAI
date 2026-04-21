import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { phone_number, agent_active } = await req.json();

    if (!phone_number || typeof agent_active !== "boolean") {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    await adminDb.collection("chats").doc(phone_number).update({
      agent_active,
    });

    return NextResponse.json({ success: true, agent_active });
  } catch (error) {
    console.error("Error en toggle-bot:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
