import { supabase } from './supabase';

const BUCKET = 'property-images';

export function getPublicImageUrl(storagePath: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadPropertyImage(
  ownerId: string,
  propertyId: string,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const ext = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${ownerId}/${propertyId}/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

export async function deletePropertyImageFile(storagePath: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  return { error: error?.message ?? null };
}
