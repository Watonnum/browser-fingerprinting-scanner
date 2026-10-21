'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface LazyVisibilityContextValue {
  isVisible: boolean;
}

const LazyVisibilityContext = createContext<LazyVisibilityContextValue>({ isVisible: false });

export function useLazyVisibility() {
  return useContext(LazyVisibilityContext);
}

interface LazySectionProps {
  children: ReactNode | ((props: { isVisible: boolean }) => ReactNode);
  className?: string;
  id?: string;
  delayMs?: number;
  rootMargin?: string;
  threshold?: number;
}

export function LazySection({
  children,
  className = '',
  id,
  delayMs = 0,
  rootMargin = '0px 0px -18% 0px',
  threshold = 0.1,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin,
        threshold,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  const transitionDelay = `${delayMs}ms`;

  return (
    <LazyVisibilityContext.Provider value={{ isVisible }}>
      <div
        id={id}
        ref={elementRef}
        style={{ transitionDelay }}
        className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible
            ? 'opacity-100 translate-y-0 scale-100 blur-none'
            : 'opacity-0 translate-y-8 scale-[0.98] blur-[2px]'
        } ${className}`}
      >
        {typeof children === 'function' ? children({ isVisible }) : children}
      </div>
    </LazyVisibilityContext.Provider>
  );
}
