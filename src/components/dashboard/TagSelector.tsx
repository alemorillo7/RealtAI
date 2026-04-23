"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tag } from "@/types";
import { Tag as TagIcon, Check } from "lucide-react";

export default function TagSelector({ chatId }: { chatId: string }) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [chatTags, setChatTags] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubTags = onSnapshot(collection(db, "tags"), (snap) => {
      setAvailableTags(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tag)));
    });

    const unsubChat = onSnapshot(doc(db, "chats", chatId), (snap) => {
      if (snap.exists()) {
        setChatTags(snap.data().tags || []);
      }
    });

    return () => { unsubTags(); unsubChat(); };
  }, [chatId]);

  const toggleTag = async (tagName: string) => {
    const newTags = chatTags.includes(tagName) 
      ? chatTags.filter(t => t !== tagName)
      : [...chatTags, tagName];
    await updateDoc(doc(db, "chats", chatId), { tags: newTags });
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-foreground text-sm transition-colors"
      >
        <TagIcon className="w-4 h-4 text-muted-foreground" />
        <span className="hidden sm:inline">Etiquetas</span>
      </button>

      {/* Backdrop para cerrar al hacer clic afuera */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">Asignar Etiquetas</h4>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {availableTags.map(tag => {
              const isSelected = chatTags.includes(tag.name);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.name)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className={isSelected ? "text-foreground font-semibold" : "text-foreground/80"}>{tag.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
            {availableTags.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">No hay etiquetas creadas.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
