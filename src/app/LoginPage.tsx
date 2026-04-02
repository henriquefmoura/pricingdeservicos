import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, User } from 'lucide-react';
import { Input } from './components/Input';
import { useAuthStore } from './store/authStore';

// Credenciais de teste
const testCredentials = [
  { role: 'Master', email: 'master@empresa.com', password: 'master123', name: 'João Silva (Master)' },
  { role: 'Admin SP', email: 'admin.sp@empresa.com', password: 'admin123', name: 'Maria Santos (Admin SP)' },
  { role: 'Admin RJ', email: 'admin.rj@empresa.com', password: 'admin123', name: 'Pedro Costa (Admin RJ)' },
  { role: 'Usuário SP', email: 'usuario.sp@empresa.com', password: 'user123', name: 'Carlos Oliveira (User SP)' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'master') {
        navigate('/governance', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simular delay de autenticação
    setTimeout(() => {
      const success = login(email, password);
      
      if (success) {
        // Redireciona baseado no role do usuário
        const loggedUser = useAuthStore.getState().user;
        if (loggedUser?.role === 'master') {
          navigate('/governance');
        } else if (loggedUser?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Email ou senha incorretos');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleQuickLogin = (credential: typeof testCredentials[0]) => {
    setEmail(credential.email);
    setPassword(credential.password);
    setError('');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* LEFT PANEL - 60% */}
      <div
        style={{
          width: '60%',
          backgroundColor: '#001022',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '60px',
        }}
      >
        {/* Logo at Top */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            left: '60px',
          }}
        >
          <div style={{ transform: 'scale(1.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#78BE20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.5px',
                  }}
                >
                  LM
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    lineHeight: 1.1,
                    letterSpacing: '-0.3px',
                  }}
                >
                  LEROY MERLIN
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#78BE20',
                    lineHeight: 1.1,
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                  }}
                >
                  Instalações e Reformas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Vertically Centered */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '560px',
            width: '100%',
          }}
        >
          {/* Illustration */}
          <div
            style={{
              width: '400px',
              height: '320px',
              marginBottom: '48px',
              position: 'relative',
            }}
          >
            {/* Bathroom Renovation Illustration */}
            <svg
              viewBox="0 0 400 320"
              style={{ width: '100%', height: '100%' }}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Bathroom Scene - Line Art */}
              
              {/* Back Wall */}
              <rect x="50" y="40" width="300" height="220" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
              
              {/* Floor Tiles */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line
                  key={`floor-${i}`}
                  x1={50 + i * 50}
                  y1="260"
                  x2={50 + i * 50}
                  y2="290"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
              ))}
              
              {/* Sink - Green Accent */}
              <rect x="80" y="180" width="80" height="60" stroke="#78BE20" strokeWidth="2.5" fill="none" />
              <circle cx="120" cy="200" r="8" fill="#78BE20" />
              <line x1="120" y1="150" x2="120" y2="180" stroke="#78BE20" strokeWidth="2" />
              
              {/* Mirror */}
              <rect x="70" y="60" width="100" height="80" stroke="#FFFFFF" strokeWidth="2" opacity="0.7" />
              <circle cx="120" cy="100" r="25" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.5" />
              
              {/* Toilet */}
              <ellipse cx="280" cy="240" rx="30" ry="20" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
              <rect x="270" y="180" width="20" height="60" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
              
              {/* Shower Head - Green Accent */}
              <circle cx="300" cy="80" r="15" stroke="#78BE20" strokeWidth="2.5" fill="none" />
              <line x1="300" y1="95" x2="300" y2="200" stroke="#78BE20" strokeWidth="1.5" opacity="0.6" strokeDasharray="3 3" />
              
              {/* Tiles Pattern */}
              {[0, 1, 2, 3, 4].map((row) =>
                [0, 1, 2, 3, 4, 5, 6].map((col) => (
                  <rect
                    key={`tile-${row}-${col}`}
                    x={55 + col * 42}
                    y={45 + row * 42}
                    width="38"
                    height="38"
                    stroke="#FFFFFF"
                    strokeWidth="0.5"
                    opacity="0.2"
                  />
                ))
              )}
              
              {/* Tools - Construction Theme */}
              <g opacity="0.5">
                {/* Wrench */}
                <path
                  d="M 200 250 L 220 230 L 225 235 L 205 255 Z"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  fill="none"
                />
                {/* Screwdriver */}
                <line x1="240" y1="255" x2="260" y2="235" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="263" cy="232" r="3" fill="#FFFFFF" />
              </g>
            </svg>
          </div>

          {/* Tagline */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '28px',
                fontWeight: 300,
                color: '#FFFFFF',
                lineHeight: '1.4',
                marginBottom: '8px',
              }}
            >
              Precifique com inteligência.
            </p>
            <p
              style={{
                fontSize: '28px',
                fontWeight: 300,
                color: '#FFFFFF',
                lineHeight: '1.4',
              }}
            >
              Instale com confiança.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#78BE20',
              textAlign: 'center',
              letterSpacing: '0.5px',
            }}
          >
            Leroy Merlin Instalações & Reformas
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - 40% */}
      <div
        style={{
          width: '40%',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#001022',
                marginBottom: '8px',
                lineHeight: 1.3,
              }}
            >
              Bem-vindo de volta
            </h1>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 400,
                color: '#6B7280',
                lineHeight: 1.5,
              }}
            >
              Acesse sua praça
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '14px', color: '#DC2626', fontWeight: 500 }}>
                  ⚠️ {error}
                </span>
              </div>
            )}

            {/* Email Input */}
            <Input
              type="email"
              label="Email"
              placeholder="seu.email@leroymerlin.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />

            {/* Password Input */}
            <div style={{ position: 'relative' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Senha"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '38px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isLoading ? '#9CA3AF' : '#78BE20',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '8px',
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#6AA91C';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#78BE20';
                }
              }}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>

            {/* Test Credentials Card */}
            <div
              style={{
                marginTop: '24px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#92400E',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                🔓 Credenciais de Teste
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {testCredentials.map((credential) => (
                  <button
                    key={credential.email}
                    type="button"
                    onClick={() => handleQuickLogin(credential)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #FCD34D',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFBEB';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#001022' }}>
                        {credential.role}
                      </span>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>
                        {credential.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'monospace' }}>
                      {credential.email}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
                      Senha: {credential.password}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Help Text */}
            <p
              style={{
                fontSize: '12px',
                color: '#9CA3AF',
                textAlign: 'center',
                marginTop: '12px',
                lineHeight: 1.5,
              }}
            >
              Dúvidas? Fale com o coordenador da sua praça.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}