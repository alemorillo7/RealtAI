import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let phoneNumber = formData.get("phone_number") as string | null;
    const sender = (formData.get("sender") as string) || "user";

    if (!file || !phoneNumber) {
      return NextResponse.json({ error: "Se requiere 'file' y 'phone_number'" }, { status: 400 });
    }

    phoneNumber = phoneNumber.replace(/^\+/, '');
    const finalPhone = '+' + phoneNumber;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = admin.storage().bucket();
    const uniqueName = `${Date.now()}_${file.name || 'audio.ogg'}`;
    const fileRef = bucket.file(`audios/${finalPhone.replace('+', '')}/${uniqueName}`);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type || 'audio/ogg' }
    });

    // Hacer la URL pública
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

    const timestamp = new Date();

    // Guardar el mensaje como tipo "audio"
    await adminDb.collection("messages").add({
      phone_number: finalPhone,
      message: publicUrl,
      sender: sender,
      type: "audio",
      created_at: timestamp,
    });

    // Actualizar o crear el chat
    const chatRef = adminDb.collection("chats").doc(finalPhone);
    const chatSnap = await chatRef.get();
    
    if (chatSnap.exists) {
      await chatRef.update({ updated_at: timestamp });
    } else {
      await chatRef.set({
        phone_number: finalPhone,
        user_name: finalPhone,
        agent_active: true,
        updated_at: timestamp,
        tags: []
      });
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Error subiendo audio:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
