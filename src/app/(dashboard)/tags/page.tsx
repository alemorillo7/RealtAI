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
  const [color, setColor] = useState("#C62828");

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
    <div className="flex flex-col h-full bg-bg-dark">
      <div className="p-6 border-b border-gray-medium/20 bg-bg-soft flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Etiquetas</h1>
          <p className="text-gray-medium text-sm mt-1">Clasifica y organiza tus conversaciones</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
              className="bg-bg-soft border border-gray-medium/20 rounded-xl p-4 flex flex-col justify-between"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <h3 className="text-white font-medium truncate">{tag.name}</h3>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-medium/10 mt-auto">
                <button
                  onClick={() => handleOpenEdit(tag)}
                  className="text-gray-medium hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="text-gray-medium hover:text-primary transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {tags.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-medium bg-bg-soft rounded-xl border border-gray-medium/20">
              No se encontraron etiquetas. Crea una nueva para empezar.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-bg-soft rounded-2xl p-6 w-full max-w-sm border border-gray-medium/20 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingTag ? "Editar Etiqueta" : "Nueva Etiqueta"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-light mb-1">Nombre de la Etiqueta</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-bg-dark border border-gray-medium/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-light mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    required
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-gray-medium text-sm">{color}</span>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-light hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
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
