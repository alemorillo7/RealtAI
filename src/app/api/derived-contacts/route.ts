import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getPostgresPool } from "../../../lib/postgres";

export const dynamic = "force-dynamic";

interface DerivedContactRow {
  handoff_id: string;
  client_id: string;
  profile_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  reason: string;
  created_at: string | null;
}

function serializeDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

export async function GET() {
  try {
    const pool = getPostgresPool();
    const { rows } = await pool.query<DerivedContactRow>(`
      SELECT
        hh.id AS handoff_id,
        l.id AS client_id,
        lp.id AS profile_id,
        COALESCE(NULLIF(l.full_name, ''), l.phone, l.email, 'Sin nombre') AS full_name,
        l.phone,
        l.email,
        hh.reason,
        hh.created_at::text AS created_at
      FROM human_handoffs hh
      INNER JOIN leads l ON l.id = hh.lead_id
      LEFT JOIN LATERAL (
        SELECT p.id
        FROM lead_profiles p
        WHERE p.lead_id = l.id
        ORDER BY p.updated_at DESC, p.created_at DESC
        LIMIT 1
      ) lp ON TRUE
      ORDER BY hh.created_at DESC
    `);

    const contacts = rows.map((row: DerivedContactRow) => ({
      ...row,
      created_at: serializeDate(row.created_at),
    }));

    return NextResponse.json({ success: true, count: contacts.length, contacts });
  } catch (error) {
    console.error("Error al obtener contactos derivados:", error);
    return NextResponse.json({ success: false, error: "No se pudieron obtener los contactos derivados" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const client_id = body.client_id || body.lead_id || "";
    const reason = body.reason || body.handoff_reason || "";

    if (!client_id || !reason) {
      return NextResponse.json({ success: false, error: "Faltan datos obligatorios: client_id y reason" }, { status: 400 });
    }

    const derivedContact = {
      client_id,
      profile_id: body.profile_id || "",
      full_name: body.full_name || body.name || "",
      phone_number: body.phone_number || body.phone || "",
      email: body.email || "",
      reason,
      created_at: body.created_at ? new Date(body.created_at) : new Date(),
    };

    const docRef = await adminDb.collection("derived_contacts").add(derivedContact);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Contacto derivado guardado correctamente",
    });
  } catch (error) {
    console.error("Error al guardar contacto derivado:", error);
    return NextResponse.json({ success: false, error: "No se pudo guardar el contacto derivado" }, { status: 500 });
  }
}
