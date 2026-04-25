'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import logo from './logo.png';

export default function Home() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [minuta, setMinuta] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  
  // Metadata fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [department, setDepartment] = useState('');
  const [participants, setParticipants] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setError('');
    setMinuta('');

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', title);
    formData.append('date', date);
    formData.append('department', department);
    formData.append('participants', participants);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMinuta(data.minuta);
      } else {
        setError(data.details || data.error || 'Algo salió mal al procesar el audio.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(minuta);
    alert('Minuta copiada al portapapeles');
  };

  return (
    <main className="animate-fade">
      <div className="nav-header">
        <button onClick={handleLogout} className="logout-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Cerrar Sesión
        </button>
      </div>
      <header>
        <div className="logo-container">
          <Image src={logo} alt="SGF Logo" width={80} height={40} style={{ objectFit: 'contain' }} />
          <div className="spark-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-blue)' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <h1 className="title">
            <span className="sgf">SGF</span>
            <span className="ia">IA</span>
            <span className="transcripcion">Transcripción</span>
          </h1>
        </div>
        <p className="tagline">
          Generación inteligente de minutas y transcripciones profesionales para Sisprot Global Fiber.
        </p>
      </header>

      <section className="main-card">
        <form onSubmit={handleSubmit}>
          <div 
            className="upload-zone"
            onClick={() => document.getElementById('audio-input').click()}
          >
            <input 
              id="audio-input"
              type="file" 
              accept="audio/*,video/*" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            <div className="upload-icon-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </div>

            <h2 className="upload-title">Sube o Graba tu reunión</h2>
            <p className="upload-subtitle">Arrastra tu video/audio aquí o usa la grabación en vivo</p>

            <div className="button-group">
              <button type="button" className="btn btn-dark">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                Buscar archivo
              </button>
              <button type="button" className="btn btn-orange">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                Grabar en Vivo
              </button>
            </div>

            {file && (
              <div className="file-info-badge">
                Archivo seleccionado: <strong>{file.name}</strong>
              </div>
            )}
            {!file && (
              <div className="file-info-badge">
                MP4, MOV, MP3, WAV (Hasta 500MB)
              </div>
            )}
          </div>

          {/* Metadata Inputs */}
          <div className="metadata-grid">
            <div className="input-group">
              <label>Título de la reunión</label>
              <input 
                type="text" 
                placeholder="Ej. Planificación Trimestral"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Fecha</label>
              <input 
                type="text" 
                placeholder="Ej. 24 de Abril, 2024"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Departamento / Área</label>
              <input 
                type="text" 
                placeholder="Ej. Ingeniería"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Participantes</label>
              <input 
                type="text" 
                placeholder="Ej. Juan, María, Pedro"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
              />
            </div>
          </div>

          <div className="process-btn-container">
            <button 
              type="submit" 
              className="btn btn-process"
              disabled={!file || isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
              {isLoading ? 'Procesando...' : 'Procesar con Inteligencia Artificial'}
            </button>
          </div>
        </form>

        {error && (
          <p style={{ color: '#f87171', marginTop: '1.5rem', textAlign: 'center', fontWeight: '500' }}>{error}</p>
        )}
      </section>

      {minuta && (
        <section className="markdown-results animate-fade">
          <div className="results-header">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Minuta Generada</h2>
            <button onClick={copyToClipboard} className="btn btn-dark" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Copiar Texto
            </button>
          </div>
          <div className="markdown-card">
            <div className="markdown-content">
              <ReactMarkdown>{minuta}</ReactMarkdown>
            </div>
          </div>
        </section>
      )}

      {isLoading && (
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
            Estamos analizando tu archivo. Esto puede tomar un momento...
          </p>
        </div>
      )}

      <footer>
        <p>© 2026 SGF Minutas</p>
      </footer>

      <style jsx>{`
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top: 4px solid var(--accent-orange);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
