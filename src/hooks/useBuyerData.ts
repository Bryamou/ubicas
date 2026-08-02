import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getPublicImageUrl } from '@/lib/storage';
import type {
  Property,
  Requirement,
  RequirementAgentProposal,
  RequirementStatus,
  ContactRequest,
} from '@/types/database';

export interface FavoritePropertyRow extends Property {
  coverImageUrl: string | null;
  favoriteId: string;
}

export function useBuyerFavorites(buyerId: string | undefined) {
  const [favorites, setFavorites] = useState<FavoritePropertyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!buyerId) return;
    setLoading(true);

    const { data: favRows } = await supabase
      .from('favorites')
      .select('id, property_id, created_at')
      .eq('user_id', buyerId)
      .order('created_at', { ascending: false });

    const ids = (favRows ?? []).map((f) => f.property_id);
    if (ids.length === 0) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const favIdMap = new Map((favRows ?? []).map((f) => [f.property_id, f.id]));

    const [{ data: properties }, { data: images }] = await Promise.all([
      supabase.from('properties').select('*').in('id', ids),
      supabase
        .from('property_images')
        .select('property_id, storage_path, is_primary, sort_order')
        .in('property_id', ids)
        .order('sort_order', { ascending: true }),
    ]);

    const coverMap = new Map<string, string>();
    (images ?? []).forEach((img: any) => {
      if (!coverMap.has(img.property_id) || img.is_primary) {
        coverMap.set(img.property_id, img.storage_path);
      }
    });

    setFavorites(
      ((properties as Property[]) ?? []).map((p) => ({
        ...p,
        coverImageUrl: coverMap.has(p.id) ? getPublicImageUrl(coverMap.get(p.id)!) : null,
        favoriteId: favIdMap.get(p.id)!,
      }))
    );
    setLoading(false);
  }, [buyerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from('favorites').delete().eq('id', favoriteId);
    await refresh();
  };

  return { favorites, loading, refresh, removeFavorite };
}

export interface BuyerContactRow extends ContactRequest {
  propertyTitle: string;
  propertyOwnerId: string | null;
}

export function useBuyerContacts(buyerId: string | undefined) {
  const [contacts, setContacts] = useState<BuyerContactRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!buyerId) return;
    setLoading(true);

    const { data: contactRows } = await supabase
      .from('contact_requests')
      .select('*, property:properties(title, owner_id)')
      .eq('requester_id', buyerId)
      .order('created_at', { ascending: false });

    setContacts(
      (contactRows ?? []).map((c: any) => ({ ...c, propertyTitle: c.property?.title ?? '', propertyOwnerId: c.property?.owner_id ?? null }))
    );
    setLoading(false);
  }, [buyerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { contacts, loading, refresh };
}

export function useBuyerRequirements(buyerId: string | undefined) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!buyerId) return;
    setLoading(true);

    const { data } = await supabase
      .from('requirements')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    setRequirements((data as Requirement[]) ?? []);
    setLoading(false);
  }, [buyerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = async (id: string, status: RequirementStatus) => {
    const { error } = await supabase.from('requirements').update({ status }).eq('id', id);
    if (!error) await refresh();
    return { error: error?.message ?? null };
  };

  return { requirements, loading, refresh, updateStatus };
}

export interface RequirementProposalRow extends RequirementAgentProposal {
  requirementSummary: string;
  agentName: string;
  agentAgency: string | null;
  agentVerified: boolean;
}

export function useBuyerRequirementProposals(buyerId: string | undefined) {
  const [proposals, setProposals] = useState<RequirementProposalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!buyerId) return;
    setLoading(true);

    const { data } = await supabase
      .from('requirement_agent_proposals')
      .select(
        '*, requirement:requirements(district, property_type, operation), agent:profiles!requirement_agent_proposals_agent_id_fkey(full_name, agency_name, agent_verified)'
      )
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    setProposals(
      (data ?? []).map((p: any) => ({
        ...p,
        requirementSummary: p.requirement
          ? `${p.requirement.operation === 'sale' ? 'Compra' : 'Alquiler'} · ${p.requirement.property_type} en ${p.requirement.district}`
          : '',
        agentName: p.agent?.full_name ?? 'Agente',
        agentAgency: p.agent?.agency_name ?? null,
        agentVerified: p.agent?.agent_verified ?? false,
      }))
    );
    setLoading(false);
  }, [buyerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const respond = async (proposalId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('requirement_agent_proposals')
      .update({ status, resolved_at: new Date().toISOString() })
      .eq('id', proposalId);
    if (!error) await refresh();
    return { error: error?.message ?? null };
  };

  return { proposals, loading, refresh, respond };
}
