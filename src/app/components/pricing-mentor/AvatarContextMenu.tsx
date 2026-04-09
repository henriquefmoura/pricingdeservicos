import { useState, useRef, useEffect } from 'react';
import {
  Minimize2,
  Maximize2,
  Pause,
  Play,
  Settings,
} from 'lucide-react';

interface AvatarContextMenuProps {
  onToggleMinimize: () => void;
  isMinimized: boolean;
  onToggleAnimations: () => void;
  animationsEnabled: boolean;
}

/**
 * Context menu for the avatar. Opens on long-press or via a small gear icon.
 * Provides controls: reset position, minimize, toggle animations.
 */
export function AvatarContextMenu({
  onToggleMinimize,
  isMinimized,
  onToggleAnimations,
  animationsEnabled,
}: AvatarContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const menuItems = [
    {
      label: isMinimized ? 'Expandir avatar' : 'Minimizar avatar',
      icon: isMinimized ? Maximize2 : Minimize2,
      onClick: () => {
        onToggleMinimize();
        setIsOpen(false);
      },
    },
    {
      label: animationsEnabled ? 'Desativar animações' : 'Ativar animações',
      icon: animationsEnabled ? Pause : Play,
      onClick: () => {
        onToggleAnimations();
        setIsOpen(false);
      },
    },
  ];

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Gear trigger button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'opacity 0.2s, transform 0.2s',
          opacity: 0.6,
          padding: 0,
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.opacity = '0.6';
        }}
        aria-label="Menu do avatar"
        title="Opções do PedroII jr"
      >
        <Settings size={12} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
            border: '1px solid #E5E7EB',
            padding: '6px',
            minWidth: '180px',
            zIndex: 10000,
            animation: 'avatarMenuSlideIn 0.15s ease-out',
          }}
        >
          <style>{`
            @keyframes avatarMenuSlideIn {
              from { opacity: 0; transform: translateX(-50%) translateY(4px); }
              to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <Icon size={14} style={{ color: '#6B7280', flexShrink: 0 }} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
