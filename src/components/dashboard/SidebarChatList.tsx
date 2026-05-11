"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Chat } from "@/types";
import { Search, UserCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
}

export default function SidebarChatList({ selectedChatId, onSelectChat }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("updated_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData: Chat[] = [];
      snapshot.forEach((doc) => {
        chatsData.push({ ...doc.data() } as Chat);
      });
      setChats(chatsData);
    });

    return () => unsubscribe();
  }, []);

  const filteredChats = chats.filter((chat) =>
    (chat.user_name || chat.phone_number)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card/90 backdrop-blur-xl border-r border-border z-10 relative shadow-xl">
      <div className="p-5 border-b border-border">
        <h2 className="text-xl font-bold text-foreground mb-4 tracking-tight">Conversaciones</h2>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 sm:text-sm transition-all duration-300 shadow-inner"
            placeholder="Buscar chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredChats.map((chat) => {
          const isSelected = chat.phone_number === selectedChatId;
          return (
            <button
              key={chat.phone_number}
              onClick={() => onSelectChat(chat.phone_number)}
              className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all duration-200 border ${
                isSelected
                  ? "bg-muted border-border shadow-lg shadow-black/5"
                  : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <UserCircle2 className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-foreground font-bold truncate">
                    {chat.real_name && chat.real_name !== "-" ? chat.real_name : (chat.user_name || chat.phone_number)}
                  </h3>
                  {chat.updated_at && (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2 opacity-70">
                      {formatDistanceToNow(chat.updated_at.toDate(), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-muted-foreground truncate pr-2">
                    {chat.phone_number}
                  </p>
                  <div
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap ${
                      (chat.agent_active === true || chat.bot_active === true)
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        (chat.agent_active === true || chat.bot_active === true) ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    {(chat.agent_active === true || chat.bot_active === true) ? "Bot ON" : "Bot OFF"}
                  </div>
                </div>
                {chat.tags && chat.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {chat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-muted border border-border text-foreground whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
