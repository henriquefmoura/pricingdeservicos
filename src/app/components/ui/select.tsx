import * as React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  value: '',
  onValueChange: () => {},
  isOpen: false,
  setIsOpen: () => {},
});

export function Select({ value = '', onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(value);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value: internalValue, onValueChange: handleValueChange, isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={`flex items-center justify-between w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {children}
      <ChevronDown className="w-4 h-4 text-gray-500" />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext);
  return <span className={value ? 'text-gray-900' : 'text-gray-500'}>{value || placeholder}</span>;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto ${className}`}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className = '' }: SelectItemProps) {
  const { value: selectedValue, onValueChange } = React.useContext(SelectContext);
  const isSelected = value === selectedValue;

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
        isSelected ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'
      } ${className}`}
    >
      {children}
    </button>
  );
}
