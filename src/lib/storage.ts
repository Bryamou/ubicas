import { supabase } from './supabase';

const BUCKET = 'property-images';

export function getPublicImageUrl(storagePath: string) {
  // Si ya es una URL completa (ej. imágenes dummy de demo hospedadas afuera),
  // se devuelve tal cual en vez de intentar resolverla contra el bucket.
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }
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

const AVATAR_BUCKET = 'avatars';

export function getPublicAvatarUrl(storagePath: string) {
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) return { path: null, error: error.message };
  return { path, error: null };
}
