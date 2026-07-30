import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Property,
  PropertyImage,
  PropertyStatus,
  ContactRequest,
  VisitRequest,
  AgentProposal,
} from '@/types/database';

export interface OwnerPropertyRow extends Property {
  coverImageUrl: string | null;
  viewsCount: number;
  contactsCount: number;
  visitsCount: number;
  pendingProposalsCount: number;
}

async function attachCovers(properties: Property[]): Promise<OwnerPropertyRow[]> {
  if (properties.length === 0) return [];
  const ids = properties.map((p) => p.id);

  const [{ data: images }, { data: views }, { data: contacts }, { data: visits }, { data: proposals }] =
    await Promise.all([
      supabase
        .from('property_images')
        .select('property_id, storage_path, is_primary, sort_order')
        .in('property_id', ids)
        .order('sort_order', { ascending: true }),
      supabase.from('property_views').select('property_id').in('property_id', ids),
      supabase.from('contact_requests').select('property_id').in('property_id', ids),
      supabase.from('visit_requests').select('property_id').in('property_id', ids),
      supabase
        .from('agent_proposals')
        .select('property_id, status')
        .in('property_id', ids)
        .eq('status', 'pending'),
    ]);

  const countBy = (rows: { property_id: string }[] | null) => {
    const map = new Map<string, number>();
    (rows ?? []).forEach((r) => map.set(r.property_id, (map.get(r.property_id) ?? 0) + 1));
    return map;
  };

  const viewsMap = countBy(views);
  const contactsMap = countBy(contacts);
  const visitsMap = countBy(visits);
  const proposalsMap = countBy(proposals as { property_id: string }[] | null);

  const coverMap = new Map<string, string>();
  (images as (Pick<PropertyImage, 'property_id' | 'storage_path' | 'is_primary'>)[] | null)?.forEach(
    (img) => {
      if (!coverMap.has(img.property_id) || img.is_primary) {
        coverMap.set(img.property_id, img.storage_path);
      }
    }
  );

  return properties.map((p) => ({
    ...p,
    coverImageUrl: coverMap.has(p.id)
      ? supabase.storage.from('property-images').getPublicUrl(coverMap.get(p.id)!).data.publicUrl
      : null,
    viewsCount: viewsMap.get(p.id) ?? 0,
    contactsCount: contactsMap.get(p.id) ?? 0,
    visitsCount: visitsMap.get(p.id) ?? 0,
    pendingProposalsCount: proposalsMap.get(p.id) ?? 0,
  }));
}

export function useOwnerProperties(ownerId: string | undefined) {
  const [properties, setProperties] = useState<OwnerPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const rows = await attachCovers((data as Property[]) ?? []);
    setProperties(rows);
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = async (propertyId: string, status: PropertyStatus) => {
    const { error: updateError } = await supabase
      .from('properties')
      .update({ status, published_at: status === 'published' ? new Date().toISOString() : undefined })
      .eq('id', propertyId);

    if (!updateError) await refresh();
    return { error: updateError?.message ?? null };
  };

  return { properties, loading, error, refresh, updateStatus };
}

export interface OwnerContactRow extends ContactRequest {
  propertyTitle: string;
  requesterName: string;
}

export interface OwnerVisitRow extends VisitRequest {
  propertyTitle: string;
  requesterName: string;
}

export function useOwnerContactsAndVisits(ownerId: string | undefined) {
  const [contacts, setContacts] = useState<OwnerContactRow[]>([]);
  const [visits, setVisits] = useState<OwnerVisitRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);

    const { data: myProperties } = await supabase
      .from('properties')
      .select('id, title')
      .eq('owner_id', ownerId);

    const propertyIds = (myProperties ?? []).map((p) => p.id);
    const titleMap = new Map((myProperties ?? []).map((p) => [p.id, p.title]));

    if (propertyIds.length === 0) {
      setContacts([]);
      setVisits([]);
      setLoading(false);
      return;
    }

    const [{ data: contactRows }, { data: visitRows }] = await Promise.all([
      supabase
        .from('contact_requests')
        .select('*, requester:profiles!contact_requests_requester_id_fkey(full_name)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('visit_requests')
        .select('*, requester:profiles!visit_requests_requester_id_fkey(full_name)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false }),
    ]);

    setContacts(
      (contactRows ?? []).map((c: any) => ({
        ...c,
        propertyTitle: titleMap.get(c.property_id) ?? '',
        requesterName: c.requester?.full_name ?? 'Usuario',
      }))
    );
    setVisits(
      (visitRows ?? []).map((v: any) => ({
        ...v,
        propertyTitle: titleMap.get(v.property_id) ?? '',
        requesterName: v.requester?.full_name ?? 'Usuario',
      }))
    );
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markContactAttended = async (id: string) => {
    await supabase.from('contact_requests').update({ status: 'attended' }).eq('id', id);
    await refresh();
  };

  const updateVisitStatus = async (id: string, status: VisitRequest['status']) => {
    await supabase.from('visit_requests').update({ status }).eq('id', id);
    await refresh();
  };

  return { contacts, visits, loading, refresh, markContactAttended, updateVisitStatus };
}

export interface OwnerProposalRow extends AgentProposal {
  propertyTitle: string;
  agentName: string;
  agentAgency: string | null;
  agentVerified: boolean;
}

export function useOwnerProposals(ownerId: string | undefined) {
  const [proposals, setProposals] = useState<OwnerProposalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);

    const { data } = await supabase
      .from('agent_proposals')
      .select(
        '*, property:properties(title), agent:profiles!agent_proposals_agent_id_fkey(full_name, agency_name, agent_verified)'
      )
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    setProposals(
      (data ?? []).map((p: any) => ({
        ...p,
        propertyTitle: p.property?.title ?? '',
        agentName: p.agent?.full_name ?? 'Agente',
        agentAgency: p.agent?.agency_name ?? null,
        agentVerified: p.agent?.agent_verified ?? false,
      }))
    );
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const accept = async (proposalId: string) => {
    const { error } = await supabase.rpc('accept_agent_proposal', { p_proposal_id: proposalId });
    if (!error) await refresh();
    return { error: error?.message ?? null };
  };

  const reject = async (proposalId: string) => {
    const { error } = await supabase
      .from('agent_proposals')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', proposalId);
    if (!error) await refresh();
    return { error: error?.message ?? null };
  };

  return { proposals, loading, refresh, accept, reject };
}
