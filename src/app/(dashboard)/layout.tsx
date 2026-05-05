"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { MessageSquare, Users, Tags, LogOut, Bot, Kanban, Menu, X } from "lucide-react";
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
    { icon: Users, label: "Contactos", href: "/contacts" },
    { icon: Tags, label: "Etiquetas", href: "/tags" },
  ];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
        
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-border shadow-sm">
              <img 
                src="/realtai-logo.jpeg" 
                alt="RealtAI Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-foreground font-display font-bold text-base tracking-tight">
              RealtAI <span className="text-primary">CRM</span>
            </h2>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-[50] animate-in fade-in duration-300"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div 
              className="absolute right-0 top-0 bottom-0 w-64 bg-card border-l border-border flex flex-col p-4 animate-in slide-in-from-right duration-300"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md overflow-hidden">
                    <img src="/realtai-logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-foreground font-bold">Menú</h2>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-muted-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <nav className="space-y-1.5 flex-1">
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                          ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-border space-y-2">
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Side Nav */}
        <div className="w-20 lg:w-64 bg-card/50 backdrop-blur-md border-r border-border flex flex-col justify-between hidden md:flex z-20">
          <div className="p-4">
            <div className="flex items-center gap-3 px-2 mb-8 mt-2 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-black/10 group-hover:shadow-primary/20 transition-all duration-300 group-hover:scale-105 border border-border bg-white">
                <img 
                  src="/realtai-logo.jpeg" 
                  alt="RealtAI Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-foreground font-display font-bold text-lg hidden lg:block tracking-tight">
                RealtAI <span className="text-primary font-medium">CRM</span>
              </h2>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-sm border border-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                      }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                    <span className="hidden lg:block">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 space-y-2">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium hidden lg:block">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-hidden bg-background relative pt-16 md:pt-0">
          <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-[0.03] dark:opacity-[0.02]" />
          <div className="relative h-full">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
