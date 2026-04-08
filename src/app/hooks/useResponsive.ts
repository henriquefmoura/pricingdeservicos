import { useState, useEffect, useCallback } from 'react';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ResponsiveState {
  /** Current viewport width in pixels */
  width: number;
  /** Current viewport height in pixels */
  height: number;
  /** Current breakpoint name */
  breakpoint: Breakpoint;
  /** true when viewport width < 768px */
  isMobile: boolean;
  /** true when viewport width >= 768px and < 1024px */
  isTablet: boolean;
  /** true when viewport width >= 1024px and < 1280px */
  isLaptop: boolean;
  /** true when viewport width >= 1280px */
  isDesktop: boolean;
  /** Number of grid columns for common layouts (1 on mobile, 2 on tablet, 3-4 on desktop) */
  gridCols: (max?: number) => number;
  /** Responsive padding: smaller on mobile, larger on desktop */
  mainPadding: string;
  /** Responsive gap: smaller on mobile, larger on desktop */
  gap: (base?: number) => number;
  /** Responsive font size multiplier */
  fontScale: number;
}

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.sm) return 'sm';
  if (width < BREAKPOINTS.md) return 'md';
  if (width < BREAKPOINTS.lg) return 'lg';
  if (width < BREAKPOINTS.xl) return 'xl';
  return '2xl';
}

export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    let rafId: number;

    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      });
    };

    window.addEventListener('resize', handleResize);
    // Initial measurement
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const { width, height } = dimensions;
  const breakpoint = getBreakpoint(width);
  const isMobile = width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isLaptop = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl;
  const isDesktop = width >= BREAKPOINTS.xl;

  const gridCols = useCallback(
    (max: number = 4): number => {
      if (width < BREAKPOINTS.sm) return 1;
      if (width < BREAKPOINTS.md) return Math.min(max, 2);
      if (width < BREAKPOINTS.lg) return Math.min(max, 2);
      if (width < BREAKPOINTS.xl) return Math.min(max, 3);
      return max;
    },
    [width],
  );

  const mainPadding = isMobile
    ? '12px 16px'
    : isTablet
    ? '16px 24px'
    : isLaptop
    ? '20px 28px'
    : '24px 40px';

  const gap = useCallback(
    (base: number = 16): number => {
      if (isMobile) return Math.max(8, Math.round(base * 0.625));
      if (isTablet) return Math.round(base * 0.75);
      return base;
    },
    [isMobile, isTablet],
  );

  const fontScale = isMobile ? 0.875 : isTablet ? 0.9375 : 1;

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    gridCols,
    mainPadding,
    gap,
    fontScale,
  };
}
