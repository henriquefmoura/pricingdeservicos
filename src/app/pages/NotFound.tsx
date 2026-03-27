import { useNavigate } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-blue-600">404</h1>
          <h2 className="text-3xl text-gray-900 mt-4 mb-2">Página não encontrada</h2>
          <p className="text-gray-600">A página que você está procurando não existe.</p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button onClick={() => navigate('/')} className="gap-2">
            <Home className="w-4 h-4" />
            Ir para Login
          </Button>
        </div>
      </div>
    </div>
  );
}
