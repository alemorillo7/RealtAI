"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  MoreHorizontal, 
  Phone, 
  MessageSquare, 
  User,
  Calendar,
  FileText,
  Search,
  Trash2,
  GripVertical
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Lead } from "@/types";

// Columns are now managed in Firestore (collection: pipeline_configs)

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [columns, setColumns] = useState<{id: string, label: string, color: string, fireId?: string, order?: number}[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState({ name: "", phone: "", email: "", status: "nuevo" as Lead['status'] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Columns and Leads
  useEffect(() => {
    // Fetch Columns (Stages)
    const qCols = query(collection(db, "pipeline_configs"), orderBy("order", "asc"));
    const unsubCols = onSnapshot(qCols, (snapshot) => {
      if (snapshot.empty) {
        // Initialize default columns if none exist
        const defaults = [
          { id: 'nuevo', label: 'Nuevo Lead', color: 'bg-blue-500', order: 0 },
          { id: 'interesado', label: 'Interesado', color: 'bg-yellow-500', order: 1 },
          { id: 'discovery', label: 'Discovery Agenda...', color: 'bg-purple-500', order: 2 },
          { id: 'preguntas', label: 'Doc preguntas', color: 'bg-slate-400', order: 3 },
          { id: 'propuesta', label: 'Call Propuesta', color: 'bg-red-500', order: 4 },
        ];
        defaults.forEach(async (col) => {
          await addDoc(collection(db, "pipeline_configs"), col);
        });
      } else {
        const data: any[] = [];
        snapshot.forEach((doc) => {
          data.push({ fireId: doc.id, ...doc.data() });
        });
        setColumns(data);
      }
    });

    // Fetch Leads
    const qLeads = query(collection(db, "leads"), orderBy("created_at", "desc"));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      const data: Lead[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Lead);
      });
      setLeads(data);
    });

    return () => {
      unsubCols();
      unsubLeads();
    };
  }, []);

  const moveLead = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const leadRef = doc(db, "leads", leadId);
      await updateDoc(leadRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating lead status:", error);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este lead?")) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "leads", leadId));
      } catch (error) {
        console.error("Error deleting lead:", error);
      }
    }
  };

  const openAddModal = (status?: Lead['status']) => {
    setEditingLead(null);
    setNewLead({ name: "", phone: "", email: "", status: status || 'nuevo' });
    setIsModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setNewLead({ name: lead.name, phone: lead.phone_number, email: lead.email || "", status: lead.status });
    setIsModalOpen(true);
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;

    try {
      setIsSubmitting(true);
      if (editingLead) {
        await updateDoc(doc(db, "leads", editingLead.id), {
          name: newLead.name,
          phone_number: newLead.phone,
          email: newLead.email,
          status: newLead.status,
        });
      } else {
        await addDoc(collection(db, "leads"), {
          name: newLead.name,
          phone_number: newLead.phone,
          email: newLead.email,
          status: newLead.status,
          created_at: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setNewLead({ name: "", phone: "", email: "", status: "nuevo" });
      setEditingLead(null);
    } catch (error) {
      console.error("Error saving lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateColumns = async (updatedColumns: any[]) => {
    try {
      setIsSubmitting(true);
      for (const col of updatedColumns) {
        if (col.fireId) {
          await updateDoc(doc(db, "pipeline_configs", col.fireId), {
            label: col.label,
            order: col.order
          });
        }
      }
      setIsConfigModalOpen(false);
    } catch (error) {
      console.error("Error updating columns:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStage = async () => {
    const newOrder = columns.length;
    const id = `stage_${Date.now()}`;
    try {
      await addDoc(collection(db, "pipeline_configs"), {
        id,
        label: "Nueva Etapa",
        color: "bg-slate-500",
        order: newOrder
      });
    } catch (error) {
      console.error("Error adding stage:", error);
    }
  };

  const deleteStage = async (fireId: string, colId: string) => {
    const leadsInStage = leads.filter(l => l.status === colId);
    if (leadsInStage.length > 0) {
      alert(`No puedes eliminar esta etapa porque tiene ${leadsInStage.length} leads. Muévelos a otra etapa primero.`);
      return;
    }

    if (confirm("¿Estás seguro de que quieres eliminar esta etapa?")) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "pipeline_configs", fireId));
      } catch (error) {
        console.error("Error deleting stage:", error);
      }
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    lead.phone_number.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border bg-card/40 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Pipeline</h1>
          </div>
          <p className="text-muted-foreground text-[11px] md:text-sm mt-1">Gestión de leads con tablero Kanban</p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all w-full md:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsConfigModalOpen(true)}
              className="p-2 hover:bg-white/5 rounded-xl transition-all text-muted-foreground hover:text-primary"
              title="Configurar etapas"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button 
              onClick={() => openAddModal()}
              className="bg-primary hover:opacity-90 text-primary-foreground px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium shadow-lg shadow-primary/20 text-sm"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Nuevo Lead</span>
              <span className="sm:hidden">Lead</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4 md:p-6 flex gap-4 md:gap-6 items-start custom-scrollbar select-none active:cursor-grabbing">
        {columns.map((col) => {
          const colLeads = filteredLeads.filter(l => l.status === col.id);
          return (
            <div key={col.id} className="flex-shrink-0 w-80 bg-card/50 rounded-2xl border border-border flex flex-col max-h-full shadow-sm">
              <div className="p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <h3 className="font-semibold text-sm uppercase tracking-wider opacity-80">{col.label}</h3>
                  <span className="bg-muted text-[10px] px-1.5 py-0.5 rounded-md ml-2">{colLeads.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => openAddModal(col.id as Lead['status'])}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4 opacity-50" />
                  </button>
                      <button 
                        onClick={() => {
                          if (confirm(`¿Eliminar todos los leads de ${col.label}?`)) {
                            colLeads.forEach(l => deleteLead(l.id));
                          }
                        }}
                        className="p-1 hover:bg-muted rounded-md transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 opacity-50" />
                      </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {colLeads.map((lead) => (
                  <div key={lead.id} className="bg-card border border-border p-4 rounded-xl hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing group shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {lead.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{lead.name}</h4>
                        <div className="flex flex-col gap-1 mt-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone_number}</span>
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-1.5 text-[10px] text-primary/70">
                              <MessageSquare className="w-3 h-3" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {lead.description && (
                      <div className="flex gap-2 mt-3 p-2 bg-muted/50 rounded-lg">
                        <FileText className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {lead.description}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <select 
                        value={lead.status}
                        onChange={(e) => moveLead(lead.id, e.target.value as Lead['status'])}
                        className="bg-transparent text-[10px] text-muted-foreground hover:text-primary outline-none cursor-pointer"
                      >
                        {columns.map(c => (
                          <option key={c.id} value={c.id} className="bg-card text-foreground">{c.label}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => openEditModal(lead)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        <MoreHorizontal className="w-3 h-3 opacity-30" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {colLeads.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-xs text-muted-foreground italic">
                    Sin leads
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingLead ? "Editar Lead" : "Añadir Nuevo Lead"}
      >
        <form onSubmit={handleAddLead} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Nombre completo</label>
            <input 
              autoFocus
              type="text" 
              required
              value={newLead.name}
              onChange={(e) => setNewLead({...newLead, name: e.target.value})}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Teléfono / WhatsApp</label>
            <input 
              type="text" 
              required
              value={newLead.phone}
              onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
              placeholder="+54..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Email (Opcional)</label>
            <input 
              type="email" 
              value={newLead.email}
              onChange={(e) => setNewLead({...newLead, email: e.target.value})}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Estado inicial</label>
            <select 
              value={newLead.status}
              onChange={(e) => setNewLead({...newLead, status: e.target.value as Lead['status']})}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
            >
              {columns.map(c => (
                <option key={c.id} value={c.id} className="bg-background">{c.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3 mt-6">
            {editingLead && (
              <button 
                type="button"
                onClick={() => {
                  deleteLead(editingLead.id);
                  setIsModalOpen(false);
                }}
                className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold py-3 rounded-xl transition-all"
              >
                Eliminar
              </button>
            )}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? "Guardando..." : editingLead ? "Guardar Cambios" : "Crear Lead"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Configuration Modal */}
      <Modal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        title="Configurar Pipeline"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Gestiona las etapas de tu embudo.</p>
            <button 
              onClick={addStage}
              className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir
            </button>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {columns.map((col, index) => (
              <div key={col.fireId || col.id} className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl border border-border group">
                <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab" />
                <div className="flex-1 space-y-1">
                  <input 
                    type="text" 
                    value={col.label}
                    onChange={(e) => {
                      const newCols = [...columns];
                      newCols[index].label = e.target.value;
                      setColumns(newCols);
                    }}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-foreground"
                    placeholder="Nombre de la etapa..."
                  />
                </div>
                <button 
                  onClick={() => deleteStage(col.fireId as string, col.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => handleUpdateColumns(columns)}
            disabled={isSubmitting}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </Modal>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
