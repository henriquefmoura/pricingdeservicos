import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuthStore } from '../store/authStore';

export function Login() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'master') {
        navigate('/home', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await login(email, password);
    
    if (success) {
      // Redireciona baseado no role do usuário
      const loggedUser = useAuthStore.getState().user;
      if (loggedUser?.role === 'master') {
        navigate('/home');
      } else if (loggedUser?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError('Email ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Plataforma de Precificação</CardTitle>
          <CardDescription className="text-center">
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              <LogIn className="w-4 h-4 mr-2" />
              Entrar
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">👤 Credenciais de Teste:</p>
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <p className="font-medium text-gray-800">Master (Análises e Upload):</p>
                <p>Email: master@empresa.com | Senha: master123</p>
              </div>
              <div className="pt-2 border-t border-gray-300">
                <p className="font-medium text-gray-800">Admins por Praça (Precificação):</p>
                <p>Email: admin.sp@empresa.com | Senha: admin123 (SP)</p>
                <p>Email: admin.rj@empresa.com | Senha: admin123 (RJ)</p>
                <p>Email: admin.mg@empresa.com | Senha: admin123 (MG)</p>
                <p className="text-gray-500 italic mt-1">...e outras praças (PR, SC, RS, BA, PE, CE)</p>
              </div>
              <div className="pt-2 border-t border-gray-300">
                <p className="font-medium text-gray-800 mb-1">Usuários (Aprovação de Preços Replicados):</p>
                <p>Email: usuario.sp@empresa.com | Senha: user123 (SP)</p>
                <p>Email: usuario.rj@empresa.com | Senha: user123 (RJ)</p>
                <p>Email: usuario.mg@empresa.com | Senha: user123 (MG) ⭐</p>
                <p>Email: usuario.pr@empresa.com | Senha: user123 (PR) ⭐</p>
                <p>Email: usuario.sc@empresa.com | Senha: user123 (SC) ⭐</p>
                <p className="text-gray-500 italic mt-1">⭐ Praças que recebem replicação de SP</p>
                <p className="text-gray-500 italic">...também RS, BA</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}