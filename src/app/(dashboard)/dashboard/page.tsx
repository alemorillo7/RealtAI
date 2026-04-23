"use client";

import { useState } from "react";
import SidebarChatList from "@/components/dashboard/SidebarChatList";
import ChatWindow from "@/components/dashboard/ChatWindow";

export default function DashboardPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  return (
    <div className="flex h-full w-full bg-background">
      <div className="w-full sm:w-80 md:w-96 border-r border-gray-medium/20 flex flex-col">
        <SidebarChatList
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
        />
      </div>
      <div className="flex-1 flex flex-col hidden sm:flex bg-card">
        {selectedChatId ? (
          <ChatWindow chatId={selectedChatId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Selecciona un chat para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}
