"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

interface HumanHandoff {
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

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("es-ES") : "-";
}

function truncate(value: string | null, max = 180) {
  if (!value) return "-";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export default function HumanHandoffsPage() {
  const [handoffs, setHandoffs] = useState<HumanHandoff[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHandoffs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/human-handoffs", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "No se pudieron cargar los human handoffs");
        }

        setHandoffs(data.handoffs || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudieron cargar los human handoffs";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadHandoffs();
  }, []);

  const filteredHandoffs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return handoffs;
    }

    return handoffs.filter((handoff) =>
      [
        handoff.handoff_id,
        handoff.client_id,
        handoff.profile_id || "",
        handoff.full_name || "",
        handoff.phone || "",
        handoff.email || "",
        handoff.reason,
        handoff.priority,
        handoff.status,
        handoff.assigned_to || "",
        handoff.summary_type || "",
        handoff.summary_text || "",
        handoff.current_state || "",
        handoff.lead_kind || "",
        handoff.source_channel || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [handoffs, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border bg-card/80 backdrop-blur-md flex justify-between items-center z-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Human Handoffs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Derivaciones a humano con summary y datos relevantes del lead
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
            placeholder="Buscar por lead, razon, estado o asignado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 shadow-inner"
          />
        </div>

        <div className="bg-card rounded-xl border border-border shadow-xl overflow-hidden">
          {loading ? (
            <div className="px-6 py-8 text-center text-muted-foreground">Cargando human handoffs...</div>
          ) : error ? (
            <div className="px-6 py-8 text-center text-primary">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground min-w-[2300px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-foreground">Handoff ID</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Lead</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Lead Info</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Razon</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Estado / Prioridad</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Asignacion</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Summary</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Scores</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Fechas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHandoffs.map((handoff) => (
                    <tr key={handoff.handoff_id} className="border-b border-border hover:bg-muted/50 transition-colors align-top">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        <div>{handoff.handoff_id}</div>
                        <div className="mt-2 text-[11px]">Conv: {handoff.conversation_id || "-"}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        <div>{handoff.client_id}</div>
                        <div className="mt-2">Profile: {handoff.profile_id || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{handoff.full_name || "-"}</div>
                        <div>{handoff.phone || "-"}</div>
                        <div className="text-muted-foreground">{handoff.email || "-"}</div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Estado: {handoff.current_state || "-"} | Tipo: {handoff.lead_kind || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Canal: {handoff.source_channel || "-"} | Owner: {handoff.current_owner_type || "-"} / {handoff.current_owner_id || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-md">{truncate(handoff.reason, 260)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>Status: {handoff.status}</div>
                        <div>Priority: {handoff.priority}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>Asignado a: {handoff.assigned_to || "-"}</div>
                        <div>Assigned: {formatDate(handoff.assigned_at)}</div>
                        <div>Resolved: {formatDate(handoff.resolved_at)}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xl">
                        <div className="font-medium">ID: {handoff.summary_id || "-"}</div>
                        <div>Tipo: {handoff.summary_type || "-"}</div>
                        <div>Version: {handoff.summary_version ?? "-"}</div>
                        <div>Generado por: {handoff.generated_by || "-"}</div>
                        <div className="mt-2">{truncate(handoff.summary_text, 320)}</div>
                        <div className="mt-2 text-xs text-muted-foreground break-all">
                          JSON: {truncate(handoff.summary_json, 240)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>Readiness: {handoff.readiness_score || "-"}</div>
                        <div>Complete: {handoff.completeness_pct || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>Handoff: {formatDate(handoff.created_at)}</div>
                        <div>Summary: {formatDate(handoff.summary_created_at)}</div>
                      </td>
                    </tr>
                  ))}
                  {filteredHandoffs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                        No se encontraron human handoffs.
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
