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
      // Intentar buscar con + y sin +
      const cleanPhone = phone_number.replace('+', '');
      const phonesToTry = ['+' + cleanPhone, cleanPhone];
      
      const leadsSnap = await adminDb.collection("leads")
        .where("phone_number", "in", phonesToTry)
        .limit(1)
        .get();

      if (leadsSnap.empty) {
        return NextResponse.json({ error: "Contacto no encontrado por teléfono" }, { status: 404 });
      }
      leadId = leadsSnap.docs[0].id;
    }

    const updateData: any = {
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    if (finalName) updateData.name = finalName;
    if (email) updateData.email = email;
    if (status) updateData.status = status;

    await adminDb.collection("leads").doc(leadId).update(updateData);

    return NextResponse.json({ 
      success: true, 
      message: "Contacto actualizado correctamente",
      leadId 
    });

  } catch (error) {
    console.error("Error en edit-lead:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
