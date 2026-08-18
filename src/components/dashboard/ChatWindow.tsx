"use client";

import { useEffect, useRef, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Message, Chat, Tag } from "@/types";
import BotToggle from "./BotToggle";
import TagSelector from "./TagSelector";
import ChatInput from "./ChatInput";
import { format } from "date-fns";
import { formatInMadrid } from "@/lib/dateUtils";
import { es } from "date-fns/locale";
import { User, Trash2, Check, CheckCheck } from "lucide-react";

interface Props {
  chatId: string;
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

export default function ChatWindow({ chatId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInfo, setChatInfo] = useState<Chat | null>(null);
  const [chatName, setChatName] = useState<string>(chatId);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  useEffect(() => {
    // Escuchar el documento principal del chat para obtener el nombre
    const unsubChat = onSnapshot(doc(db, "chats", chatId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setChatInfo(data as Chat);
        setChatName(data.real_name && data.real_name !== "-" ? data.real_name : (data.user_name || chatId));
      }
    });

    // Escuchar mensajes
    const q = query(
      collection(db, "messages"),
      where("phone_number", "==", chatId),
      orderBy("created_at", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgsData: Message[] = [];
      snapshot.forEach((doc) => {
        msgsData.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgsData);
      scrollToBottom();
    });

    return () => { unsubscribe(); unsubChat(); };
  }, [chatId]);

  const handleDeleteChat = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar permanentemente esta conversación? (El contacto seguirá guardado en tu libreta).")) {
      try {
        await fetch('/api/delete-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: chatId })
        });
        window.location.href = '/agents';
      } catch (e) {
        console.error(e);
        alert("Error al eliminar el chat");
      }
    }
  };

  const renderMessageWithLinks = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium hover:opacity-80 transition-opacity"
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="p-3.5 px-5 border-b border-border bg-card flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-foreground text-background font-bold text-sm flex items-center justify-center border border-border shadow-xs">
            {chatName.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-foreground font-semibold text-[15px] tracking-tight leading-snug">{chatName}</h3>
            {chatName !== chatId && <p className="text-[11px] text-muted-foreground font-mono">{chatId}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDeleteChat}
            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-150"
            title="Eliminar Conversación"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <TagSelector chatId={chatId} />
          <BotToggle chatId={chatId} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {messages.map((msg, index) => {
          const isAgent = msg.sender === "agent";
          
          // Lógica para el separador de fecha
          const msgDate = toJsDate(msg.created_at);
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const prevDate = prevMsg?.created_at ? toJsDate(prevMsg.created_at) : null;
          
          const showDateDivider = !prevDate || msgDate.toDateString() !== prevDate.toDateString();

          return (
            <div key={msg.id} className="space-y-4">
              {showDateDivider && (
                <div className="flex justify-center my-4">
                  <span className="text-[11px] font-medium text-muted-foreground bg-muted/80 border border-border px-3 py-1 rounded-full font-mono shadow-2xs">
                    {formatInMadrid(msgDate, "d 'de' MMMM")}
                  </span>
                </div>
              )}
              <div
                className={`flex ${isAgent ? "justify-end" : "justify-start"} group relative z-10`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 shadow-xs transition-all duration-150 ${
                    isAgent
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-xs"
                      : "bg-card border border-border text-foreground rounded-2xl rounded-tl-xs"
                  }`}
                >
                  {msg.type === "audio" ? (
                    <div className="bg-muted/20 p-2 rounded-xl mt-1">
                      <audio controls src={msg.message} className="max-w-full h-8" />
                    </div>
                  ) : msg.type === "image" ? (
                    <div className="mt-1 mb-1 max-w-[250px]">
                      <img 
                        src={msg.message} 
                        alt="Imagen de chat" 
                        className="w-full h-auto rounded-xl border border-border/50 shadow-xs cursor-zoom-in hover:opacity-95 transition-all active:scale-[0.98]"
                        onClick={() => window.open(msg.message, '_blank')}
                      />
                    </div>
                  ) : (
                    <p className="text-[13.5px] whitespace-pre-wrap break-words leading-relaxed">
                      {renderMessageWithLinks(msg.message)}
                    </p>
                  )}
                  {Boolean(msg.created_at) && (
                    <p
                      className={`text-[10px] mt-1 text-right flex justify-end items-center gap-1 font-mono ${
                        isAgent ? "text-primary-foreground/75" : "text-muted-foreground"
                      }`}
                    >
                      {formatInMadrid(msgDate, "HH:mm")}
                      {isAgent && (
                        <span className="ml-0.5">
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-[13px] h-[13px] text-[#34B7F1]" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-[13px] h-[13px] text-primary-foreground/70" />
                          ) : (
                            <Check className="w-[13px] h-[13px] text-primary-foreground/70" />
                          )}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput chatId={chatId} />
    </div>
  );
}
