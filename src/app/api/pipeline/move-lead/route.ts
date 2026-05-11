import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const { lead_id, phone_number, status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: "Falta el campo 'status'" }, { status: 400 });
    }

    if (!lead_id && !phone_number) {
      return NextResponse.json({ error: "Falta 'lead_id' o 'phone_number'" }, { status: 400 });
    }

    // 1. Buscar la etapa correcta
    const stagesSnap = await adminDb.collection("pipeline_configs").get();
    const stages = stagesSnap.docs.map(d => ({ id: d.data().id, label: d.data().label }));
    
    const matchedStage = stages.find(s => 
      s.label.toLowerCase() === status.toLowerCase() || 
      s.id.toLowerCase() === status.toLowerCase()
    );

    if (!matchedStage) {
      return NextResponse.json({ 
        error: `Etapa '${status}' no encontrada`, 
        available_stages: stages.map(s => s.label) 
      }, { status: 404 });
    }

    const finalStatusId = matchedStage.id;

    // 2. Localizar el lead en leads o Leads
    let foundDoc: any = null;
    let foundCollection = "";

    if (lead_id) {
      for (const col of ["leads", "Leads"]) {
        const docRef = adminDb.collection(col).doc(lead_id);
        const snap = await docRef.get();
        if (snap.exists) {
          foundDoc = docRef;
          foundCollection = col;
          break;
        }
      }
    }

    if (!foundDoc && phone_number) {
      const cleanPhone = phone_number.startsWith('+') ? phone_number : '+' + phone_number;
      for (const col of ["leads", "Leads"]) {
        const snap = await adminDb.collection(col).where("phone_number", "==", cleanPhone).limit(1).get();
        if (!snap.empty) {
          foundDoc = snap.docs[0].ref;
          foundCollection = col;
          break;
        }
      }
    }

    if (!foundDoc) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    // 3. Actualizar la etapa
    await foundDoc.update({
      status: finalStatusId,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      message: `Lead movido a '${matchedStage.label}'`,
      collection: foundCollection
    });

  } catch (error) {
    console.error("Error en move-lead:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
