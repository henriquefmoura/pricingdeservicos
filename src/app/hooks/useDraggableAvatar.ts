import { useRef, useCallback, useEffect, useState } from 'react';

/** Key used to persist avatar position in localStorage */
const POSITION_STORAGE_KEY = 'pedroii-avatar-position';

export interface AvatarPosition {
  x: number;
  y: number;
}

/** Default position: bottom-left corner */
const DEFAULT_POSITION: AvatarPosition = { x: 24, y: 24 };

/** Minimum distance from viewport edges */
const EDGE_PADDING = 8;

/** Threshold in px to consider a drag vs click */
const DRAG_THRESHOLD = 5;

function loadPosition(): AvatarPosition {
  try {
    const stored = localStorage.getItem(POSITION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AvatarPosition;
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_POSITION;
}

function savePosition(pos: AvatarPosition): void {
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // ignore
  }
}

/** Clamp position so the element stays within viewport */
function clampToViewport(
  x: number,
  y: number,
  elWidth: number,
  elHeight: number,
): AvatarPosition {
  const maxX = window.innerWidth - elWidth - EDGE_PADDING;
  const maxY = window.innerHeight - elHeight - EDGE_PADDING;
  return {
    x: Math.max(EDGE_PADDING, Math.min(x, maxX)),
    y: Math.max(EDGE_PADDING, Math.min(y, maxY)),
  };
}

interface UseDraggableAvatarOptions {
  /** Width of the draggable element (for bounds) */
  elementWidth?: number;
  /** Height of the draggable element (for bounds) */
  elementHeight?: number;
}

interface UseDraggableAvatarReturn {
  /** Ref to attach to the draggable container element */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Current position (left, bottom from CSS perspective) */
  position: AvatarPosition;
  /** Whether the avatar is currently being dragged */
  isDragging: boolean;
  /** Reset position to default (bottom-left) */
  resetPosition: () => void;
  /** Whether the last interaction was a drag (to suppress click) */
  wasDragged: boolean;
}

/**
 * Hook that provides full drag & drop functionality for the avatar.
 * Supports mouse (desktop) and touch (mobile).
 * Position is persisted to localStorage.
 * Uses CSS left/bottom positioning.
 */
export function useDraggableAvatar(
  options: UseDraggableAvatarOptions = {},
): UseDraggableAvatarReturn {
  const { elementWidth = 120, elementHeight = 120 } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<AvatarPosition>(loadPosition);
  const [isDragging, setIsDragging] = useState(false);
  const wasDraggedRef = useRef(false);
  const [wasDragged, setWasDragged] = useState(false);

  // Refs for tracking drag state without re-renders
  const dragState = useRef({
    active: false,
    startClientX: 0,
    startClientY: 0,
    startPosX: 0,
    startPosY: 0,
    moved: false,
  });

  /** Begin drag from pointer coordinates */
  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      const current = position;
      dragState.current = {
        active: true,
        startClientX: clientX,
        startClientY: clientY,
        startPosX: current.x,
        startPosY: current.y,
        moved: false,
      };
      wasDraggedRef.current = false;
      setWasDragged(false);
    },
    [position],
  );

  /** Update position during drag */
  const moveDrag = useCallback(
    (clientX: number, clientY: number) => {
      const state = dragState.current;
      if (!state.active) return;

      const dx = clientX - state.startClientX;
      // Invert Y because we use CSS bottom
      const dy = -(clientY - state.startClientY);

      const totalMoved = Math.abs(dx) + Math.abs(dy);
      if (!state.moved && totalMoved < DRAG_THRESHOLD) return;

      state.moved = true;

      if (!isDragging) {
        setIsDragging(true);
      }

      const newX = state.startPosX + dx;
      const newY = state.startPosY + dy;
      const clamped = clampToViewport(newX, newY, elementWidth, elementHeight);
      setPosition(clamped);
    },
    [elementWidth, elementHeight, isDragging],
  );

  /** End drag */
  const endDrag = useCallback(() => {
    const state = dragState.current;
    if (!state.active) return;

    if (state.moved) {
      wasDraggedRef.current = true;
      setWasDragged(true);
      savePosition(position);
      // Reset wasDragged after a short delay so click handlers can check it
      setTimeout(() => setWasDragged(false), 100);
    }

    state.active = false;
    state.moved = false;
    setIsDragging(false);
  }, [position]);

  /** Reset to default position */
  const resetPosition = useCallback(() => {
    setPosition(DEFAULT_POSITION);
    savePosition(DEFAULT_POSITION);
  }, []);

  // Mouse event handlers
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only left button
      if (e.button !== 0) return;
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.active) return;
      e.preventDefault();
      moveDrag(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      endDrag();
    };

    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [startDrag, moveDrag, endDrag]);

  // Touch event handlers
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragState.current.active) return;
      if (e.touches.length !== 1) return;
      e.preventDefault(); // prevent scroll while dragging
      const touch = e.touches[0];
      moveDrag(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      endDrag();
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startDrag, moveDrag, endDrag]);

  // Keep position within viewport on resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const clamped = clampToViewport(prev.x, prev.y, elementWidth, elementHeight);
        if (clamped.x !== prev.x || clamped.y !== prev.y) {
          savePosition(clamped);
          return clamped;
        }
        return prev;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [elementWidth, elementHeight]);

  return {
    containerRef,
    position,
    isDragging,
    resetPosition,
    wasDragged,
  };
}
