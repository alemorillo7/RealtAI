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
      <div className="flex h-screen bg-bg-dark overflow-hidden">
        {/* Main Side Nav */}
        <div className="w-20 lg:w-64 bg-bg-soft border-r border-gray-medium/20 flex flex-col justify-between hidden md:flex">
          <div className="p-4">
            <div className="flex items-center gap-3 px-2 mb-8 mt-2">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-white font-bold text-lg hidden lg:block">
                CRM
              </h2>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-medium hover:bg-gray-medium/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium hidden lg:block">
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
