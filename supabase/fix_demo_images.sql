-- =========================================================
-- UBICAS - Arreglo rápido: fotos de demo rotas
-- =========================================================
-- Corre esto si ya ejecutaste seed_10_properties.sql antes y las fotos
-- salen rotas (los IDs de picsum.photos/id/N que usaba la versión
-- anterior no existían). Este script SOLO toca las filas que tengan esas
-- URLs viejas (picsum.photos/id/...) — no afecta ninguna foto real que
-- hayas subido tú desde el wizard de publicación.

update public.property_images
set storage_path = 'https://picsum.photos/seed/ubicas-foto-1/1200/800'
where storage_path like 'https://picsum.photos/id/%' and sort_order = 0;

update public.property_images
set storage_path = 'https://picsum.photos/seed/ubicas-foto-2/1200/800'
where storage_path like 'https://picsum.photos/id/%' and sort_order = 1;

update public.property_images
set storage_path = 'https://picsum.photos/seed/ubicas-foto-3/1200/800'
where storage_path like 'https://picsum.photos/id/%' and sort_order = 2;
