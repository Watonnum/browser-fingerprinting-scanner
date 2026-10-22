'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

const LazyVisibilityContext = createContext(false);

export function useLazyVisibility(): boolean {
  return useContext(LazyVisibilityContext);
}

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

export function LazySection({ children, className = '', delayMs = 0 }: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -30% 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <LazyVisibilityContext.Provider value={isVisible}>
      <div
        ref={nodeRef}
        style={{ transitionDelay: isVisible ? `${delayMs}ms` : '0ms' }}
        className={`transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
        } ${className}`}
      >
        {children}
      </div>
    </LazyVisibilityContext.Provider>
  );
}
