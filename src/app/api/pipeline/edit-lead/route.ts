import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    let { lead_id, phone_number, name, full_name, email, status } = await req.json();

    // Prioridad al lead_id si existe
    let leadId = lead_id;
    const finalName = name || full_name;

    if (!leadId && !phone_number) {
      return NextResponse.json({ error: "Falta lead_id o phone_number" }, { status: 400 });
    }

    // Si no tenemos ID, buscamos por teléfono
    if (!leadId && phone_number) {
      const cleanPhone = String(phone_number).replace(/\D/g, ''); // Deja solo números
      
      // Buscamos leads y comparamos el teléfono limpio
      const leadsSnap = await adminDb.collection("leads").get();
      const match = leadsSnap.docs.find(doc => {
        const dbPhone = String(doc.data().phone_number || "").replace(/\D/g, '');
        return dbPhone === cleanPhone;
      });

      if (!match) {
        return NextResponse.json({ error: "Contacto no encontrado por teléfono: " + phone_number }, { status: 404 });
      }
      leadId = match.id;
    }

    if (!leadId) {
      return NextResponse.json({ error: "No se pudo determinar el ID del lead" }, { status: 400 });
    }

    const updateData: any = {
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    if (finalName) updateData.name = finalName;
    if (email) updateData.email = email;
    if (status) updateData.status = status;

    await adminDb.collection("leads").doc(leadId).update(updateData);

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
