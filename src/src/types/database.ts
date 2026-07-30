export type UserRole = 'owner' | 'agent' | 'buyer';
export type OperationType = 'sale' | 'rent';
export type PropertyType = 'apartment' | 'house' | 'office' | 'land' | 'commercial' | 'other';
export type PropertyStatus = 'draft' | 'published' | 'paused' | 'closed' | 'sold' | 'rented';
export type ProposalStatus = 'pending' | 'accepted' | 'rejected';
export type VisitStatus = 'pending' | 'accepted' | 'rejected' | 'completed';
export type RequirementStatus = 'active' | 'paused' | 'closed';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  agency_name: string | null;
  agent_description: string | null;
  agent_zones: string[] | null;
  agent_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  operation: OperationType;
  property_type: PropertyType;
  title: string;
  description: string | null;
  district: string;
  city: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price: number;
  currency: string;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  status: PropertyStatus;
  published_at: string | null;
  // Fase 1 - wizard del propietario
  hide_exact_address: boolean;
  negotiable: boolean;
  area_built_m2: number | null;
  age_years: number | null;
  floor_number: number | null;
  total_floors: number | null;
  pets_allowed: boolean | null;
  furnished: boolean | null;
  highlights: string | null;
  terms: string | null;
  additional_info: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_preference: 'call' | 'whatsapp' | 'email' | null;
  contact_hours: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface PropertyFeature {
  id: string;
  property_id: string;
  feature: string;
}

export interface AgentProposal {
  id: string;
  property_id: string;
  agent_id: string;
  owner_id: string;
  pitch: string;
  commission_percent: number | null;
  commission_amount: number | null;
  status: ProposalStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface Requirement {
  id: string;
  buyer_id: string;
  operation: OperationType;
  property_type: PropertyType;
  district: string;
  max_budget: number;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: boolean;
  pets: boolean;
  target_date: string | null;
  extra_notes: string | null;
  status: RequirementStatus;
  created_at: string;
  updated_at: string;
}

export interface RequirementAgentProposal {
  id: string;
  requirement_id: string;
  agent_id: string;
  buyer_id: string;
  pitch: string;
  status: ProposalStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface ContactRequest {
  id: string;
  property_id: string;
  requester_id: string;
  message: string | null;
  status: 'pending' | 'attended';
  created_at: string;
}

export interface VisitRequest {
  id: string;
  property_id: string;
  requester_id: string;
  proposed_date: string;
  status: VisitStatus;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  read: boolean;
  created_at: string;
}

// Tipo mínimo requerido por el genérico de supabase-js.
// Se puede reemplazar por el tipo generado con `supabase gen types typescript`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
