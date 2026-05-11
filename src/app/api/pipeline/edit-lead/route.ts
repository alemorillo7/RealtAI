import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    let { lead_id, phone_number, name, full_name, fullName, Full_Name, email, Email, status, user_name, nickname } = payload;

    // LOG DE EMERGENCIA: Guardamos lo que llega para ver qué está pasando
    await adminDb.collection("debug_n8n").add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      payload: payload
    });

    const finalName = name || full_name || fullName || Full_Name;
    const finalEmail = email || Email;
    let leadId = lead_id;

    // 1. Preparar datos de actualización
    const updateData: any = {
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (finalName && finalName.trim() !== "" && finalName !== "-") {
      updateData.name = finalName.trim();
    }
    if (finalEmail && finalEmail.includes("@")) {
      updateData.email = finalEmail.trim();
    }
    if (status) updateData.status = status;
    
    const rawNick = (user_name || nickname || "").toString().trim();
    if (rawNick && rawNick.length > 1) {
      updateData.user_name = rawNick;
    }

    // 2. Búsqueda y actualización masiva
    const collections = ["leads", "Leads", "contacts"];
    let updatedCount = 0;

    const cleanPhone = phone_number ? String(phone_number).replace(/\D/g, '') : "";
    const last9 = cleanPhone.slice(-9); // Bajamos a 9 dígitos para ser aún más permisivos

    for (const colName of collections) {
      const snap = await adminDb.collection(colName).get();
      for (const doc of snap.docs) {
        const dbPhone = String(doc.data().phone_number || "").replace(/\D/g, '');
        if ((dbPhone.endsWith(last9) && last9.length >= 7) || doc.id === leadId) {
          await doc.ref.update(updateData);
          updatedCount++;
        }
      }
    }

    // 3. Sincronizar Chat
    const chatSnap = await adminDb.collection("chats").get();
    for (const doc of chatSnap.docs) {
      const docPhone = String(doc.data().phone_number || doc.id).replace(/\D/g, '');
      if (docPhone.endsWith(last9) && last9.length >= 7) {
        const chatUpdate: any = { updated_at: admin.firestore.FieldValue.serverTimestamp() };
        if (updateData.name) chatUpdate.real_name = updateData.name;
        if (updateData.user_name) chatUpdate.user_name = updateData.user_name;
        await doc.ref.update(chatUpdate);
      }
    }

    return NextResponse.json({ success: true, updated: updatedCount });

  } catch (error) {
    console.error("Error en edit-lead:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
