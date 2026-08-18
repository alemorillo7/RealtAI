"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

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

function badgeClass(value: string | null) {
  const normalized = (value || "").toLowerCase();

  if (normalized.includes("resolved")) {
    return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
  }

  if (normalized.includes("pending") || normalized.includes("review")) {
    return "bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/20";
  }

  if (normalized.includes("urgent") || normalized.includes("high") || normalized.includes("escalated")) {
    return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
  }

  return "bg-muted text-muted-foreground border-border";
}

export default function HumanHandoffsPage() {
  const [handoffs, setHandoffs] = useState<HumanHandoff[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
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

  const toggleRow = (handoffId: string) => {
    setExpandedRows((current) => ({
      ...current,
      [handoffId]: !current[handoffId],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border bg-card flex justify-between items-center z-10">
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
              <table className="w-full text-left text-sm text-foreground min-w-[1450px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-foreground">Detalle</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Lead</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Lead Info</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Estado / Prioridad</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Asignacion</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Resumen</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Scores</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Fechas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHandoffs.map((handoff) => {
                    const isExpanded = Boolean(expandedRows[handoff.handoff_id]);

                    return (
                      <>
                        <tr key={handoff.handoff_id} className="border-b border-border hover:bg-muted/30 transition-colors align-top">
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => toggleRow(handoff.handoff_id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {isExpanded ? "Ocultar" : "Ver"}
                            </button>
                            <div className="mt-3 font-mono text-[11px] text-muted-foreground break-all">
                              {truncate(handoff.handoff_id, 32)}
                            </div>
                            <div className="mt-2 text-[11px] text-muted-foreground">
                              Conv: {handoff.conversation_id || "-"}
                            </div>
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
                              Tipo: {handoff.lead_kind || "-"} | Canal: {handoff.source_channel || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-2">
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(handoff.status)}`}>
                                {handoff.status || "-"}
                              </span>
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(handoff.priority)}`}>
                                {handoff.priority || "-"}
                              </span>
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground">
                              Estado lead: {handoff.current_state || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>Asignado a: {handoff.assigned_to || "-"}</div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Owner: {handoff.current_owner_type || "-"} / {handoff.current_owner_id || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-sm">
                            <div className="font-medium">Tipo: {handoff.summary_type || "-"}</div>
                            <div className="text-xs text-muted-foreground">
                              Summary ID: {handoff.summary_id || "-"}
                            </div>
                            <div className="mt-2">{truncate(handoff.summary_text, 140)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>Readiness: {handoff.readiness_score || "-"}</div>
                            <div>Complete: {handoff.completeness_pct || "-"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>Handoff: {formatDate(handoff.created_at)}</div>
                            <div>Assigned: {formatDate(handoff.assigned_at)}</div>
                            <div>Resolved: {formatDate(handoff.resolved_at)}</div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${handoff.handoff_id}-details`} className="border-b border-border bg-muted/20">
                            <td colSpan={8} className="px-6 py-5">
                              <div className="grid gap-4 lg:grid-cols-3">
                                <div className="rounded-xl border border-border bg-card p-4">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Razon</div>
                                  <div className="mt-2 text-sm leading-6 text-foreground whitespace-pre-wrap break-words">
                                    {handoff.reason || "-"}
                                  </div>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-4">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</div>
                                  <div className="mt-2 space-y-2 text-sm text-foreground">
                                    <div>Version: {handoff.summary_version ?? "-"}</div>
                                    <div>Generado por: {handoff.generated_by || "-"}</div>
                                    <div>Fecha summary: {formatDate(handoff.summary_created_at)}</div>
                                    <div className="pt-2 whitespace-pre-wrap break-words leading-6">
                                      {handoff.summary_text || "-"}
                                    </div>
                                  </div>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-4">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detalle tecnico</div>
                                  <div className="mt-2 space-y-2 text-sm text-foreground">
                                    <div>Lead ID: {handoff.client_id}</div>
                                    <div>Profile ID: {handoff.profile_id || "-"}</div>
                                    <div>Conversation ID: {handoff.conversation_id || "-"}</div>
                                    <div className="pt-2 text-xs text-muted-foreground break-all whitespace-pre-wrap leading-5">
                                      JSON: {handoff.summary_json || "-"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                  {filteredHandoffs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
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
