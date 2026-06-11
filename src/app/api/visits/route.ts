import { NextResponse } from "next/server";
import { getPostgresPool } from "../../../lib/postgres";

export const dynamic = "force-dynamic";

interface VisitRow {
  id: string;
  agency_id: string;
  lead_id: string;
  property_id: string;
  status: string;
  proposed_slots: string | null;
  selected_slot_start: string | null;
  selected_slot_end: string | null;
  timezone: string | null;
  calendar_provider: string | null;
  calendar_event_id: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  rescheduled_from_visit_id: string | null;
  reminder_24h_sent_at: string | null;
  reminder_2h_sent_at: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  lead_name: string | null;
  lead_phone: string | null;
  lead_email: string | null;
  lead_state: string | null;
  property_title: string | null;
  property_operation_type: string | null;
  property_type: string | null;
  property_zone: string | null;
  property_address_text: string | null;
  property_price: string | null;
  property_currency: string | null;
  property_status: string | null;
}

function serializeDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

export async function GET() {
  try {
    const pool = getPostgresPool();
    const { rows } = await pool.query<VisitRow>(`
      SELECT
        v.id,
        v.agency_id::text AS agency_id,
        v.lead_id::text AS lead_id,
        v.property_id::text AS property_id,
        v.status::text AS status,
        v.proposed_slots::text AS proposed_slots,
        v.selected_slot_start::text AS selected_slot_start,
        v.selected_slot_end::text AS selected_slot_end,
        v.timezone,
        v.calendar_provider::text AS calendar_provider,
        v.calendar_event_id,
        v.confirmed_at::text AS confirmed_at,
        v.cancelled_at::text AS cancelled_at,
        v.cancelled_reason,
        v.rescheduled_from_visit_id::text AS rescheduled_from_visit_id,
        v.reminder_24h_sent_at::text AS reminder_24h_sent_at,
        v.reminder_2h_sent_at::text AS reminder_2h_sent_at,
        v.created_by,
        v.created_at::text AS created_at,
        v.updated_at::text AS updated_at,
        COALESCE(NULLIF(l.full_name, ''), l.phone, l.email, 'Sin nombre') AS lead_name,
        l.phone AS lead_phone,
        l.email AS lead_email,
        l.current_state::text AS lead_state,
        p.title AS property_title,
        p.operation_type::text AS property_operation_type,
        p.property_type,
        p.zone AS property_zone,
        p.address_text AS property_address_text,
        p.price::text AS property_price,
        p.currency AS property_currency,
        p.status::text AS property_status
      FROM visits v
      INNER JOIN leads l
        ON l.id = v.lead_id
      INNER JOIN properties p
        ON p.id = v.property_id
      ORDER BY
        COALESCE(v.selected_slot_start, v.created_at) DESC,
        v.created_at DESC
    `);

    const visits = rows.map((row: VisitRow) => ({
      ...row,
      selected_slot_start: serializeDate(row.selected_slot_start),
      selected_slot_end: serializeDate(row.selected_slot_end),
      confirmed_at: serializeDate(row.confirmed_at),
      cancelled_at: serializeDate(row.cancelled_at),
      reminder_24h_sent_at: serializeDate(row.reminder_24h_sent_at),
      reminder_2h_sent_at: serializeDate(row.reminder_2h_sent_at),
      created_at: serializeDate(row.created_at),
      updated_at: serializeDate(row.updated_at),
    }));

    return NextResponse.json({
      success: true,
      count: visits.length,
      visits,
    });
  } catch (error) {
    console.error("Error al obtener visitas:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener las visitas" },
      { status: 500 }
    );
  }
}
