"use client";

import { 
  MessageSquare, 
  TrendingUp, 
  Info, 
  Search, 
  Plus, 
  Tag, 
  ChevronRight,
  Filter,
  Trash
} from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Agent } from "@/types";
import SidebarChatList from "@/components/dashboard/SidebarChatList";
import ChatWindow from "@/components/dashboard/ChatWindow";
import Modal from "@/components/ui/Modal";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState("agentes");
  const [activeSubTab, setActiveSubTab] = useState("chats");
  const [activeCategory, setActiveCategory] = useState("propiedades");
  const [filter, setFilter] = useState("todos");

  const categories = [
    { id: "propiedades", label: "Propiedades" },
    { id: "ventas", label: "Ventas" },
    { id: "soporte", label: "Soporte" },
  ];

  const mainTabs = [
    { id: "agentes", label: "Agentes", icon: MessageSquare },
  ];

  const subTabs = [
    { id: "chats", label: "Chats & Agentes" },
  ];

  const filterOptions = [
    { id: "todos", label: "TODOS" },
    { id: "feedback", label: "FEEDBACK CLIENTE" },
    { id: "plantillas", label: "PLANTILLAS" },
  ];

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", category: activeCategory as Agent['category'] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "agents"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Agent[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Agent);
      });
      setAgents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'online' ? 'offline' : 'online';
      await updateDoc(doc(db, "agents", agentId), { status: newStatus });
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.name) return;

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, "agents"), {
        name: newAgent.name,
        category: newAgent.category,
        status: 'offline',
        last_active: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewAgent({ name: "", category: activeCategory as Agent['category'] });
    } catch (error) {
      console.error("Error adding agent:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setNewAgent({ name: "", category: activeCategory as Agent['category'] });
    setIsModalOpen(true);
  };

  const deleteAgent = async (agentId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este agente?")) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "agents", agentId));
      } catch (error) {
        console.error("Error deleting agent:", error);
      }
    }
  };

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Header / Top Navigation */}
      <div className="px-6 pt-6 pb-2 border-b border-border bg-card/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-8 mb-6">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`flex items-center gap-2 pb-2 px-1 transition-all relative ${
                activeMainTab === tab.id 
                  ? "text-primary font-semibold border-b-2 border-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`text-sm pb-3 px-1 transition-all relative ${
                activeSubTab === tab.id 
                  ? "text-primary font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {activeSubTab === "chats" ? (
          <div className="flex h-full w-full bg-background overflow-hidden">
            {/* Inner Chat Sidebar */}
            <div className="w-full sm:w-80 md:w-96 border-r border-border flex flex-col">
              <SidebarChatList
                selectedChatId={selectedChatId}
                onSelectChat={setSelectedChatId}
              />
            </div>
            {/* Inner Chat Window */}
            <div className="flex-1 flex flex-col hidden sm:flex bg-card overflow-hidden">
              {selectedChatId ? (
                <ChatWindow chatId={selectedChatId} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="font-medium">Selecciona una conversación</p>
                    <p className="text-xs">Monitorea la actividad de tus agentes en tiempo real</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Categories Bar */}
            <div className="flex items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${
                    activeCategory === cat.id
                      ? "bg-primary/20 text-primary font-medium"
                      : "bg-card border border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              <button className="p-2 rounded-xl border border-border hover:bg-accent text-muted-foreground">
                <Plus className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl border border-border hover:bg-accent text-muted-foreground">
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Buscar agentes..."
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:border-primary/50 transition-all text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFilter(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filter === opt.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground border border-transparent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleAgentStatus(agent.id, agent.status)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          agent.status === 'online' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                        }`}
                      >
                        {agent.status}
                      </button>
                      <button 
                        onClick={() => deleteAgent(agent.id)}
                        className="p-1.5 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-lg">{agent.name}</h4>
                  <p className="text-sm text-muted-foreground capitalize mb-4">{agent.category}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">Activo</span>
                    </div>
                    <button className="text-primary hover:text-primary-dark text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Configurar <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Add New Card */}
              <button 
                onClick={openAddModal}
                className="bg-muted/30 border-2 border-dashed border-border rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all min-h-[180px]"
              >
                <Plus className="w-8 h-8" />
                <span className="font-medium">Nuevo Agente</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Agent Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Nuevo Agente AI"
      >
        <form onSubmit={handleAddAgent} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Nombre del Agente</label>
            <input 
              autoFocus
              type="text" 
              required
              value={newAgent.name}
              onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
              placeholder="Ej: Bot Inmobiliario"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Categoría</label>
            <select 
              value={newAgent.category}
              onChange={(e) => setNewAgent({...newAgent, category: e.target.value as Agent['category']})}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id} className="bg-background">{c.label}</option>
              ))}
            </select>
          </div>
          
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? "Creando..." : "Activar Agente"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

// Minimal icons
function Bot({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function Settings({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}
