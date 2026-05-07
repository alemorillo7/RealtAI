import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    let { phone_number } = await req.json();

    if (!phone_number) {
      return NextResponse.json({ error: "Falta phone_number" }, { status: 400 });
    }

    if (!phone_number.startsWith('+')) {
      phone_number = '+' + phone_number;
    }

    // 1. Buscar el lead actual
    const leadSnap = await adminDb.collection("leads")
      .where("phone_number", "==", phone_number)
      .limit(1)
      .get();

    if (leadSnap.empty) {
      return NextResponse.json({ error: "Lead no encontrado en el pipeline" }, { status: 404 });
    }

    const leadDoc = leadSnap.docs[0];
    const currentLeadData = leadDoc.data();
    const currentStatus = currentLeadData.status;

    // 2. Obtener todas las etapas configuradas ordenadas por 'order'
    const stagesSnap = await adminDb.collection("pipeline_configs")
      .orderBy("order", "asc")
      .get();

    const stages = stagesSnap.docs.map(doc => ({
      fireId: doc.id,
      ...doc.data()
    })) as any[];

    if (stages.length === 0) {
      return NextResponse.json({ error: "No hay etapas configuradas en el pipeline" }, { status: 500 });
    }

    // 3. Encontrar el índice de la etapa actual
    const currentIndex = stages.findIndex(s => s.id === currentStatus);
    
    if (currentIndex === -1) {
        // Si por alguna razón el status no coincide con una etapa válida, lo movemos a la primera
        await adminDb.collection("leads").doc(leadDoc.id).update({
            status: stages[0].id,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        return NextResponse.json({ success: true, message: "Lead reseteado a la primera etapa", nextStage: stages[0].label });
    }

    // 4. Mover a la siguiente etapa si existe
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      
      await adminDb.collection("leads").doc(leadDoc.id).update({
        status: nextStage.id,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      return NextResponse.json({ 
        success: true, 
        previous: stages[currentIndex].label,
        next: nextStage.label 
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: "El lead ya está en la última etapa", 
        current: stages[currentIndex].label 
      });
    }

  } catch (error) {
    console.error("Error en move-lead:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
