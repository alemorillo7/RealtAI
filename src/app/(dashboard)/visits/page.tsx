"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

interface Visit {
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

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("es-ES") : "-";
}

function truncate(value: string | null, max = 180) {
  if (!value) return "-";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadVisits = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/visits", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "No se pudieron cargar las visitas");
        }

        setVisits(data.visits || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudieron cargar las visitas";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadVisits();
  }, []);

  const filteredVisits = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return visits;
    }

    return visits.filter((visit) =>
      [
        visit.id,
        visit.lead_id,
        visit.property_id,
        visit.status,
        visit.lead_name || "",
        visit.lead_phone || "",
        visit.lead_email || "",
        visit.lead_state || "",
        visit.property_title || "",
        visit.property_operation_type || "",
        visit.property_type || "",
        visit.property_zone || "",
        visit.property_address_text || "",
        visit.calendar_provider || "",
        visit.calendar_event_id || "",
        visit.cancelled_reason || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [visits, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border bg-card/80 backdrop-blur-md flex justify-between items-center z-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Visitas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visitas realizadas y pendientes con detalle de lead y propiedad
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
            placeholder="Buscar por lead, propiedad, estado o zona..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 shadow-inner"
          />
        </div>

        <div className="bg-card rounded-xl border border-border shadow-xl overflow-hidden">
          {loading ? (
            <div className="px-6 py-8 text-center text-muted-foreground">Cargando visitas...</div>
          ) : error ? (
            <div className="px-6 py-8 text-center text-primary">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground min-w-[2500px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-foreground">Visit ID</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Lead</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Propiedad</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Estado</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Horario</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Calendario</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Cancelacion / Reagenda</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Recordatorios</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((visit) => (
                    <tr key={visit.id} className="border-b border-border hover:bg-muted/50 transition-colors align-top">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        <div>{visit.id}</div>
                        <div className="mt-2">Agency: {visit.agency_id}</div>
                        <div>Lead: {visit.lead_id}</div>
                        <div>Property: {visit.property_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{visit.lead_name || "-"}</div>
                        <div>{visit.lead_phone || "-"}</div>
                        <div className="text-muted-foreground">{visit.lead_email || "-"}</div>
                        <div className="mt-2 text-xs text-muted-foreground">Estado lead: {visit.lead_state || "-"}</div>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="font-medium">{visit.property_title || "-"}</div>
                        <div>{visit.property_type || "-"} | {visit.property_operation_type || "-"}</div>
                        <div>Zona: {visit.property_zone || "-"}</div>
                        <div className="text-muted-foreground">{truncate(visit.property_address_text, 120)}</div>
                        <div className="mt-2 whitespace-nowrap">
                          {visit.property_price || "-"} {visit.property_currency || ""}
                        </div>
                        <div className="text-xs text-muted-foreground">Estado property: {visit.property_status || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>Status: {visit.status}</div>
                        <div>Created by: {visit.created_by || "-"}</div>
                        <div>Timezone: {visit.timezone || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>Inicio: {formatDate(visit.selected_slot_start)}</div>
                        <div>Fin: {formatDate(visit.selected_slot_end)}</div>
                        <div>Confirmada: {formatDate(visit.confirmed_at)}</div>
                        <div className="mt-2 text-xs text-muted-foreground break-all">
                          Proposed: {truncate(visit.proposed_slots, 180)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>Provider: {visit.calendar_provider || "-"}</div>
                        <div className="text-xs break-all">Event ID: {visit.calendar_event_id || "-"}</div>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div>Cancelada: {formatDate(visit.cancelled_at)}</div>
                        <div className="mt-2">Motivo: {truncate(visit.cancelled_reason, 180)}</div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Reagendada desde: {visit.rescheduled_from_visit_id || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>24h: {formatDate(visit.reminder_24h_sent_at)}</div>
                        <div>2h: {formatDate(visit.reminder_2h_sent_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>Created: {formatDate(visit.created_at)}</div>
                        <div>Updated: {formatDate(visit.updated_at)}</div>
                      </td>
                    </tr>
                  ))}
                  {filteredVisits.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                        No se encontraron visitas.
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
