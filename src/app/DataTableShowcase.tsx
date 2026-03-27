import React, { useState } from 'react';
import { DataTable, Column, VariationCell } from './components/DataTable';
import { StatusBadge, BadgeStatus } from './components/StatusBadge';

interface PriceData {
  id: string;
  serviceCode: string;
  serviceName: string;
  plaza: string;
  currentPrice: number;
  previousPrice: number;
  variation: number;
  variationType: 'positive' | 'negative' | 'zero' | 'new';
  status: BadgeStatus;
  margin: number;
}

const sampleData: PriceData[] = [
  {
    id: '1',
    serviceCode: '001',
    serviceName: 'Instalação de Torneira',
    plaza: 'São Paulo',
    currentPrice: 150.0,
    previousPrice: 140.0,
    variation: 7.1,
    variationType: 'positive',
    status: 'Aprovado',
    margin: 32.5,
  },
  {
    id: '2',
    serviceCode: '002',
    serviceName: 'Instalação de Chuveiro Elétrico',
    plaza: 'Rio de Janeiro',
    currentPrice: 280.0,
    previousPrice: 300.0,
    variation: -6.7,
    variationType: 'negative',
    status: 'Pendente',
    margin: 28.0,
  },
  {
    id: '3',
    serviceCode: '003',
    serviceName: 'Instalação de Vaso Sanitário',
    plaza: 'Belo Horizonte',
    currentPrice: 350.0,
    previousPrice: 350.0,
    variation: 0,
    variationType: 'zero',
    status: 'Aprovado',
    margin: 35.2,
  },
  {
    id: '4',
    serviceCode: '004',
    serviceName: 'Troca de Registro',
    plaza: 'Curitiba',
    currentPrice: 120.0,
    previousPrice: 0,
    variation: 0,
    variationType: 'new',
    status: 'Novo',
    margin: 40.0,
  },
  {
    id: '5',
    serviceCode: '005',
    serviceName: 'Instalação de Pia',
    plaza: 'Porto Alegre',
    currentPrice: 200.0,
    previousPrice: 185.0,
    variation: 8.1,
    variationType: 'positive',
    status: 'Em Andamento',
    margin: 30.5,
  },
  {
    id: '6',
    serviceCode: '006',
    serviceName: 'Reparo em Encanamento',
    plaza: 'Brasília',
    currentPrice: 180.0,
    previousPrice: 195.0,
    variation: -7.7,
    variationType: 'negative',
    status: 'Rejeitado',
    margin: 22.0,
  },
  {
    id: '7',
    serviceCode: '007',
    serviceName: 'Instalação de Box',
    plaza: 'Fortaleza',
    currentPrice: 450.0,
    previousPrice: 420.0,
    variation: 7.1,
    variationType: 'positive',
    status: 'Aprovado',
    margin: 38.5,
  },
];

export default function DataTableShowcase() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showEmpty, setShowEmpty] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const columns: Column<PriceData>[] = [
    {
      key: 'serviceCode',
      label: 'Código',
      align: 'left',
    },
    {
      key: 'serviceName',
      label: 'Serviço',
      align: 'left',
    },
    {
      key: 'plaza',
      label: 'Praça',
      align: 'left',
    },
    {
      key: 'currentPrice',
      label: 'Preço Atual',
      align: 'right',
      render: (value) => (
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          R$ {value.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'variation',
      label: 'Variação',
      align: 'center',
      render: (value, row) => (
        <VariationCell value={value} type={row.variationType} />
      ),
    },
    {
      key: 'margin',
      label: 'Margem',
      align: 'right',
      render: (value) => {
        const color = value > 30 ? '#065F46' : value >= 15 ? '#92400E' : '#991B1B';
        return (
          <span style={{ fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
            {value.toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  const totalPages = Math.ceil(sampleData.length / pageSize);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '40px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ font: 'var(--font-display)', color: 'var(--text-display)', marginBottom: '8px' }}>
            Data Table Component
          </h1>
          <p style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
            Tabela de dados reutilizável com variações, paginação e estados
          </p>
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-card-default)',
          }}
        >
          <button
            onClick={() => {
              setShowEmpty(false);
              setShowLoading(false);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1.5px solid #D1D5DB',
              backgroundColor: !showEmpty && !showLoading ? '#78BE20' : '#FFFFFF',
              color: !showEmpty && !showLoading ? '#FFFFFF' : '#001022',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Populated State
          </button>
          <button
            onClick={() => {
              setShowEmpty(false);
              setShowLoading(true);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1.5px solid #D1D5DB',
              backgroundColor: showLoading ? '#78BE20' : '#FFFFFF',
              color: showLoading ? '#FFFFFF' : '#001022',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Loading State
          </button>
          <button
            onClick={() => {
              setShowEmpty(true);
              setShowLoading(false);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1.5px solid #D1D5DB',
              backgroundColor: showEmpty ? '#78BE20' : '#FFFFFF',
              color: showEmpty ? '#FFFFFF' : '#001022',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Empty State
          </button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={showEmpty ? [] : sampleData}
          keyExtractor={(row) => row.id}
          isLoading={showLoading}
          emptyState={{
            title: 'Nenhum dado encontrado',
            description: 'Não há serviços cadastrados para exibir. Comece fazendo o upload de uma planilha.',
            action: {
              label: 'Fazer Upload',
              onClick: () => alert('Upload clicked!'),
            },
          }}
          pagination={{
            currentPage,
            totalPages,
            pageSize,
            onPageChange: (page) => setCurrentPage(page),
            onPageSizeChange: (size) => {
              setPageSize(size);
              setCurrentPage(1);
            },
          }}
          onRowClick={(row) => console.log('Row clicked:', row)}
        />

        {/* Legend */}
        <div
          style={{
            marginTop: '32px',
            padding: '24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-card-default)',
          }}
        >
          <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '16px' }}>
            Variação Types
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <VariationCell value={7.5} type="positive" />
              <span style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
                Positive - Preço aumentou em relação ao anterior
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <VariationCell value={-5.2} type="negative" />
              <span style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
                Negative - Preço diminuiu em relação ao anterior
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <VariationCell value={0} type="zero" />
              <span style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
                Zero - Preço permaneceu o mesmo
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <VariationCell value={0} type="new" />
              <span style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
                New - Serviço novo sem preço anterior
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
