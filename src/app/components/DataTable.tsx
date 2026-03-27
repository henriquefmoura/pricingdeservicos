import React, { ReactNode, useState } from 'react';
import { ArrowUp, ArrowDown, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

// Types
export interface Column<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  isLoading?: boolean;
  emptyState?: {
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  onRowClick?: (row: T) => void;
  className?: string;
}

// Variation Cell Components
export function VariationCell({ value, type }: { value: number; type: 'positive' | 'negative' | 'zero' | 'new' }) {
  if (type === 'new') {
    return <StatusBadge status="Novo" />;
  }

  const Icon = type === 'positive' ? ArrowUp : type === 'negative' ? ArrowDown : Star;
  const color = type === 'positive' ? '#78BE20' : type === 'negative' ? '#DA291C' : '#3B82F6';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Icon size={16} style={{ color }} />
      <span style={{ fontWeight: 700, color }}>
        {type === 'zero' ? '0%' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
      </span>
    </div>
  );
}

// Loading Skeleton Row
function SkeletonRow({ columnCount }: { columnCount: number }) {
  return (
    <tr style={{ height: '52px', borderBottom: '1px solid #F1F5F0' }}>
      {Array.from({ length: columnCount }).map((_, index) => (
        <td key={index} style={{ padding: '0 16px' }}>
          <div
            style={{
              height: '16px',
              backgroundColor: '#E5E7EB',
              borderRadius: '4px',
              width: index === 0 ? '80%' : '60%',
              animation: 'shimmer 1.5s infinite',
              backgroundImage: 'linear-gradient(90deg, #E5E7EB 0%, #F3F4F6 50%, #E5E7EB 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// Empty State
function EmptyState({ title, description, action }: NonNullable<DataTableProps['emptyState']>) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
      }}
    >
      {/* Empty Illustration */}
      <div
        style={{
          width: '120px',
          height: '120px',
          marginBottom: '24px',
          borderRadius: '50%',
          backgroundColor: '#F0FDF4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '3px dashed #D1D5DB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            fontSize: '32px',
          }}
        >
          📋
        </div>
      </div>

      <h3
        style={{
          font: 'var(--font-card-title)',
          color: 'var(--text-card-title)',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            font: 'var(--font-body)',
            color: 'var(--text-body)',
            marginBottom: '24px',
          }}
        >
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#78BE20',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#6AA91C';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#78BE20';
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: NonNullable<DataTableProps['pagination']>) {
  const maxVisiblePages = 5;
  const halfVisible = Math.floor(maxVisiblePages / 2);

  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 0',
        borderTop: '1px solid #F1F5F0',
      }}
    >
      {/* Page Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>Exibir</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1.5px solid #D1D5DB',
            fontSize: '13px',
            color: '#001022',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
          <option value={100}>100 por página</option>
        </select>
      </div>

      {/* Page Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: currentPage === 1 ? '#D1D5DB' : '#4B5563',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            if (currentPage !== 1) {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Numbers */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              minWidth: '32px',
              height: '32px',
              padding: '0 8px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: page === currentPage ? '#78BE20' : 'transparent',
              color: page === currentPage ? '#FFFFFF' : '#4B5563',
              fontSize: '13px',
              fontWeight: page === currentPage ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              if (page !== currentPage) {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
              }
            }}
            onMouseOut={(e) => {
              if (page !== currentPage) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {page}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: currentPage === totalPages ? '#D1D5DB' : '#4B5563',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            if (currentPage !== totalPages) {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// Main DataTable Component
export function DataTable<T = any>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyState,
  pagination,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const [hoveredRow, setHoveredRow] = useState<string | number | null>(null);

  const isEmpty = !isLoading && data.length === 0;

  return (
    <div className={className}>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>

      <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: 'var(--shadow-card-default)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {/* Header */}
          <thead
            style={{
              position: 'sticky',
              top: 0,
              backgroundColor: '#F8FAFC',
              zIndex: 10,
            }}
          >
            <tr style={{ height: '52px' }}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    padding: '0 16px',
                    textAlign: column.align || 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#001022',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '2px solid #E5E7EB',
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {/* Loading State */}
            {isLoading &&
              Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} columnCount={columns.length} />
              ))}

            {/* Populated State */}
            {!isLoading &&
              !isEmpty &&
              data.map((row) => {
                const rowKey = keyExtractor(row);
                const isHovered = hoveredRow === rowKey;

                return (
                  <tr
                    key={rowKey}
                    onMouseEnter={() => setHoveredRow(rowKey)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => onRowClick?.(row)}
                    style={{
                      height: '52px',
                      borderBottom: '1px solid #F1F5F0',
                      backgroundColor: isHovered ? '#F0FDF4' : 'transparent',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 150ms ease',
                    }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        style={{
                          padding: '0 16px',
                          textAlign: column.align || 'left',
                          fontSize: '14px',
                          color: '#001022',
                        }}
                      >
                        {column.render ? column.render((row as Record<string, unknown>)[column.key], row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Empty State */}
        {isEmpty && emptyState && <EmptyState {...emptyState} />}
      </div>

      {/* Pagination */}
      {pagination && !isEmpty && !isLoading && <Pagination {...pagination} />}
    </div>
  );
}
