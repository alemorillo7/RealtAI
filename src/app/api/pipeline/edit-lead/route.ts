import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    let { phone_number, name, email, status } = await req.json();

    if (!phone_number) {
      return NextResponse.json({ error: "Falta phone_number" }, { status: 400 });
    }

    // Normalizar teléfono
    if (!phone_number.startsWith('+')) {
      phone_number = '+' + phone_number;
    }

    // Buscar el lead
    const leadsSnap = await adminDb.collection("leads")
      .where("phone_number", "==", phone_number)
      .limit(1)
      .get();

    if (leadsSnap.empty) {
      return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    }

    const leadId = leadsSnap.docs[0].id;
    const updateData: any = {
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name) updateData.name = name;
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
