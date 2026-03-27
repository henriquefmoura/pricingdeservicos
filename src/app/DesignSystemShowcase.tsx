import React, { useState } from 'react';
import { Sidebar, NavItem, UserRole } from './components/Sidebar';
import { StatusBadge, BadgeStatus } from './components/StatusBadge';
import { Input, CurrencyInput } from './components/Input';
import { Card, HighlightedCard, AISuggestionCard, KPICard, CompactCard } from './components/Card';
import { Logo } from './components/Logo';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';

export default function DesignSystemShowcase() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState<NavItem>('Dashboard');
  const [inputValue, setInputValue] = useState('');
  const [currencyValue, setCurrencyValue] = useState('150.00');

  const allStatuses: BadgeStatus[] = ['Pendente', 'Aprovado', 'Rejeitado', 'Novo', 'Em Andamento'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Sidebar */}
      <Sidebar
        activeItem={activeNavItem}
        userRole="Master"
        userName="João Silva"
        isCollapsed={sidebarCollapsed}
        onItemClick={(item) => setActiveNavItem(item)}
        onLogout={() => alert('Logout clicked')}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ font: 'var(--font-display)', color: 'var(--text-display)', marginBottom: '8px' }}>
            Sistema de Design
          </h1>
          <p style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
            Componentes da plataforma de precificação
          </p>
        </div>

        {/* Logo Section */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ font: 'var(--font-section)', color: 'var(--text-section)', marginBottom: '24px' }}>
            Logo
          </h2>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px', fontWeight: 600 }}>Full Logo</p>
              <div style={{ padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: 'var(--shadow-card-default)' }}>
                <Logo variant="full" />
              </div>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px', fontWeight: 600 }}>Compact Logo</p>
              <div style={{ padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: 'var(--shadow-card-default)' }}>
                <Logo variant="compact" />
              </div>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px', fontWeight: 600 }}>On Dark Background</p>
              <div style={{ padding: '20px', backgroundColor: '#001022', borderRadius: '12px' }}>
                <Logo variant="full" />
              </div>
            </div>
          </div>
        </section>

        {/* Status Badges Section */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ font: 'var(--font-section)', color: 'var(--text-section)', marginBottom: '24px' }}>
            Status Badges
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {allStatuses.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </section>

        {/* Inputs Section */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ font: 'var(--font-section)', color: 'var(--text-section)', marginBottom: '24px' }}>
            Inputs
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Standard Input */}
            <Input
              label="Nome do Serviço"
              placeholder="Digite o nome..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="Este campo é obrigatório"
            />

            {/* Input with Error */}
            <Input
              label="Código"
              placeholder="Ex: 001"
              error="Este código já existe"
            />

            {/* Disabled Input */}
            <Input
              label="Campo Bloqueado"
              value="Não editável"
              disabled
            />

            {/* Currency Input with Margin */}
            <CurrencyInput
              label="Preço de Venda"
              value={currencyValue}
              onValueChange={setCurrencyValue}
              placeholder="0,00"
              showMargin
              costPrice={100}
              helperText="Inclui impostos"
            />
          </div>
        </section>

        {/* KPI Cards Section */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ font: 'var(--font-section)', color: 'var(--text-section)', marginBottom: '24px' }}>
            KPI Cards
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <KPICard
              label="Total de Praças"
              value="27"
              icon={<Target size={20} />}
              iconBgColor="green"
            />
            <KPICard
              label="Aprovações Pendentes"
              value="142"
              icon={<Users size={20} />}
              iconBgColor="amber"
            />
            <KPICard
              label="Receita Estimada"
              value="R$ 2.5M"
              icon={<DollarSign size={20} />}
              iconBgColor="green"
            />
            <KPICard
              label="Margem Média"
              value="32.5%"
              icon={<TrendingUp size={20} />}
              iconBgColor="green"
            />
          </div>
        </section>

        {/* Card Variants Section */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ font: 'var(--font-section)', color: 'var(--text-section)', marginBottom: '24px' }}>
            Card Variants
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Default Card */}
            <Card>
              <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '8px' }}>
                Card Padrão
              </h3>
              <p style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
                Este é um card padrão com hover effect e sombra elevada.
              </p>
            </Card>

            {/* Highlighted Card */}
            <HighlightedCard>
              <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '8px' }}>
                Card Destacado
              </h3>
              <p style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
                Card com borda esquerda verde para destacar conteúdo importante.
              </p>
            </HighlightedCard>

            {/* AI Suggestion Card */}
            <AISuggestionCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#CEDC00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  AI
                </div>
                <h3 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)' }}>
                  Sugestão da IA
                </h3>
              </div>
              <p style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
                Card com fundo e borda pontilhada para sugestões automáticas do sistema.
              </p>
            </AISuggestionCard>
          </div>
        </section>

        {/* Compact Cards Section */}
        <section>
          <h2 style={{ font: 'var(--font-section)', color: 'var(--text-section)', marginBottom: '24px' }}>
            Lista de Serviços (Compact Cards)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((item) => (
              <CompactCard key={item}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ font: 'var(--font-card-title)', color: 'var(--text-card-title)', marginBottom: '4px' }}>
                      Serviço de Instalação #{item}
                    </h4>
                    <p style={{ font: 'var(--font-small)', color: 'var(--text-small)' }}>
                      Código: 00{item} | Praça: São Paulo
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ font: 'var(--font-price)', color: 'var(--text-price)' }}>
                        R$ {(150 + item * 50).toFixed(2)}
                      </p>
                      <p style={{ font: 'var(--font-small)', color: 'var(--text-small)' }}>
                        Margem: {25 + item * 5}%
                      </p>
                    </div>
                    <StatusBadge status={item === 1 ? 'Aprovado' : item === 2 ? 'Pendente' : 'Novo'} />
                  </div>
                </div>
              </CompactCard>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}