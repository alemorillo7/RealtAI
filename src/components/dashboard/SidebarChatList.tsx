"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Chat } from "@/types";
import { Search, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
}

function toJsDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  const parsedDate = new Date(String(value));
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
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
    (chat.user_name || chat.phone_number || chat.real_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card border-r border-border z-10 relative">
      {/* Top Header & Search */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-display font-semibold text-foreground tracking-tight">
            Conversaciones
          </h2>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
            {chats.length}
          </span>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20 text-xs transition-all duration-150"
            placeholder="Buscar por nombre o número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredChats.map((chat) => {
          const isSelected = chat.phone_number === selectedChatId;
          const isBotActive = chat.agent_active === true || chat.bot_active === true;
          const displayName = chat.real_name && chat.real_name !== "-" ? chat.real_name : (chat.user_name || chat.phone_number);

          return (
            <button
              key={chat.phone_number}
              onClick={() => onSelectChat(chat.phone_number)}
              className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all duration-150 border text-xs ${
                isSelected
                  ? "bg-muted/80 border-border text-foreground font-medium shadow-xs"
                  : "bg-transparent border-transparent hover:bg-muted/40 hover:border-border/60 text-muted-foreground"
              }`}
            >
              {/* Avatar Initial Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold border transition-colors ${
                isSelected 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-muted text-foreground/70 border-border"
              }`}>
                {displayName.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className={`text-[13px] tracking-tight truncate ${isSelected ? "font-semibold text-foreground" : "font-medium text-foreground/90"}`}>
                    {displayName}
                  </h3>
                  {Boolean(chat.updated_at) && (
                    <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap ml-2 font-mono">
                      {formatDistanceToNow(toJsDate(chat.updated_at), {
                        addSuffix: false,
                        locale: es,
                      })}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center mt-1">
                  <p className="text-[11.5px] text-muted-foreground truncate pr-2 font-mono">
                    {chat.phone_number}
                  </p>
                  
                  {/* Status indicator */}
                  <div
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap ${
                      isBotActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isBotActive ? "bg-emerald-500" : "bg-neutral-400"
                      }`}
                    />
                    {isBotActive ? "Bot ON" : "Bot OFF"}
                  </div>
                </div>

                {chat.tags && chat.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {chat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded-md text-[9.5px] font-medium bg-background border border-border text-muted-foreground whitespace-nowrap"
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

        {filteredChats.length === 0 && (
          <div className="text-center py-8 px-4 text-xs text-muted-foreground">
            No se encontraron conversaciones
          </div>
        )}
      </div>
    </div>
  );
}
