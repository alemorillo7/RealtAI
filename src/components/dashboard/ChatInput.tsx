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
    <div className="p-4 bg-bg-soft border-t border-gray-medium/20">
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-bg-dark border border-gray-medium/30 rounded-lg px-4 py-3 text-white placeholder-gray-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
