import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    let { phone_number, name, status = "nuevo" } = await req.json();

    if (!phone_number || !name) {
      return NextResponse.json({ error: "Faltan datos (phone_number o name)" }, { status: 400 });
    }

    if (!phone_number.startsWith('+')) {
      phone_number = '+' + phone_number;
    }

    // 1. Buscar el ID real de la etapa basado en el status enviado (puede ser el ID o el Nombre)
    const stagesSnap = await adminDb.collection("pipeline_configs").get();
    const stages = stagesSnap.docs.map(d => ({ id: d.data().id, label: d.data().label }));
    
    // Intentamos buscar por label (ej: "NUEVO LEAD") o por ID (ej: "nuevo")
    const matchedStage = stages.find(s => 
      s.label.toLowerCase() === status.toLowerCase() || 
      s.id.toLowerCase() === status.toLowerCase()
    );

    const finalStatus = matchedStage ? matchedStage.id : (stages[0]?.id || "nuevo");

    // 2. Verificar si ya existe para evitar duplicados en el pipeline
    const existingLeads = await adminDb.collection("leads")
      .where("phone_number", "==", phone_number)
      .limit(1)
      .get();

    if (!existingLeads.empty) {
      const leadId = existingLeads.docs[0].id;
      await adminDb.collection("leads").doc(leadId).update({
        name,
        status: finalStatus,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return NextResponse.json({ success: true, message: "Lead actualizado", leadId });
    }

    // 3. Crear nuevo lead
    const newLead = {
      name,
      phone_number,
      status: finalStatus,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await adminDb.collection("leads").add(newLead);

    return NextResponse.json({ success: true, leadId: docRef.id });
  } catch (error) {
    console.error("Error en add-lead:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
