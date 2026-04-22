"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { MessageSquare, Users, Tags, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navItems = [
    { icon: MessageSquare, label: "Mensajes", href: "/dashboard" },
    { icon: Users, label: "Contactos", href: "/contacts" },
    { icon: Tags, label: "Etiquetas", href: "/tags" },
  ];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-bg-dark overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-bg-soft/40 via-bg-dark to-bg-dark">
        {/* Main Side Nav */}
        <div className="w-20 lg:w-64 bg-bg-soft/50 backdrop-blur-md border-r border-white/5 flex flex-col justify-between hidden md:flex shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)] z-20">
          <div className="p-4">
            <div className="flex items-center gap-3 px-2 mb-8 mt-2 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-white font-bold text-lg hidden lg:block tracking-tight">
                Ramayo <span className="text-primary font-medium">CRM</span>
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
                        : "text-gray-medium hover:bg-white/5 hover:text-white border border-transparent"
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

          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-gray-medium hover:bg-gray-medium/10 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium hidden lg:block">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
