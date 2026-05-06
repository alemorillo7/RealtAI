"use client";

import { useEffect, useRef, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Message, Chat, Tag } from "@/types";
import BotToggle from "./BotToggle";
import TagSelector from "./TagSelector";
import ChatInput from "./ChatInput";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UserCircle2, Trash2, Check, CheckCheck } from "lucide-react";

interface Props {
  chatId: string;
}

export default function ChatWindow({ chatId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInfo, setChatInfo] = useState<Chat | null>(null);
  const [chatName, setChatName] = useState<string>(chatId);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Escuchar el documento principal del chat para obtener el nombre
    const unsubChat = onSnapshot(doc(db, "chats", chatId), (docSnap) => {
      if (docSnap.exists()) {
        setChatName(docSnap.data().user_name || chatId);
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

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

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
      {/* Patrón de fondo (Grid) premium */}
      <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-[0.03] dark:opacity-[0.02]" />
      
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/70 backdrop-blur-xl flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center border border-border shadow-inner">
            <UserCircle2 className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h3 className="text-foreground font-semibold text-lg tracking-tight leading-tight">{chatName}</h3>
            {chatName !== chatId && <p className="text-xs text-muted-foreground font-medium">{chatId}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDeleteChat}
            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-200"
            title="Eliminar Conversación"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <TagSelector chatId={chatId} />
          <BotToggle chatId={chatId} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => {
          const isAgent = msg.sender === "agent";
          
          // Lógica para el separador de fecha
          const msgDate = msg.created_at ? msg.created_at.toDate() : new Date();
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const prevDate = prevMsg?.created_at ? prevMsg.created_at.toDate() : null;
          
          const showDateDivider = !prevDate || msgDate.toDateString() !== prevDate.toDateString();

          return (
            <div key={msg.id} className="space-y-4">
              {showDateDivider && (
                <div className="flex justify-center my-6">
                  <span className="text-[10px] font-bold text-muted-foreground/80 bg-background/40 backdrop-blur-sm border border-border px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                    {format(msgDate, "d 'de' MMMM", { locale: es })}
                  </span>
                </div>
              )}
              <div
                className={`flex ${isAgent ? "justify-end" : "justify-start"} group relative z-10`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] px-5 py-3 shadow-lg transition-all duration-200 hover:shadow-xl ${
                    isAgent
                      ? "bg-gradient-to-b from-primary to-gold-dark text-primary-foreground rounded-2xl rounded-tr-sm ring-1 ring-black/10 shadow-primary/10"
                      : "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm shadow-sm"
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
                        className="w-full h-auto rounded-xl border border-border/50 shadow-sm cursor-zoom-in hover:opacity-95 transition-all active:scale-[0.98]"
                        onClick={() => window.open(msg.message, '_blank')}
                      />
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {renderMessageWithLinks(msg.message)}
                    </p>
                  )}
                  {msg.created_at && (
                    <p
                      className={`text-[10px] mt-1 text-right flex justify-end items-center gap-1 ${
                        isAgent ? "text-white/80" : "text-muted-foreground"
                      }`}
                    >
                      {format(msgDate, "HH:mm")}
                      {isAgent && (
                        <span className="ml-0.5">
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-[14px] h-[14px] text-[#34B7F1]" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-[14px] h-[14px] text-white/70" />
                          ) : (
                            <Check className="w-[14px] h-[14px] text-white/70" />
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
