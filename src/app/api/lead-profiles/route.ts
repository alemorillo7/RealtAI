import { NextResponse } from "next/server";
import { getPostgresPool } from "../../../lib/postgres";

export const dynamic = "force-dynamic";

interface LeadProfileRow {
  id: string;
  lead_id: string;
  operation_type: string | null;
  client_type: string | null;
  target_zones: string[] | null;
  budget_min: string | null;
  budget_max: string | null;
  currency: string | null;
  property_types: string[] | null;
  bedrooms_min: number | null;
  bathrooms_min: number | null;
  area_min: number | null;
  orientation: string | null;
  timeline: string | null;
  financing_needed: boolean | null;
  financing_status: string | null;
  must_sell_first: boolean | null;
  furnished_required: boolean | null;
  pets: boolean | null;
  purpose: string | null;
  investment_profile: string | null;
  preferred_areas: string[] | null;
  must_have_features: string[] | null;
  nice_to_have_features: string[] | null;
  exclusions: string[] | null;
  readiness_score: string | null;
  completeness_pct: string | null;
  profile_version: number | null;
  last_qualified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function serializeDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

function serializeArray(value: unknown): string[] | null {
  if (!value) return null;
  return Array.isArray(value) ? value.map(String) : null;
}

export async function GET() {
  try {
    const pool = getPostgresPool();
    const { rows } = await pool.query<LeadProfileRow>(`
      SELECT
        id,
        lead_id,
        operation_type::text AS operation_type,
        client_type,
        target_zones,
        budget_min::text AS budget_min,
        budget_max::text AS budget_max,
        currency,
        property_types,
        bedrooms_min,
        bathrooms_min,
        area_min,
        orientation,
        timeline,
        financing_needed,
        financing_status,
        must_sell_first,
        furnished_required,
        pets,
        purpose,
        investment_profile,
        preferred_areas,
        must_have_features,
        nice_to_have_features,
        exclusions,
        readiness_score::text AS readiness_score,
        completeness_pct::text AS completeness_pct,
        profile_version,
        last_qualified_at::text AS last_qualified_at,
        created_at::text AS created_at,
        updated_at::text AS updated_at
      FROM lead_profiles
      ORDER BY updated_at DESC, created_at DESC
    `);

    const profiles = rows.map((row: LeadProfileRow) => ({
      ...row,
      target_zones: serializeArray(row.target_zones),
      property_types: serializeArray(row.property_types),
      preferred_areas: serializeArray(row.preferred_areas),
      must_have_features: serializeArray(row.must_have_features),
      nice_to_have_features: serializeArray(row.nice_to_have_features),
      exclusions: serializeArray(row.exclusions),
      last_qualified_at: serializeDate(row.last_qualified_at),
      created_at: serializeDate(row.created_at),
      updated_at: serializeDate(row.updated_at),
    }));

    return NextResponse.json({
      success: true,
      count: profiles.length,
      profiles,
    });
  } catch (error) {
    console.error("Error al obtener lead profiles:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los lead profiles" },
      { status: 500 }
    );
  }
}
