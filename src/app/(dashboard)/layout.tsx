"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { MessageSquare, Users, Tags, LogOut, Bot, Kanban, Menu, X, Calendar, FileText } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navItems = [
    { icon: Bot, label: "Agentes", href: "/agents" },
    { icon: Kanban, label: "Pipeline", href: "/pipeline" },
    { icon: Calendar, label: "Calendario", href: "/calendar" },
    { icon: Calendar, label: "Visitas", href: "/visits" },
    { icon: Users, label: "Contactos", href: "/contacts" },
    { icon: FileText, label: "Lead Profiles", href: "/lead-profiles" },
    { icon: MessageSquare, label: "Human Handoffs", href: "/human-handoffs" },
    { icon: Tags, label: "Etiquetas", href: "/tags" },
  ];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
        
        {/* Mobile Header (Sleek Dark) */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#090B0E] text-white border-b border-[#181C24] flex items-center justify-between px-4 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 shadow-sm bg-white p-0.5">
              <img 
                src="/realtai-logo.jpeg" 
                alt="RealtAI Logo" 
                className="w-full h-full object-cover rounded-[6px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-display font-semibold text-sm tracking-tight">
                RealtAI
              </h2>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/90 border border-white/15">
                OS
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] animate-in fade-in duration-200"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div 
              className="absolute right-0 top-0 bottom-0 w-72 bg-[#090B0E] text-white border-l border-[#181C24] flex flex-col p-5 animate-in slide-in-from-right duration-200 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#181C24]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-white/20 p-0.5">
                    <img src="/realtai-logo.jpeg" alt="Logo" className="w-full h-full object-cover rounded-[6px]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-white font-display font-semibold text-sm tracking-tight">RealtAI</h2>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15">OS</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-white text-[#090B0E] font-semibold shadow-sm"
                          : "text-[#9AA2B1] hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-[#090B0E]" : "text-[#9AA2B1]"}`} />
                      <span className="tracking-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-[#181C24] space-y-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs text-[#9AA2B1] font-medium">Modo visual</span>
                  <ThemeToggle />
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-[#9AA2B1] hover:text-rose-400 hover:bg-rose-500/10 transition-all text-sm font-medium"
                >
                  <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Side Nav (Premium Obsidian Black Enterprise Sidebar) */}
        <aside className="w-20 lg:w-64 bg-[#090B0E] text-white border-r border-[#181C24] flex flex-col justify-between hidden md:flex z-20 select-none flex-shrink-0">
          <div className="p-4">
            {/* Header Brand */}
            <div className="flex items-center gap-3 px-2 mb-7 mt-1.5 group cursor-pointer">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-black/40 border border-white/20 bg-white p-0.5 group-hover:scale-105 transition-all duration-300 flex-shrink-0">
                <img 
                  src="/realtai-logo.jpeg" 
                  alt="RealtAI Logo" 
                  className="w-full h-full object-cover rounded-[8px]"
                />
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <h2 className="text-white font-display font-bold text-[16px] tracking-tight">
                  RealtAI
                </h2>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/15 tracking-wider">
                  OS
                </span>
              </div>
            </div>

            {/* Navigation items */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-[13.5px] font-medium tracking-tight ${
                      isActive
                        ? "bg-white text-[#090B0E] font-semibold shadow-sm"
                        : "text-[#9AA2B1] hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-[#090B0E]" : "text-[#9AA2B1]"}`} />
                    <span className="hidden lg:block truncate">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom actions */}
          <div className="p-4 space-y-2 border-t border-[#181C24]">
            <div className="hidden lg:flex items-center justify-between px-2 py-1">
              <span className="text-xs text-[#9AA2B1] font-medium">Tema</span>
              <ThemeToggle />
            </div>
            <div className="flex lg:hidden justify-center py-1">
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[#9AA2B1] hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150 text-[13.5px] font-medium"
              title="Cerrar Sesión"
            >
              <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="hidden lg:block truncate">Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-hidden bg-background relative pt-16 md:pt-0">
          <div className="relative h-full">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
