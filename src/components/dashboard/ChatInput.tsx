"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface Props {
  chatId: string;
}

export default function ChatInput({ chatId }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const msg = message;
    setMessage(""); // Optimistic clear

    try {
      setLoading(true);
      await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: chatId,
          message: msg,
        }),
      });
    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:px-6 md:pb-6 bg-transparent">
      <form onSubmit={handleSend} className="flex gap-3 bg-card/60 backdrop-blur-xl p-2 rounded-2xl border border-border shadow-sm focus-within:border-primary/50 focus-within:shadow-primary/10 transition-all duration-300">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje para enviar..."
          className="flex-1 bg-transparent border-none px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 sm:text-sm"
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="bg-primary hover:opacity-90 text-primary-foreground p-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm active:scale-95"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5 translate-x-[-1px] translate-y-[1px]" />
          )}
        </button>
      </form>
    </div>
  );
}
