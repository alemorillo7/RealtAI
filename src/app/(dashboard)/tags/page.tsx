"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tag } from "@/types";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [color, setColor] = useState("#FFD047");

  useEffect(() => {
    const q = query(collection(db, "tags"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Tag[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Tag);
      });
      setTags(data);
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setName("");
    setColor("#C62828");
    setEditingTag(null);
    setIsModalOpen(false);
  };

  const handleOpenEdit = (tag: Tag) => {
    setEditingTag(tag);
    setName(tag.name);
    setColor(tag.color);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTag) {
        await updateDoc(doc(db, "tags", editingTag.id), {
          name,
          color,
        });
      } else {
        await addDoc(collection(db, "tags"), {
          name,
          color,
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving tag", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta etiqueta?")) {
      await deleteDoc(doc(db, "tags", id));
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border bg-card flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Etiquetas</h1>
          <p className="text-muted-foreground text-sm mt-1">Clasifica y organiza tus conversaciones</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva Etiqueta</span>
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <h3 className="text-foreground font-medium truncate">{tag.name}</h3>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border mt-auto">
                <button
                  onClick={() => handleOpenEdit(tag)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {tags.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground bg-card rounded-xl border border-gray-medium/20">
              No se encontraron etiquetas. Crea una nueva para empezar.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingTag ? "Editar Etiqueta" : "Nueva Etiqueta"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre de la Etiqueta</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    required
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-muted-foreground text-sm">{color}</span>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                 <button
                  type="submit"
                  className="px-6 py-2 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl transition-all shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
