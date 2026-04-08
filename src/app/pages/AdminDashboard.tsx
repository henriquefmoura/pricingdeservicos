import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, LogOut, DollarSign, TrendingUp, Package, ListChecks, Search, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuthStore } from '../store/authStore';
import { usePricingStore } from '../store/pricingStore';
import { usePricingCodesStore } from '../store/pricingCodesStore';
import { useMarketResearchStore } from '../store/marketResearchStore';
import { AdminPricingInterface } from './AdminPricingInterface';
import { MarketResearchForm } from '../components/MarketResearchForm';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const data = usePricingStore((state) => state.data);
  const { getPendingCodesCount, codes } = usePricingCodesStore();
  const { initializeMockResearches } = useMarketResearchStore();

  const [codigo, setCodigo] = useState('');
  const [grupo, setGrupo] = useState('');
  const [plaza, setPlaza] = useState('SP');
  const [repasse, setRepasse] = useState('');
  const [venda, setVenda] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'pricing' | 'market' | 'manage'>('pricing');
  const [pricingFilter, setPricingFilter] = useState<'pendentes' | 'precificados'>('pendentes');

  // Todos os cálculos e funções DEVEM vir antes do early return
  const margem = repasse && venda ? (((parseFloat(venda) - parseFloat(repasse)) / parseFloat(venda)) * 100).toFixed(2) : '0.00';
  
  const pendingCodesForPlaza = codes.filter(
    (code) => user?.plaza && !code.prices?.[user.plaza]
  ).length;

  const pricedCodesForPlaza = codes.filter(
    (code) => user?.plaza && !!code.prices?.[user.plaza]
  ).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aqui você adicionaria a lógica para salvar no banco
    console.log('Novo preço adicionado:', {
      codigo,
      grupo,
      plaza,
      repasse: parseFloat(repasse),
      venda: parseFloat(venda),
      margem: parseFloat(margem),
    });

    setSuccessMessage('Preço adicionado com sucesso!');
    
    // Limpar formulário
    setCodigo('');
    setGrupo('');
    setRepasse('');
    setVenda('');
    
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Praças disponíveis (mock)
  const plazas = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE'];

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin') {
      // Se não for admin, redirecionar para sua página
      if (user.role === 'master') navigate('/home');
      if (user.role === 'user') navigate('/dashboard');
    }
  }, [user, navigate]);

  // Inicializar dados mock
  useEffect(() => {
    initializeMockResearches();
  }, [initializeMockResearches]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navigateToPricing = (filter: 'pendentes' | 'precificados') => {
    setActiveTab('pricing');
    setPricingFilter(filter);
  };

  // Agora sim, early return DEPOIS de tudo
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl text-gray-900">Painel Administrativo</h1>
              <p className="text-sm text-gray-600">Bem-vindo, {user.name}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Serviços</p>
                  <p className="text-3xl text-gray-900 mt-1">{data?.length || 0}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg hover:border-orange-300 ring-offset-2 focus-visible:ring-2 focus-visible:ring-orange-400"
            onClick={() => navigateToPricing('pendentes')}
            tabIndex={0}
            role="button"
            aria-label="Ver códigos pendentes"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigateToPricing('pendentes');
              }
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-3xl text-orange-600 mt-1">{pendingCodesForPlaza}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg hover:border-green-300 ring-offset-2 focus-visible:ring-2 focus-visible:ring-green-400"
            onClick={() => navigateToPricing('precificados')}
            tabIndex={0}
            role="button"
            aria-label="Ver códigos precificados"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigateToPricing('precificados');
              }
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Precificados</p>
                  <p className="text-3xl text-green-600 mt-1">{pricedCodesForPlaza}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Praças Ativas</p>
                  <p className="text-3xl text-gray-900 mt-1">27</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Margem Média</p>
                  <p className="text-3xl text-gray-900 mt-1">38%</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'pricing' ? 'default' : 'outline'}
              onClick={() => setActiveTab('pricing')}
              className="gap-2"
            >
              <ListChecks className="w-4 h-4" />
              Precificar Códigos
              {pendingCodesForPlaza > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingCodesForPlaza}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'market' ? 'default' : 'outline'}
              onClick={() => setActiveTab('market')}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              Pesquisa de Mercado
            </Button>
            <Button
              variant={activeTab === 'manage' ? 'default' : 'outline'}
              onClick={() => setActiveTab('manage')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Preço Manual
            </Button>
          </div>
        </div>

        {/* Interface de Precificação de Códigos */}
        {activeTab === 'pricing' && <AdminPricingInterface initialFilter={pricingFilter} />}

        {/* Formulário de Pesquisa de Mercado */}
        {activeTab === 'market' && <MarketResearchForm />}

        {/* Formulário de Adicionar Preço Manual */}
        {activeTab === 'manage' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Adicionar Novo Preço
              </CardTitle>
              <CardDescription>
                Cadastre preços de venda, repasse e margem para os serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">{successMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Código do Serviço */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Código do Serviço *
                    </label>
                    <input
                      type="text"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      placeholder="Ex: SRV001"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Grupo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Grupo de Serviço *
                    </label>
                    <input
                      type="text"
                      value={grupo}
                      onChange={(e) => setGrupo(e.target.value)}
                      placeholder="Ex: Manutenção"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Praça */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Praça *
                    </label>
                    <select
                      value={plaza}
                      onChange={(e) => setPlaza(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {plazas.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Valor de Repasse */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Valor de Repasse (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={repasse}
                      onChange={(e) => setRepasse(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Valor de Venda */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Valor de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={venda}
                      onChange={(e) => setVenda(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Margem (Calculada) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Margem Calculada (%)
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <Badge variant="outline" className={parseFloat(margem) > 30 ? 'text-green-600 border-green-600' : 'text-orange-600 border-orange-600'}>
                        {margem}%
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCodigo('');
                      setGrupo('');
                      setRepasse('');
                      setVenda('');
                    }}
                  >
                    Limpar
                  </Button>
                  <Button type="submit" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Preço
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Informação sobre integração futura */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Nota:</strong> Atualmente em modo demonstração. A integração com banco de dados será implementada em breve.
          </p>
        </div>
      </div>
    </div>
  );
}