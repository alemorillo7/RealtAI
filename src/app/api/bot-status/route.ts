import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let phone_number = searchParams.get("phone_number");

    if (!phone_number) {
      return NextResponse.json({ error: "Falta phone_number" }, { status: 400 });
    }

    phone_number = phone_number.replace(/^\+/, '');

    const chatSnap = await adminDb.collection("chats").doc(phone_number).get();

    if (!chatSnap.exists) {
      return NextResponse.json({ agent_active: true }); // Default si no existe
    }

    return NextResponse.json({ agent_active: chatSnap.data()?.agent_active ?? true });
  } catch (error) {
    console.error("Error en bot-status:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
