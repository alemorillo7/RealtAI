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
  endTime?: string;
  duration?: number; // in minutes
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
    endTime: "13:00",
    duration: 60,
    location: "",
    description: "",
    color: "bg-primary"
  });
  const [loading, setLoading] = useState(true);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [calendarConfig, setCalendarConfig] = useState({ 
    working_days: [1, 2, 3, 4, 5],
    slot_duration: 60,
    time_ranges: [{ start: "09:00", end: "18:00" }]
  });

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

    const unsubConfig = onSnapshot(doc(db, "settings", "calendar"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCalendarConfig({
          working_days: data.working_days || [1, 2, 3, 4, 5],
          slot_duration: data.slot_duration || 60,
          time_ranges: data.time_ranges || [{ start: data.start_time || "09:00", end: data.end_time || "18:00" }]
        });
      }
    });

    return () => {
      unsubEvents();
      unsubConfig();
    };
  }, []);

  const handleSaveConfig = async () => {
    try {
      await updateDoc(doc(db, "settings", "calendar"), {
        working_days: calendarConfig.working_days,
        slot_duration: calendarConfig.slot_duration,
        time_ranges: calendarConfig.time_ranges,
        updated_at: serverTimestamp()
      });
      setIsConfigModalOpen(false);
    } catch (error) {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "settings", "calendar"), {
        working_days: calendarConfig.working_days,
        slot_duration: calendarConfig.slot_duration,
        time_ranges: calendarConfig.time_ranges,
        updated_at: serverTimestamp()
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
      time: event.time || "12:00",
      endTime: event.endTime || "13:00",
      duration: event.duration || 60,
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
      <div className="p-8 border-b border-border bg-card flex items-center justify-between shadow-sm relative z-20">
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
            className="p-2.5 hover:bg-primary/10 rounded-xl transition-all text-muted-foreground hover:text-primary border border-border/40 group"
            title="Configurar horarios"
          >
            <MoreVertical className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="flex gap-4">
          <div className="hidden lg:flex items-center gap-3 bg-primary/10 border border-primary/30 px-5 py-2.5 rounded-2xl shadow-inner">
            <Clock className="w-4 h-4 text-primary animate-pulse" />
            <div className="flex flex-col">
              {calendarConfig.time_ranges.map((range, idx) => (
                <span key={idx} className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">
                  {range.start} — {range.end}
                </span>
              ))}
            </div>
          </div>
          <button 
            onClick={() => {
              setSelectedEvent(null);
              setNewEvent({ ...newEvent, date: getTodayInMadrid() });
              setIsModalOpen(true);
            }}
            className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-7 bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          {/* Weekdays */}
          {["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"].map((day) => (
            <div key={day} className="bg-card py-4 text-center text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] border-b border-border">
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
                className={`min-h-[130px] bg-card p-3 transition-all hover:bg-primary/5 cursor-pointer relative group border-r border-b border-border last:border-r-0 ${
                  !isSelectedMonth ? "opacity-[0.15]" : ""
                }`}
              >
                <div className={`text-sm font-bold mb-3 w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-300 ${
                  isTodayDay 
                    ? "bg-primary text-primary-foreground shadow-sm scale-110" 
                    : "text-foreground/40 group-hover:text-foreground/80"
                }`}>
                  {format(day, "d")}
                </div>

                <div className="space-y-1.5 overflow-y-auto max-h-[85px] custom-scrollbar pr-1">
                  {dayEvents.map((event) => (
                    <div 
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className={`text-[11px] p-1.5 px-2 rounded-lg border border-black/10 dark:border-white/10 truncate transition-all hover:brightness-110 hover:translate-x-0.5 active:scale-95 shadow-sm font-semibold ${event.color === 'bg-primary' || !event.color ? 'bg-primary text-primary-foreground' : `${event.color} text-white`}`}
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
              <label className="text-sm font-medium text-muted-foreground">Hora Inicio</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="time" 
                  value={newEvent.time}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    const [h, m] = newTime.split(":").map(Number);
                    const end = new Date();
                    end.setHours(h, m + (newEvent.duration || 60));
                    const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
                    setNewEvent({...newEvent, time: newTime, endTime});
                  }}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Duración</label>
              <select 
                value={newEvent.duration}
                onChange={(e) => {
                  const dur = Number(e.target.value);
                  const [h, m] = newEvent.time.split(":").map(Number);
                  const end = new Date();
                  end.setHours(h, m + dur);
                  const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
                  setNewEvent({...newEvent, duration: dur, endTime});
                }}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hora</option>
                <option value={90}>1.5 horas</option>
                <option value={120}>2 horas</option>
              </select>
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
              className="flex-[2] bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-sm"
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
          <p className="text-sm text-muted-foreground">Define los días y horarios (puedes añadir varios turnos).</p>
          
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Días Laborales</label>
            <div className="flex flex-wrap gap-2">
              {[
                {id: 1, label: "Lun"}, {id: 2, label: "Mar"}, {id: 3, label: "Mie"},
                {id: 4, label: "Jue"}, {id: 5, label: "Vie"}, {id: 6, label: "Sab"}, {id: 0, label: "Dom"}
              ].map(day => (
                <button
                  key={day.id}
                  onClick={() => {
                    const days = calendarConfig.working_days.includes(day.id)
                      ? calendarConfig.working_days.filter(d => d !== day.id)
                      : [...calendarConfig.working_days, day.id];
                    setCalendarConfig({...calendarConfig, working_days: days});
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    calendarConfig.working_days.includes(day.id)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Rangos Horarios</label>
              <button 
                onClick={() => setCalendarConfig({
                  ...calendarConfig, 
                  time_ranges: [...calendarConfig.time_ranges, { start: "16:00", end: "20:00" }]
                })}
                className="text-primary hover:underline text-xs flex items-center gap-1 font-bold"
              >
                <Plus className="w-3 h-3" /> Añadir turno
              </button>
            </div>
            
            {calendarConfig.time_ranges.map((range, index) => (
              <div key={index} className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <input 
                    type="time" 
                    value={range.start}
                    onChange={(e) => {
                      const newRanges = [...calendarConfig.time_ranges];
                      newRanges[index].start = e.target.value;
                      setCalendarConfig({...calendarConfig, time_ranges: newRanges});
                    }}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 text-foreground"
                  />
                  <input 
                    type="time" 
                    value={range.end}
                    onChange={(e) => {
                      const newRanges = [...calendarConfig.time_ranges];
                      newRanges[index].end = e.target.value;
                      setCalendarConfig({...calendarConfig, time_ranges: newRanges});
                    }}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>
                {calendarConfig.time_ranges.length > 1 && (
                  <button 
                    onClick={() => {
                      const newRanges = calendarConfig.time_ranges.filter((_, i) => i !== index);
                      setCalendarConfig({...calendarConfig, time_ranges: newRanges});
                    }}
                    className="text-muted-foreground hover:text-red-500 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Duración de cada cita</label>
            <select
              value={calendarConfig.slot_duration}
              onChange={(e) => setCalendarConfig({...calendarConfig, slot_duration: Number(e.target.value)})}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all text-foreground"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1.5 horas</option>
              <option value={120}>2 horas</option>
            </select>
          </div>

          <button 
            onClick={handleSaveConfig}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-sm"
          >
            Guardar Configuración
          </button>
        </div>
      </Modal>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--muted-foreground);
          opacity: 0.3;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--foreground);
        }
      `}</style>
    </div>
  );
}
