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
      
      const collectionsToUpdate = ["leads", "Leads", "contacts"];
      let foundAny = false;
      let phoneToSearch = phone_number;

      for (const colName of collectionsToUpdate) {
        const snap = await adminDb.collection(colName).get();
        const matches = snap.docs.filter(doc => 
          String(doc.data().phone_number || "").replace(/\D/g, '') === cleanPhone
        );
        
        for (const match of matches) {
          foundAny = true;
          phoneToSearch = match.data().phone_number || phoneToSearch;
          
          const updateData: any = {
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          };

          if (finalName && finalName !== "-") {
            updateData.name = finalName.trim();
          }
          if (email && email.includes("@")) {
            updateData.email = email.trim();
          }
          if (status && (colName === "leads" || colName === "Leads")) {
            updateData.status = status;
          }
          
          const rawNick = (user_name || nickname || "").toString().trim();
          if (rawNick && rawNick.length > 1) {
            updateData.user_name = rawNick;
          }

          await adminDb.collection(colName).doc(match.id).update(updateData);
        }
      }

      if (!foundAny) {
        return NextResponse.json({ 
          error: "No encontrado en Leads ni Contactos",
          phone_sent: phone_number,
          phone_cleaned: cleanPhone,
          collections_searched: collectionsToUpdate
        }, { status: 404 });
      }

      // Sync chats using the phone number found
      if (finalName || email) {
        const chatUpdate: any = {};
        if (finalName) chatUpdate.real_name = finalName.trim();
        
        const chatSnap = await adminDb.collection("chats").where("phone_number", "==", phoneToSearch).get();
        if (!chatSnap.empty) {
          for (const doc of chatSnap.docs) {
            await adminDb.collection("chats").doc(doc.id).update(chatUpdate);
          }
        } else {
          // Also try direct document access since ID is usually phone_number
          try {
            const chatDoc = await adminDb.collection("chats").doc(phoneToSearch).get();
            if (chatDoc.exists) {
              await adminDb.collection("chats").doc(phoneToSearch).update(chatUpdate);
            }
          } catch(e) {}
        }
      }
    } else if (leadId) {
      const updateData: any = {
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };
      if (finalName && finalName !== "-") updateData.name = finalName.trim();
      if (email && email.includes("@")) updateData.email = email.trim();
      if (status) updateData.status = status;
      
      const rawNick = (user_name || nickname || "").toString().trim();
      if (rawNick && rawNick.length > 1) {
        updateData.user_name = rawNick;
      }

      for (const colName of ["leads", "Leads", "contacts"]) {
        try {
          await adminDb.collection(colName).doc(leadId).update(updateData);
        } catch (e) {}
      }
    }

    // Sincronizar con el chat si existe (only if leadId was provided, since phone logic is above)
    if (leadId && (finalName || email)) {
      const chatUpdate: any = {};
      if (finalName) chatUpdate.real_name = finalName.trim();
      
      try {
        const leadDoc = await adminDb.collection("leads").doc(leadId).get();
        const phoneToSearch = leadDoc.data()?.phone_number;
        if (phoneToSearch) {
          const chatSnap = await adminDb.collection("chats").where("phone_number", "==", phoneToSearch).get();
          if (!chatSnap.empty) {
            for (const doc of chatSnap.docs) {
              await adminDb.collection("chats").doc(doc.id).update(chatUpdate);
            }
          } else {
             const chatDoc = await adminDb.collection("chats").doc(phoneToSearch).get();
             if (chatDoc.exists) {
               await adminDb.collection("chats").doc(phoneToSearch).update(chatUpdate);
             }
          }
        }
      } catch(e) {}
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
