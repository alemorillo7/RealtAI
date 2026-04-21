"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bot } from "lucide-react";

interface Props {
  chatId: string;
}

export default function BotToggle({ chatId }: Props) {
  const [isBotActive, setIsBotActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "chats", chatId), (docSnap) => {
      if (docSnap.exists()) {
        setIsBotActive(docSnap.data().agent_active);
      }
    });
    return () => unsubscribe();
  }, [chatId]);

  const toggleBot = async () => {
    try {
      setLoading(true);
      await fetch("/api/toggle-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: chatId,
          agent_active: !isBotActive,
        }),
      });
    } catch (error) {
      console.error("Error toggling bot", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleBot}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
        isBotActive
          ? "bg-primary text-white border-primary-dark"
          : "bg-transparent text-gray-medium border-gray-medium/30 hover:border-gray-medium hover:text-white"
      }`}
    >
      <Bot className="w-5 h-5" />
      {isBotActive ? "Bot Activo" : "Bot Inactivo"}
    </button>
  );
}
