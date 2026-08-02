import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getPublicImageUrl } from '@/lib/storage';
import type { Property, Requirement } from '@/types/database';

interface FavoritePropertyRow extends Property {
  coverImageUrl: string | null;
}

/** Favoritos de inmuebles y de requerimientos ("clientes"), disponibles
 * para cualquier rol (propietario, agente o comprador). Tope de 20 por
 * cada tipo, reforzado también en la base de datos. */
export function useFavorites(userId: string | undefined) {
  const [properties, setProperties] = useState<FavoritePropertyRow[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [{ data: propFavs }, { data: reqFavs }] = await Promise.all([
      supabase.from('favorites').select('property_id').eq('user_id', userId).not('property_id', 'is', null),
      supabase.from('favorites').select('requirement_id').eq('user_id', userId).not('requirement_id', 'is', null),
    ]);

    const propertyIds = (propFavs ?? []).map((f: any) => f.property_id);
    const requirementIds = (reqFavs ?? []).map((f: any) => f.requirement_id);

    const [propertiesResult, imagesResult, requirementsResult] = await Promise.all([
      propertyIds.length > 0 ? supabase.from('properties').select('*').in('id', propertyIds) : Promise.resolve({ data: [] }),
      propertyIds.length > 0
        ? supabase
            .from('property_images')
            .select('property_id, storage_path, is_primary, sort_order')
            .in('property_id', propertyIds)
            .order('sort_order', { ascending: true })
        : Promise.resolve({ data: [] }),
      requirementIds.length > 0 ? supabase.from('requirements').select('*').in('id', requirementIds) : Promise.resolve({ data: [] }),
    ]);

    const coverMap = new Map<string, string>();
    (imagesResult.data ?? []).forEach((img: any) => {
      if (!coverMap.has(img.property_id) || img.is_primary) coverMap.set(img.property_id, img.storage_path);
    });

    setProperties(
      ((propertiesResult.data ?? []) as Property[]).map((p) => ({
        ...p,
        coverImageUrl: coverMap.has(p.id) ? getPublicImageUrl(coverMap.get(p.id)!) : null,
      }))
    );
    setRequirements((requirementsResult.data ?? []) as Requirement[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { properties, requirements, loading, refresh };
}
