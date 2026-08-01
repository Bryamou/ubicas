import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getPublicImageUrl } from '@/lib/storage';
import type { AgentProposal, OperationType, Property } from '@/types/database';

export interface AgentLinkedProperty extends Property {
  coverImageUrl: string | null;
  assignedAt: string;
}

export function useAgentLinkedProperties(agentId: string | undefined) {
  const [properties, setProperties] = useState<AgentLinkedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);

    const { data: assignments } = await supabase
      .from('property_agent_assignments')
      .select('property_id, assigned_at')
      .eq('agent_id', agentId);

    const ids = (assignments ?? []).map((a) => a.property_id);
    if (ids.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    const assignedAtMap = new Map((assignments ?? []).map((a) => [a.property_id, a.assigned_at]));

    const [{ data: propertyRows }, { data: images }] = await Promise.all([
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

    setProperties(
      ((propertyRows as Property[]) ?? []).map((p) => ({
        ...p,
        coverImageUrl: coverMap.has(p.id) ? getPublicImageUrl(coverMap.get(p.id)!) : null,
        assignedAt: assignedAtMap.get(p.id) ?? p.created_at,
      }))
    );
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { properties, loading, refresh };
}

export interface AgentRequirementProposalRow {
  id: string;
  requirement_id: string;
  agent_id: string;
  buyer_id: string;
  pitch: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  resolved_at: string | null;
  requirementSummary: string;
  buyerName: string;
}

export function useAgentRequirementProposals(agentId: string | undefined) {
  const [proposals, setProposals] = useState<AgentRequirementProposalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);

    const { data } = await supabase
      .from('requirement_agent_proposals')
      .select(
        '*, requirement:requirements(district, property_type, operation), buyer:profiles!requirement_agent_proposals_buyer_id_fkey(full_name)'
      )
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    setProposals(
      (data ?? []).map((p: any) => ({
        ...p,
        requirementSummary: p.requirement
          ? `${p.requirement.operation === 'sale' ? 'Compra' : 'Alquiler'} · ${p.requirement.property_type} en ${p.requirement.district}`
          : '',
        buyerName: p.buyer?.full_name ?? 'Comprador',
      }))
    );
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { proposals, loading, refresh };
}

export interface AgentProposalRow extends AgentProposal {
  propertyTitle: string;
  propertyDistrict: string;
  propertyOperation: OperationType;
  ownerName: string;
}

export function useAgentProposals(agentId: string | undefined) {
  const [proposals, setProposals] = useState<AgentProposalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);

    const { data } = await supabase
      .from('agent_proposals')
      .select(
        '*, property:properties(title, district, operation), owner:profiles!agent_proposals_owner_id_fkey(full_name)'
      )
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    setProposals(
      (data ?? []).map((p: any) => ({
        ...p,
        propertyTitle: p.property?.title ?? '',
        propertyDistrict: p.property?.district ?? '',
        propertyOperation: p.property?.operation ?? 'sale',
        ownerName: p.owner?.full_name ?? 'Propietario',
      }))
    );
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendProposal = async (input: {
    propertyId: string;
    ownerId: string;
    pitch: string;
    commissionPercent: number | null;
    commissionAmount: number | null;
  }) => {
    const { error } = await supabase.from('agent_proposals').insert({
      property_id: input.propertyId,
      agent_id: agentId,
      owner_id: input.ownerId,
      pitch: input.pitch,
      commission_percent: input.commissionPercent,
      commission_amount: input.commissionAmount,
    });

    if (!error) await refresh();
    return { error: error?.message ?? null };
  };

  return { proposals, loading, refresh, sendProposal };
}
