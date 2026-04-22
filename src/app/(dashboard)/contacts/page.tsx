"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Contact } from "@/types";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const q = query(collection(db, "contacts"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Contact[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Contact);
      });
      setContacts(data);
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setEditingContact(null);
    setIsModalOpen(false);
  };

  const handleOpenEdit = (contact: Contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone_number);
    setEmail(contact.email || "");
    setNotes(contact.notes || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalPhone = phone.trim();
      if (!finalPhone.startsWith('+')) finalPhone = '+' + finalPhone;

      if (editingContact) {
        await updateDoc(doc(db, "contacts", editingContact.id), {
          name,
          phone_number: finalPhone,
          email,
          notes,
        });
      } else {
        await addDoc(collection(db, "contacts"), {
          name,
          phone_number: finalPhone,
          email,
          notes,
          created_at: new Date(),
        });
      }

      // Sincronizar el nombre con el Chat asociado si existe (para reflejar en el Sidebar instantáneamente)
      try {
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "chats", finalPhone), { user_name: name, phone_number: finalPhone }, { merge: true });
      } catch (e) {
        console.error("No se pudo sincronizar el chat", e);
      }

      resetForm();
    } catch (error) {
      console.error("Error saving contact", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este contacto?")) {
      await deleteDoc(doc(db, "contacts", id));
    }
  };

  const filteredContacts = contacts.filter((c) =>
    (c.name + c.phone_number + c.email).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const currentContacts = filteredContacts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      <div className="p-6 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md flex justify-between items-center z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contactos</h1>
          <p className="text-gray-medium text-sm mt-1">Gestión de base de clientes</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-md shadow-primary/20 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">Nuevo Contacto</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="relative mb-6 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-medium" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-300 shadow-inner"
          />
        </div>

        <div className="bg-[#0a0a0a] rounded-xl border border-white/5 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-light">
              <thead className="bg-[#111111] border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold text-white">Nombre</th>
                  <th className="px-6 py-4 font-semibold text-white">Teléfono</th>
                  <th className="px-6 py-4 font-semibold text-white">Email</th>
                  <th className="px-6 py-4 font-semibold text-white text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentContacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{contact.name}</td>
                    <td className="px-6 py-4">{contact.phone_number}</td>
                    <td className="px-6 py-4 text-gray-medium">{contact.email || '-'}</td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button
                        onClick={() => handleOpenEdit(contact)}
                        className="p-1.5 text-gray-medium hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-1.5 text-gray-medium hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-medium">
                      No se encontraron contactos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-[#0a0a0a]">
              <span className="text-sm text-gray-medium">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredContacts.length)} de {filteredContacts.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors text-sm"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors text-sm"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-bg-soft rounded-2xl p-6 w-full max-w-md border border-gray-medium/20 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingContact ? "Editar Contacto" : "Nuevo Contacto"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-light mb-1">Nombre</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-bg-dark border border-gray-medium/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-light mb-1">Teléfono</label>
                <input
                  required
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-bg-dark border border-gray-medium/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-light mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-dark border border-gray-medium/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-light mb-1">Notas</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-bg-dark border border-gray-medium/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
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
