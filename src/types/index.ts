export interface Chat {
  phone_number: string;
  user_name?: string;
  agent_active: boolean;
  updated_at: FirebaseFirestore.Timestamp | any;
  tags: string[];
  contact_id?: string;
}

export interface Message {
  id: string;
  phone_number: string;
  sender: 'user' | 'agent';
  message: string;
  created_at: FirebaseFirestore.Timestamp | any;
  type?: 'text' | 'audio' | string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Contact {
  id: string;
  phone_number: string;
  name: string;
  email?: string;
  notes?: string;
  created_at: FirebaseFirestore.Timestamp | any;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Lead {
  id: string;
  name: string;
  phone_number: string;
  status: string;
  description?: string;
  created_at: FirebaseFirestore.Timestamp | any;
}

export interface Agent {
  id: string;
  name: string;
  category: 'propiedades' | 'ventas' | 'soporte';
  status: 'online' | 'offline';
  last_active: FirebaseFirestore.Timestamp | any;
}
