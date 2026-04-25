'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo from '../logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email.endsWith('@sisprotgf.com')) {
      setError('Solo se permiten correos del dominio @sisprotgf.com');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Simulación de login exitoso
    localStorage.setItem('user', JSON.stringify({ email }));
    router.push('/');
  };

  return (
    <div className="login-page">
      <div className="login-card animate-fade">
        <div className="login-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Image src={logo} alt="SGF Logo" width={100} height={50} style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="login-title">
            <span className="sgf-white">SGF</span>
            <span className="acceso-gradient">Acceso</span>
          </h1>
        </div>

        <p className="login-subtitle">Ingresa con tu cuenta corporativa</p>

        <form className="login-form" onSubmit={handleLogin}>
          <input 
            type="email" 
            className="login-input" 
            placeholder="usuario@sisprotgf.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            className="login-input" 
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" className="btn-login">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
            Entrar / Registrarse
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        <div className="login-footer">
          EXCLUSIVO PARA PERSONAL DE SISPROT<br />GLOBAL FIBER
        </div>
      </div>
    </div>
  );
}
