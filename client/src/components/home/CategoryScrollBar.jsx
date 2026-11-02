import { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CategoryScrollBar({ children }) {
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const viewportId = useId();
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const viewport = viewportRef.current;
    const updateEdges = () => {
      const left = viewport.scrollLeft > 1;
      const right = viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft > 1;
      setEdges((previous) => previous.left === left && previous.right === right
        ? previous : { left, right });
    };
    updateEdges();
    viewport.addEventListener('scroll', updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(viewport);
    observer.observe(contentRef.current);
    return () => {
      viewport.removeEventListener('scroll', updateEdges);
      observer.disconnect();
    };
  }, []);

  const scroll = (direction) => {
    const viewport = viewportRef.current;
    viewport.scrollBy({
      left: direction * Math.max(160, viewport.clientWidth * 0.65),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  const arrowClass = 'absolute top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-brand-200/70 bg-white/85 text-brand-600 backdrop-blur-md shadow-sm hover:bg-brand-50/95 hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors motion-reduce:transition-none cursor-pointer';

  return (
    <div className="relative" role="group" aria-label="Marketplace categories">
      <div
        id={viewportId}
        ref={viewportRef}
        className="overflow-x-auto scrollbar-none no-scrollbar touch-pan-x touch-momentum py-1.5 px-1 scroll-px-12"
      >
        <div ref={contentRef} className="flex w-max min-w-full items-center gap-2">
          {children}
        </div>
      </div>
      {edges.left && (
        <button type="button" className={`${arrowClass} left-0`} aria-label="Scroll categories left" aria-controls={viewportId} onClick={() => scroll(-1)}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
      {edges.right && (
        <button type="button" className={`${arrowClass} right-0`} aria-label="Scroll categories right" aria-controls={viewportId} onClick={() => scroll(1)}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
