import { NextResponse } from "next/server";
import { getPostgresPool } from "../../../lib/postgres";

export const dynamic = "force-dynamic";

interface ContactInput {
  id: string;
  phone_number?: string;
  email?: string;
}

interface EnrichedLeadRow {
  lead_id: string;
  phone: string | null;
  email: string | null;
  profile_id: string | null;
  preferred_language: string | null;
  current_state: string | null;
  lead_kind: string | null;
  hubspot_contact_id: string | null;
  source_channel: string | null;
  current_owner_type: string | null;
  current_owner_id: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  operation_type: string | null;
  client_type: string | null;
  readiness_score: string | null;
  completeness_pct: string | null;
}

function normalizePhone(value: string | undefined) {
  return (value || "").replace(/\D/g, "");
}

function normalizeEmail(value: string | undefined) {
  return (value || "").trim().toLowerCase();
}

function serializeDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contacts = Array.isArray(body?.contacts) ? (body.contacts as ContactInput[]) : [];

    if (contacts.length === 0) {
      return NextResponse.json({ success: true, matches: {} });
    }

    const normalizedPhones = Array.from(
      new Set(contacts.map((contact) => normalizePhone(contact.phone_number)).filter(Boolean))
    );
    const normalizedEmails = Array.from(
      new Set(contacts.map((contact) => normalizeEmail(contact.email)).filter(Boolean))
    );

    if (normalizedPhones.length === 0 && normalizedEmails.length === 0) {
      return NextResponse.json({ success: true, matches: {} });
    }

    const pool = getPostgresPool();
    const { rows } = await pool.query<EnrichedLeadRow>(
      `
      SELECT
        l.id AS lead_id,
        l.phone,
        l.email,
        lp.id AS profile_id,
        l.preferred_language,
        l.current_state::text AS current_state,
        l.lead_kind::text AS lead_kind,
        l.hubspot_contact_id,
        l.source_channel::text AS source_channel,
        l.current_owner_type::text AS current_owner_type,
        l.current_owner_id,
        l.first_seen_at::text AS first_seen_at,
        l.last_seen_at::text AS last_seen_at,
        l.last_inbound_at::text AS last_inbound_at,
        l.last_outbound_at::text AS last_outbound_at,
        lp.operation_type::text AS operation_type,
        lp.client_type,
        lp.readiness_score::text AS readiness_score,
        lp.completeness_pct::text AS completeness_pct
      FROM leads l
      LEFT JOIN LATERAL (
        SELECT
          p.id,
          p.operation_type,
          p.client_type,
          p.readiness_score,
          p.completeness_pct
        FROM lead_profiles p
        WHERE p.lead_id = l.id
        ORDER BY p.updated_at DESC, p.created_at DESC
        LIMIT 1
      ) lp
        ON TRUE
      WHERE
        (cardinality($1::text[]) > 0 AND regexp_replace(COALESCE(l.phone, ''), '\\D', '', 'g') = ANY($1::text[]))
        OR
        (cardinality($2::text[]) > 0 AND lower(COALESCE(l.email, '')) = ANY($2::text[]))
    `,
      [normalizedPhones, normalizedEmails]
    );

    const matchesByPhone = new Map<string, EnrichedLeadRow>();
    const matchesByEmail = new Map<string, EnrichedLeadRow>();

    rows.forEach((row) => {
      const phoneKey = normalizePhone(row.phone || "");
      const emailKey = normalizeEmail(row.email || "");

      if (phoneKey && !matchesByPhone.has(phoneKey)) {
        matchesByPhone.set(phoneKey, row);
      }

      if (emailKey && !matchesByEmail.has(emailKey)) {
        matchesByEmail.set(emailKey, row);
      }
    });

    const matches = contacts.reduce<Record<string, Omit<EnrichedLeadRow, "phone" | "email"> & { phone: string | null; email: string | null }>>((acc, contact) => {
      const match =
        matchesByPhone.get(normalizePhone(contact.phone_number)) ||
        matchesByEmail.get(normalizeEmail(contact.email));

      if (!match) {
        return acc;
      }

      acc[contact.id] = {
        ...match,
        first_seen_at: serializeDate(match.first_seen_at),
        last_seen_at: serializeDate(match.last_seen_at),
        last_inbound_at: serializeDate(match.last_inbound_at),
        last_outbound_at: serializeDate(match.last_outbound_at),
      };

      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error) {
    console.error("Error al enriquecer contactos:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron enriquecer los contactos" },
      { status: 500 }
    );
  }
}
