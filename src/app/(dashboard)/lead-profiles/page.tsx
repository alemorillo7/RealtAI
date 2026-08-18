"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

interface LeadProfile {
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

function formatList(values: string[] | null) {
  if (!values || values.length === 0) return "-";
  return values.join(", ");
}

function formatBool(value: boolean | null) {
  if (value === null) return "-";
  return value ? "Si" : "No";
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("es-ES") : "-";
}

export default function LeadProfilesPage() {
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<LeadProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState(() => {
    const profileId = searchParams.get("profileId") || "";
    const leadId = searchParams.get("leadId") || "";
    return [profileId, leadId].filter(Boolean).join(" ").trim();
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/lead-profiles", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "No se pudieron cargar los lead profiles");
        }

        setProfiles(data.profiles || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudieron cargar los lead profiles";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return profiles;
    }

    return profiles.filter((profile) =>
      [
        profile.id,
        profile.lead_id,
        profile.operation_type || "",
        profile.client_type || "",
        profile.currency || "",
        profile.orientation || "",
        profile.timeline || "",
        profile.financing_status || "",
        profile.purpose || "",
        profile.investment_profile || "",
        formatList(profile.target_zones),
        formatList(profile.property_types),
        formatList(profile.preferred_areas),
        formatList(profile.must_have_features),
        formatList(profile.nice_to_have_features),
        formatList(profile.exclusions),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [profiles, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border bg-card flex justify-between items-center z-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Lead Profiles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vista completa de perfiles comerciales y de busqueda
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="relative mb-6 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Buscar por lead, profile ID, operacion o zonas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 shadow-inner"
          />
        </div>

        <div className="bg-card rounded-xl border border-border shadow-xl overflow-hidden">
          {loading ? (
            <div className="px-6 py-8 text-center text-muted-foreground">Cargando lead profiles...</div>
          ) : error ? (
            <div className="px-6 py-8 text-center text-primary">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground min-w-[2200px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-foreground">ID</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Lead ID</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Client Type</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Operation</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Target Zones</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Budget</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Property Types</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Dorm / Banos / Area</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Financiacion</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Condiciones</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Purpose</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Investment Profile</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Areas / Features</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Scores</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Fechas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-border hover:bg-muted/50 transition-colors align-top">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{profile.id}</td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{profile.lead_id}</td>
                      <td className="px-6 py-4">{profile.client_type || "-"}</td>
                      <td className="px-6 py-4">
                        <div>{profile.operation_type || "-"}</div>
                        <div className="text-xs text-muted-foreground">{profile.timeline || "-"}</div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">{formatList(profile.target_zones)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {profile.budget_min || "-"} / {profile.budget_max || "-"} {profile.currency || ""}
                      </td>
                      <td className="px-6 py-4 max-w-sm">{formatList(profile.property_types)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {profile.bedrooms_min ?? "-"} / {profile.bathrooms_min ?? "-"} / {profile.area_min ?? "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div>Necesita: {formatBool(profile.financing_needed)}</div>
                        <div className="text-xs text-muted-foreground">{profile.financing_status || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>Vender antes: {formatBool(profile.must_sell_first)}</div>
                        <div>Amueblado: {formatBool(profile.furnished_required)}</div>
                        <div>Mascotas: {formatBool(profile.pets)}</div>
                        <div>Orientacion: {profile.orientation || "-"}</div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">{profile.purpose || "-"}</td>
                      <td className="px-6 py-4 max-w-sm">{profile.investment_profile || "-"}</td>
                      <td className="px-6 py-4 max-w-md">
                        <div><span className="font-medium">Preferred:</span> {formatList(profile.preferred_areas)}</div>
                        <div><span className="font-medium">Must:</span> {formatList(profile.must_have_features)}</div>
                        <div><span className="font-medium">Nice:</span> {formatList(profile.nice_to_have_features)}</div>
                        <div><span className="font-medium">Exclusions:</span> {formatList(profile.exclusions)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>Readiness: {profile.readiness_score || "-"}</div>
                        <div>Complete: {profile.completeness_pct || "-"}</div>
                        <div>Version: {profile.profile_version ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>Qualified: {formatDate(profile.last_qualified_at)}</div>
                        <div>Created: {formatDate(profile.created_at)}</div>
                        <div>Updated: {formatDate(profile.updated_at)}</div>
                      </td>
                    </tr>
                  ))}
                  {filteredProfiles.length === 0 && (
                    <tr>
                      <td colSpan={15} className="px-6 py-8 text-center text-muted-foreground">
                        No se encontraron lead profiles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
