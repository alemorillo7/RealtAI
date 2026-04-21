"use client";

import { useEffect, useRef, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Message } from "@/types";
import BotToggle from "./BotToggle";
import TagSelector from "./TagSelector";
import ChatInput from "./ChatInput";
import { format } from "date-fns";
import { UserCircle2 } from "lucide-react";

interface Props {
  chatId: string;
}

export default function ChatWindow({ chatId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    return () => unsubscribe();
  }, [chatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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
    <div className="flex flex-col h-full bg-bg-soft">
      {/* Header */}
      <div className="p-4 border-b border-gray-medium/20 bg-bg-dark flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-medium/20 flex items-center justify-center">
            <UserCircle2 className="w-6 h-6 text-gray-medium" />
          </div>
          <div>
            <h3 className="text-white font-medium">{chatId}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TagSelector chatId={chatId} />
          <BotToggle chatId={chatId} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isAgent = msg.sender === "agent";
          return (
            <div
              key={msg.id}
              className={`flex ${isAgent ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isAgent
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-bg-dark border border-gray-medium/20 text-white rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{renderMessageWithLinks(msg.message)}</p>
                {msg.created_at && (
                  <p
                    className={`text-[10px] mt-1 text-right ${
                      isAgent ? "text-white/80" : "text-gray-medium"
                    }`}
                  >
                    {format(msg.created_at.toDate(), "HH:mm")}
                  </p>
                )}
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
