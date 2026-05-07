import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const { title, date, time, location, description, color = "bg-primary" } = await req.json();

    if (!title || !date) {
      return NextResponse.json({ error: "Faltan datos obligatorios (title o date)" }, { status: 400 });
    }

    // El formato de date debe ser "YYYY-MM-DD"
    const newEvent = {
      title,
      date,
      time: time || "",
      location: location || "",
      description: description || "",
      color,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await adminDb.collection("events").add(newEvent);

    return NextResponse.json({ success: true, eventId: docRef.id });
  } catch (error) {
    console.error("Error en add-event:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
