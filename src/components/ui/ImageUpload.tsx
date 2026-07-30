import { useRef } from 'react';
import { ImagePlus, Star, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export interface UploadedImage {
  id: string;
  url: string; // object URL local o URL pública de Storage
  file?: File; // presente si aún no se subió
  storagePath?: string; // presente si ya está en Supabase Storage
}

interface ImageUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
  error?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function ImageUpload({ images, onChange, maxFiles = 20, error }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const accepted: UploadedImage[] = [];

    Array.from(fileList).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      if (images.length + accepted.length >= maxFiles) return;
      accepted.push({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      });
    });

    onChange([...images, ...accepted]);
  };

  const removeImage = (id: string) => onChange(images.filter((img) => img.id !== id));

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const makePrimary = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed py-10 text-center transition hover:border-brand hover:bg-brand-soft',
          error ? 'border-red-400' : 'border-border'
        )}
      >
        <ImagePlus className="text-brand" size={28} />
        <p className="text-sm font-semibold text-ink">Arrastra tus fotos o haz clic para subirlas</p>
        <p className="text-xs text-ink-light">JPG, JPEG, PNG o WEBP · recomendamos mínimo 5 fotos</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, index) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-card border border-border"
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                  <Star size={11} fill="white" /> Principal
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1.5 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  className="rounded bg-white/20 p-1 text-white disabled:opacity-30"
                  aria-label="Mover a la izquierda"
                >
                  <ChevronLeft size={14} />
                </button>
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(index)}
                    className="rounded bg-white/20 px-1.5 py-1 text-[10px] font-semibold text-white"
                  >
                    Hacer principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  className="rounded bg-white/20 p-1 text-white disabled:opacity-30"
                  aria-label="Mover a la derecha"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="rounded bg-white/20 p-1 text-white hover:bg-red-500"
                  aria-label="Eliminar foto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
