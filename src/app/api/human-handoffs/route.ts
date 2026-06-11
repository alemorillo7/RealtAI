import { NextResponse } from "next/server";
import { getPostgresPool } from "../../../lib/postgres";

export const dynamic = "force-dynamic";

interface HumanHandoffRow {
  handoff_id: string;
  client_id: string;
  conversation_id: string | null;
  profile_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  current_state: string | null;
  lead_kind: string | null;
  source_channel: string | null;
  current_owner_type: string | null;
  current_owner_id: string | null;
  reason: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
  summary_id: string | null;
  summary_type: string | null;
  summary_text: string | null;
  summary_json: string | null;
  summary_version: number | null;
  generated_by: string | null;
  summary_created_at: string | null;
  readiness_score: string | null;
  completeness_pct: string | null;
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
    const { rows } = await pool.query<HumanHandoffRow>(`
      SELECT
        hh.id AS handoff_id,
        l.id AS client_id,
        hh.conversation_id::text AS conversation_id,
        lp.id AS profile_id,
        COALESCE(NULLIF(l.full_name, ''), l.phone, l.email, 'Sin nombre') AS full_name,
        l.phone,
        l.email,
        l.current_state::text AS current_state,
        l.lead_kind::text AS lead_kind,
        l.source_channel::text AS source_channel,
        l.current_owner_type::text AS current_owner_type,
        l.current_owner_id,
        hh.reason,
        hh.priority::text AS priority,
        hh.status::text AS status,
        hh.assigned_to,
        hh.assigned_at::text AS assigned_at,
        hh.resolved_at::text AS resolved_at,
        ls.id AS summary_id,
        ls.summary_type::text AS summary_type,
        ls.summary_text,
        ls.summary_json::text AS summary_json,
        ls.version AS summary_version,
        ls.generated_by,
        ls.created_at::text AS summary_created_at,
        lp.readiness_score::text AS readiness_score,
        lp.completeness_pct::text AS completeness_pct,
        hh.created_at::text AS created_at
      FROM human_handoffs hh
      INNER JOIN leads l
        ON l.id = hh.lead_id
      LEFT JOIN lead_summaries ls
        ON ls.id = hh.summary_id
      LEFT JOIN LATERAL (
        SELECT
          p.id,
          p.readiness_score,
          p.completeness_pct
        FROM lead_profiles p
        WHERE p.lead_id = l.id
        ORDER BY p.updated_at DESC, p.created_at DESC
        LIMIT 1
      ) lp
        ON TRUE
      ORDER BY hh.created_at DESC
    `);

    const handoffs = rows.map((row: HumanHandoffRow) => ({
      ...row,
      assigned_at: serializeDate(row.assigned_at),
      resolved_at: serializeDate(row.resolved_at),
      summary_created_at: serializeDate(row.summary_created_at),
      created_at: serializeDate(row.created_at),
    }));

    return NextResponse.json({
      success: true,
      count: handoffs.length,
      handoffs,
    });
  } catch (error) {
    console.error("Error al obtener human handoffs:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los human handoffs" },
      { status: 500 }
    );
  }
}
