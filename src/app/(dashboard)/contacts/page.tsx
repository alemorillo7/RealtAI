"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Contact } from "@/types";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
      if (editingContact) {
        await updateDoc(doc(db, "contacts", editingContact.id), {
          name,
          phone_number: phone,
          email,
          notes,
        });
      } else {
        await addDoc(collection(db, "contacts"), {
          name,
          phone_number: phone,
          email,
          notes,
          created_at: new Date(),
        });
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

  return (
    <div className="flex flex-col h-full bg-bg-dark">
      <div className="p-6 border-b border-gray-medium/20 bg-bg-soft flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Contactos</h1>
          <p className="text-gray-medium text-sm mt-1">Gestión de base de clientes</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nuevo Contacto</span>
        </button>
      </div>

      <div className="p-6">
        <div className="relative mb-6 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-medium" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-soft border border-gray-medium/30 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="overflow-x-auto bg-bg-soft rounded-xl border border-gray-medium/20">
          <table className="w-full text-left text-sm text-gray-light">
            <thead className="bg-bg-dark border-b border-gray-medium/20">
              <tr>
                <th className="px-6 py-4 font-medium text-white">Nombre</th>
                <th className="px-6 py-4 font-medium text-white">Teléfono</th>
                <th className="px-6 py-4 font-medium text-white">Email</th>
                <th className="px-6 py-4 font-medium text-white text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="border-b border-gray-medium/10 hover:bg-bg-dark/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{contact.name}</td>
                  <td className="px-6 py-4">{contact.phone_number}</td>
                  <td className="px-6 py-4">{contact.email || '-'}</td>
                  <td className="px-6 py-4 flex justify-end gap-3">
                    <button
                      onClick={() => handleOpenEdit(contact)}
                      className="text-gray-medium hover:text-white transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-gray-medium hover:text-primary transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
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
