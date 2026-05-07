"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Trash2, 
  X,
  MoreVertical
} from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO,
  isToday
} from "date-fns";
import { formatInMadrid, getTodayInMadrid } from "@/lib/dateUtils";
import { es } from "date-fns/locale";
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Modal from "@/components/ui/Modal";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  color?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: getTodayInMadrid(),
    time: "12:00",
    location: "",
    description: "",
    color: "bg-primary"
  });
  const [loading, setLoading] = useState(true);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [businessHours, setBusinessHours] = useState({ start: "09:00", end: "18:00" });

  // Fetch Events and Config
  useEffect(() => {
    const q = query(collection(db, "events"));
    const unsubEvents = onSnapshot(q, (snapshot) => {
      const data: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as CalendarEvent);
      });
      setEvents(data);
      setLoading(false);
    });

    const unsubConfig = onSnapshot(doc(db, "calendar_configs", "settings"), (doc) => {
      if (doc.exists()) {
        setBusinessHours(doc.data().businessHours);
      }
    });

    return () => {
      unsubEvents();
      unsubConfig();
    };
  }, []);

  const handleSaveConfig = async () => {
    try {
      await updateDoc(doc(db, "calendar_configs", "settings"), {
        businessHours,
        timezone: "Europe/Madrid"
      });
      setIsConfigModalOpen(false);
    } catch (error) {
      // If doc doesn't exist, create it
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "calendar_configs", "settings"), {
        businessHours,
        timezone: "Europe/Madrid"
      });
      setIsConfigModalOpen(false);
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    setSelectedEvent(null);
    setNewEvent({
      ...newEvent,
      date: formatInMadrid(day, "yyyy-MM-dd")
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setNewEvent({
      title: event.title,
      date: event.date,
      time: event.time || "",
      location: event.location || "",
      description: event.description || "",
      color: event.color || "bg-primary"
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedEvent) {
        await updateDoc(doc(db, "events", selectedEvent.id), {
          ...newEvent,
          updated_at: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "events"), {
          ...newEvent,
          created_at: serverTimestamp()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleDelete = async () => {
    if (selectedEvent && confirm("¿Estás seguro de que deseas eliminar este evento?")) {
      try {
        await deleteDoc(doc(db, "events", selectedEvent.id));
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  const colors = [
    { id: "bg-primary", label: "Dorado" },
    { id: "bg-blue-500", label: "Azul" },
    { id: "bg-green-500", label: "Verde" },
    { id: "bg-purple-500", label: "Púrpura" },
    { id: "bg-red-500", label: "Rojo" },
    { id: "bg-slate-500", label: "Gris" },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-2xl font-bold tracking-tight capitalize">
              {formatInMadrid(currentDate, "MMMM yyyy")}
            </h1>
          </div>
          <div className="flex items-center bg-muted/30 rounded-xl p-1 border border-border/50">
            <button onClick={prevMonth} className="p-1.5 hover:bg-muted rounded-lg transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold hover:bg-muted rounded-lg transition-all uppercase tracking-wider">
              Hoy
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-muted rounded-lg transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setIsConfigModalOpen(true)}
            className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-primary border border-border/50"
            title="Configurar horarios"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-primary/5 border border-primary/20 px-4 py-2 rounded-xl">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Horario: {businessHours.start} - {businessHours.end} (Madrid)
            </span>
          </div>
          <button 
            onClick={() => {
              setSelectedEvent(null);
              setNewEvent({ ...newEvent, date: getTodayInMadrid() });
              setIsModalOpen(true);
            }}
            className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/10">
          {/* Weekdays */}
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div key={day} className="bg-card/80 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
              {day}
            </div>
          ))}

          {/* Days */}
          {calendarDays.map((day, i) => {
            const dayEvents = events.filter((e) => isSameDay(parseISO(e.date), day));
            const isSelectedMonth = isSameMonth(day, monthStart);
            const isTodayDay = isToday(day);

            return (
              <div 
                key={i} 
                onClick={() => handleDayClick(day)}
                className={`min-h-[120px] bg-card p-2 transition-all hover:bg-muted/30 cursor-pointer relative group ${
                  !isSelectedMonth ? "opacity-30 bg-muted/10" : ""
                }`}
              >
                <div className={`text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  isTodayDay ? "bg-primary text-primary-foreground font-bold" : "text-foreground/70"
                }`}>
                  {format(day, "d")}
                </div>

                <div className="space-y-1.5 overflow-y-auto max-h-[85px] custom-scrollbar pr-1">
                  {dayEvents.map((event) => (
                    <div 
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className={`text-[11px] p-1.5 px-2 rounded-lg border border-white/10 truncate transition-all hover:brightness-110 hover:translate-x-0.5 active:scale-95 shadow-lg shadow-black/10 text-white font-semibold backdrop-blur-md bg-opacity-80 ${event.color || 'bg-primary'}`}
                    >
                      {event.time && <span className="opacity-80 mr-1.5 font-bold tabular-nums">{event.time}</span>}
                      <span className="tracking-tight">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedEvent ? "Editar Cita" : "Nueva Cita"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Título de la cita</label>
            <input 
              autoFocus
              type="text" 
              required
              value={newEvent.title}
              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
              placeholder="Ej: Reunión con Inversor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Fecha</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="date" 
                  required
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Hora</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="time" 
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
                placeholder="Ej: Zoom, Oficina, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Color de etiqueta</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNewEvent({...newEvent, color: c.id})}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${c.id} ${
                    newEvent.color === c.id ? "border-foreground scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Notas / Descripción</label>
            <textarea 
              value={newEvent.description}
              onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground min-h-[100px] resize-none"
              placeholder="Detalles adicionales..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            {selectedEvent && (
              <button 
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                <span>Eliminar</span>
              </button>
            )}
            <button 
              type="submit"
              className="flex-[2] bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
            >
              {selectedEvent ? "Guardar Cambios" : "Crear Cita"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Config Modal */}
      <Modal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        title="Configuración de Visitas"
      >
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Define el rango de horario disponible para las visitas en Madrid.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Hora de Apertura</label>
              <input 
                type="time" 
                value={businessHours.start}
                onChange={(e) => setBusinessHours({...businessHours, start: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Hora de Cierre</label>
              <input 
                type="time" 
                value={businessHours.end}
                onChange={(e) => setBusinessHours({...businessHours, end: e.target.value})}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
              />
            </div>
          </div>

          <button 
            onClick={handleSaveConfig}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            Guardar Configuración
          </button>
        </div>
      </Modal>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
