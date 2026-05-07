import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const { eventId, title, date, time, location, description, color } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Falta eventId" }, { status: 400 });
    }

    const updateData: any = {
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    if (title) updateData.title = title;
    if (date) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;
    if (color) updateData.color = color;

    await adminDb.collection("events").doc(eventId).update(updateData);

    return NextResponse.json({ success: true, message: "Evento actualizado" });
  } catch (error) {
    console.error("Error en edit-event:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
