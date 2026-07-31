import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  children: ReactNode[];
  autoplayMs?: number;
}

/** Carrusel horizontal con scroll-snap nativo (sin librerías externas):
 * soporta arrastre (touch/mouse), flechas, indicador de posición y
 * autoplay lento opcional que se pausa apenas el usuario interactúa.
 * 1 tarjeta visible en móvil, 2 en tablet, 3-4 en escritorio. */
export function Carousel({ children, autoplayMs }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const getCardStep = () => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>('[data-carousel-item]');
    return card ? card.offsetWidth + 20 : 300;
  };

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * getCardStep(), behavior: 'smooth' });
  };

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * getCardStep(), behavior: 'smooth' });
  };

  useEffect(() => {
    if (!autoplayMs || paused) return;
    const timer = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollByCard(1);
      }
    }, autoplayMs);
    return () => clearInterval(timer);
  }, [autoplayMs, paused]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const step = getCardStep();
    setActiveIndex(Math.round(track.scrollLeft / step));
  };

  const onPointerDown = (e: PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    isDragging.current = true;
    startX.current = e.clientX;
    scrollStart.current = track.scrollLeft;
    setPaused(true);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    const dx = e.clientX - startX.current;
    trackRef.current.scrollLeft = scrollStart.current - dx;
  };

  const endDrag = () => {
    isDragging.current = false;
    setPaused(false);
  };

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children.map((child, i) => (
          <div key={i} data-carousel-item className="w-full shrink-0 snap-start sm:w-[46%] lg:w-[23.5%]">
            {child}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label="Anterior"
        className="absolute -left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white p-2 shadow-card hover:bg-surface-muted sm:flex"
      >
        <ChevronLeft size={18} className="text-ink" />
      </button>
      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label="Siguiente"
        className="absolute -right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white p-2 shadow-card hover:bg-surface-muted sm:flex"
      >
        <ChevronRight size={18} className="text-ink" />
      </button>

      {/* Indicador de posición */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {children.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir a la tarjeta ${i + 1}`}
            onClick={() => scrollToIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIndex ? 'w-5 bg-brand' : 'w-1.5 bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
