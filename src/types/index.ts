type FirestoreDateValue = FirebaseFirestore.Timestamp | Date | null | undefined | unknown;

export interface Chat {
  phone_number: string;
  user_name?: string;
  real_name?: string;
  agent_active: boolean;
  bot_active?: boolean;
  updated_at: FirestoreDateValue;
  tags: string[];
  contact_id?: string;
}

export interface Message {
  id: string;
  phone_number: string;
  sender: 'user' | 'agent';
  message: string;
  created_at: FirestoreDateValue;
  type?: 'text' | 'audio' | string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Contact {
  id: string;
  profile_id?: string;
  name: string;
  user_name?: string;
  phone_number: string;
  email?: string;
  notes?: string;
  created_at: FirestoreDateValue;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Lead {
  id: string;
  profile_id?: string;
  name: string;
  user_name?: string;
  phone_number: string;
  email?: string;
  status: 'nuevo' | 'interesado' | 'discovery' | 'preguntas' | 'propuesta' | string;
  description?: string;
  created_at: FirestoreDateValue;
  updated_at?: FirestoreDateValue;
}

export interface Agent {
  id: string;
  name: string;
  category: 'propiedades' | 'ventas' | 'soporte';
  status: 'online' | 'offline';
  last_active: FirestoreDateValue;
}
