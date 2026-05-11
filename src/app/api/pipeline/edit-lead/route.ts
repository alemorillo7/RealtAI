import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    let { lead_id, phone_number, name, full_name, email, status, user_name, nickname } = await req.json();

    // Prioridad al lead_id si existe
    let leadId = lead_id;
    const finalName = name || full_name;

    if (!leadId && !phone_number) {
      return NextResponse.json({ error: "Falta lead_id o phone_number" }, { status: 400 });
    }

    // Si no tenemos ID, buscamos por teléfono en todas las colecciones
    if (!leadId && phone_number) {
      const cleanPhone = String(phone_number).replace(/\D/g, '');
      
      const collectionsToSearch = ["leads", "Leads", "contacts"];
      let match = null;
      let foundCollection = "";

      for (const colName of collectionsToSearch) {
        const snap = await adminDb.collection(colName).get();
        match = snap.docs.find(doc => 
          String(doc.data().phone_number || "").replace(/\D/g, '') === cleanPhone
        );
        if (match) {
          foundCollection = colName;
          break;
        }
      }

      if (!match) {
        return NextResponse.json({ 
          error: "No encontrado en Leads ni Contactos",
          phone_sent: phone_number,
          phone_cleaned: cleanPhone,
          collections_searched: collectionsToSearch
        }, { status: 404 });
      }
      
      leadId = match.id;
      
      // Actualizar en la colección encontrada
      const updateData: any = {
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      if (finalName) updateData.name = finalName;
      if (email) updateData.email = email;
      if (status) updateData.status = status;
      
      const finalNick = user_name || nickname;
      if (finalNick) updateData.user_name = finalNick;

      await adminDb.collection(foundCollection).doc(leadId).update(updateData);
    } else if (leadId) {
      // Si ya tenemos el ID, intentamos actualizar en ambas por si acaso
      const updateData: any = {
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };
      if (finalName) updateData.name = finalName;
      if (email) updateData.email = email;
      if (status) updateData.status = status;
      
      const finalNick = user_name || nickname;
      if (finalNick) updateData.user_name = finalNick;

      for (const colName of ["leads", "Leads", "contacts"]) {
        try {
          await adminDb.collection(colName).doc(leadId).update(updateData);
        } catch (e) {}
      }
    }

    // Sincronizar con el chat si existe
    if (finalName || email) {
      const chatUpdate: any = {};
      if (finalName) chatUpdate.real_name = finalName;
      
      const phoneToSearch = (await adminDb.collection("leads").doc(leadId).get()).data()?.phone_number;
      if (phoneToSearch) {
        const chatSnap = await adminDb.collection("chats").where("phone_number", "==", phoneToSearch).limit(1).get();
        if (!chatSnap.empty) {
          await adminDb.collection("chats").doc(chatSnap.docs[0].id).update(chatUpdate);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Contacto y Chat actualizados correctamente",
      leadId 
    });

  } catch (error) {
    console.error("Error en edit-lead:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
