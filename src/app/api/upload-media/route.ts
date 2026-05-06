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

    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = admin.storage().bucket();
    const isImage = file.type.startsWith('image/');
    const type = isImage ? 'image' : 'audio';
    const folder = isImage ? 'images' : 'audios';
    const extension = isImage ? (file.name.split('.').pop() || 'jpg') : 'ogg';
    
    const uniqueName = `${Date.now()}.${extension}`;
    const fileRef = bucket.file(`${folder}/${phoneNumber.replace('+', '')}/${uniqueName}`);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type || (isImage ? 'image/jpeg' : 'audio/ogg') }
    });

    // Hacer la URL pública
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

    const timestamp = new Date();

    // Guardar el mensaje con el tipo detectado
    await adminDb.collection("messages").add({
      phone_number: phoneNumber,
      message: publicUrl,
      sender: sender,
      type: type,
      created_at: timestamp,
    });

    // Actualizar o crear el chat
    const chatRef = adminDb.collection("chats").doc(phoneNumber);
    await chatRef.set({
      phone_number: phoneNumber,
      updated_at: timestamp,
    }, { merge: true });

    return NextResponse.json({ success: true, url: publicUrl, type });
  } catch (error) {
    console.error("Error subiendo media:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
