import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getPublicImageUrl } from '@/lib/storage';
import type { AgentProposal, OperationType, Property, Requirement } from '@/types/database';

export interface AgentLinkedProperty extends Property {
  coverImageUrl: string | null;
  assignedAt: string;
  source: 'linked' | 'own';
}

export function useAgentLinkedProperties(agentId: string | undefined) {
  const [properties, setProperties] = useState<AgentLinkedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);

    const [{ data: assignments }, { data: ownRows }] = await Promise.all([
      supabase.from('property_agent_assignments').select('property_id, assigned_at').eq('agent_id', agentId),
      supabase.from('properties').select('*').eq('owner_id', agentId),
    ]);

    const linkedIds = (assignments ?? []).map((a) => a.property_id);
    const assignedAtMap = new Map((assignments ?? []).map((a) => [a.property_id, a.assigned_at]));

    const [{ data: linkedRows }, { data: images }] = await Promise.all([
      linkedIds.length > 0 ? supabase.from('properties').select('*').in('id', linkedIds) : Promise.resolve({ data: [] }),
      supabase
        .from('property_images')
        .select('property_id, storage_path, is_primary, sort_order')
        .in('property_id', [...linkedIds, ...((ownRows ?? []) as Property[]).map((p) => p.id)])
        .order('sort_order', { ascending: true }),
    ]);

    const coverMap = new Map<string, string>();
    (images ?? []).forEach((img: any) => {
      if (!coverMap.has(img.property_id) || img.is_primary) {
        coverMap.set(img.property_id, img.storage_path);
      }
    });

    const merged = new Map<string, AgentLinkedProperty>();
    ((linkedRows as Property[]) ?? []).forEach((p) => {
      merged.set(p.id, {
        ...p,
        coverImageUrl: coverMap.has(p.id) ? getPublicImageUrl(coverMap.get(p.id)!) : null,
        assignedAt: assignedAtMap.get(p.id) ?? p.created_at,
        source: 'linked',
      });
    });
    ((ownRows as Property[]) ?? []).forEach((p) => {
      // Si además está vinculado formalmente (raro, pero posible), prevalece "vinculado".
      if (!merged.has(p.id)) {
        merged.set(p.id, {
          ...p,
          coverImageUrl: coverMap.has(p.id) ? getPublicImageUrl(coverMap.get(p.id)!) : null,
          assignedAt: p.created_at,
          source: 'own',
        });
      }
    });

    setProperties([...merged.values()].sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1)));
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

export interface AgentLinkedRequirement extends Requirement {
  buyerName: string;
  source: 'linked' | 'own';
  linkedAt: string;
}

/** Requerimientos ("clientes") del agente: los vinculados (propuesta
 * aceptada por el cliente) más los que el propio agente publicó en
 * nombre de un cliente. */
export function useAgentLinkedRequirements(agentId: string | undefined) {
  const [requirements, setRequirements] = useState<AgentLinkedRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);

    const [{ data: accepted }, { data: ownRows }] = await Promise.all([
      supabase
        .from('requirement_agent_proposals')
        .select('requirement_id, resolved_at, created_at')
        .eq('agent_id', agentId)
        .eq('status', 'accepted'),
      supabase.from('requirements').select('*').eq('buyer_id', agentId),
    ]);

    const linkedIds = (accepted ?? []).map((a) => a.requirement_id);
    const linkedAtMap = new Map((accepted ?? []).map((a) => [a.requirement_id, a.resolved_at ?? a.created_at]));

    const { data: linkedRows } =
      linkedIds.length > 0
        ? await supabase.from('requirements').select('*').in('id', linkedIds)
        : { data: [] as Requirement[] };

    const buyerIds = [...new Set([...linkedIds, ...((ownRows ?? []) as Requirement[]).map((r) => r.buyer_id)])];
    const { data: buyers } =
      buyerIds.length > 0 ? await supabase.from('profiles').select('id, full_name').in('id', buyerIds) : { data: [] };
    const buyerNameMap = new Map((buyers ?? []).map((b: any) => [b.id, b.full_name]));

    const merged = new Map<string, AgentLinkedRequirement>();
    ((linkedRows as Requirement[]) ?? []).forEach((r) => {
      merged.set(r.id, {
        ...r,
        buyerName: buyerNameMap.get(r.buyer_id) ?? 'Cliente',
        source: 'linked',
        linkedAt: linkedAtMap.get(r.id) ?? r.created_at,
      });
    });
    ((ownRows as Requirement[]) ?? []).forEach((r) => {
      if (!merged.has(r.id)) {
        merged.set(r.id, {
          ...r,
          buyerName: buyerNameMap.get(r.buyer_id) ?? 'Cliente',
          source: 'own',
          linkedAt: r.created_at,
        });
      }
    });

    setRequirements([...merged.values()].sort((a, b) => (a.linkedAt < b.linkedAt ? 1 : -1)));
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { requirements, loading, refresh };
}
