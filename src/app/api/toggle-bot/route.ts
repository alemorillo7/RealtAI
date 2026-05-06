import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    let { phone_number, agent_active, tags, tag } = await req.json();

    if (!phone_number) {
      return NextResponse.json({ error: "Falta phone_number" }, { status: 400 });
    }

    if (!phone_number.startsWith('+')) {
      phone_number = '+' + phone_number;
    }

    const updateData: any = {};
    if (typeof agent_active === "boolean") {
      updateData.agent_active = agent_active;
    }

    const chatRef = adminDb.collection("chats").doc(phone_number);

    if (tag || tags) {
      const chatSnap = await chatRef.get();
      let currentTags = chatSnap.exists ? (chatSnap.data()?.tags || []) : [];
      
      if (tag) {
        if (!currentTags.includes(tag)) {
          currentTags.push(tag);
        }
      } else if (tags) {
        currentTags = tags; // Sobrescribir con la lista si se pasa 'tags'
      }
      updateData.tags = currentTags;
    }

    await chatRef.set(updateData, { merge: true });

    return NextResponse.json({ success: true, updated: updateData });
  } catch (error) {
    console.error("Error en toggle-bot:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
