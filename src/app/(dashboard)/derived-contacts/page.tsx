"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

interface DerivedContact {
  handoff_id: string;
  client_id: string;
  profile_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  reason: string;
  created_at: string;
}

export default function DerivedContactsPage() {
  const [contacts, setContacts] = useState<DerivedContact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/derived-contacts", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "No se pudieron cargar los derivados");
        }

        setContacts(data.contacts || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudieron cargar los derivados";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return contacts;
    }

    return contacts.filter((contact) =>
      [
        contact.client_id,
        contact.profile_id || "",
        contact.full_name || "",
        contact.phone || "",
        contact.email || "",
        contact.reason || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [contacts, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border bg-card/80 backdrop-blur-md flex justify-between items-center z-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Contactos Derivados</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registros derivados desde n8n/Firebase con motivo e ID del cliente
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
            placeholder="Buscar por ID cliente, profile ID, nombre o razón..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 shadow-inner"
          />
        </div>

        <div className="bg-card rounded-xl border border-border shadow-xl overflow-hidden">
          {loading ? (
            <div className="px-6 py-8 text-center text-muted-foreground">Cargando derivados...</div>
          ) : error ? (
            <div className="px-6 py-8 text-center text-primary">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-foreground">ID Cliente</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Profile ID</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Nombre</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Teléfono</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Email</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Razón</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.handoff_id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{contact.client_id}</td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{contact.profile_id || "-"}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{contact.full_name || "-"}</td>
                      <td className="px-6 py-4">{contact.phone || "-"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{contact.email || "-"}</td>
                      <td className="px-6 py-4 max-w-md min-w-80">{contact.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {contact.created_at ? new Date(contact.created_at).toLocaleString("es-ES") : "-"}
                      </td>
                    </tr>
                  ))}
                  {filteredContacts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                        No se encontraron contactos derivados en `derived_contacts`.
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
