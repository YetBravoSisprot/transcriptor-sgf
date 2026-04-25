'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import logo from './logo.png';

export default function Home() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [minuta, setMinuta] = useState('');
  const [transcription, setTranscription] = useState('');
  const [activeTab, setActiveTab] = useState('minuta');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const router = useRouter();
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

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
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [router]);

  const startRecording = async () => {
    try {
      // 1. Obtener audio del sistema/pestaña (para escuchar a los demás)
      // Nota: El usuario debe marcar "Compartir audio" en el diálogo del navegador
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Necesario para que aparezca la opción de compartir audio
        audio: true
      });

      // 2. Obtener audio del micrófono (para escucharte a ti)
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 3. Mezclar ambos audios usando AudioContext
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();

      const micSource = audioContext.createMediaStreamSource(micStream);
      const screenSource = audioContext.createMediaStreamSource(screenStream);

      // Conectar ambos al destino común
      micSource.connect(destination);
      screenSource.connect(destination);

      // El stream final contiene ambos audios
      const combinedStream = destination.stream;

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordedFile = new File([audioBlob], `reunion_${Date.now()}.webm`, { type: 'audio/webm' });
        setFile(recordedFile);
        
        // Detener todos los tracks
        [screenStream, micStream].forEach(s => s.getTracks().forEach(t => t.stop()));
        audioContext.close();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setError('');

      // Si el usuario deja de compartir pantalla manualmente, detener la grabación
      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

    } catch (err) {
      setError('Para grabar la reunión completa, debes aceptar compartir pantalla y marcar "Compartir audio".');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setError('');
    setMinuta('');
    setTranscription('');

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
        setTranscription(data.transcription);
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
    const text = activeTab === 'minuta' ? minuta : transcription;
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  const getFilename = () => {
    const cleanTitle = title.toUpperCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return `MINUTA_${cleanTitle}_${date}`;
  };

  const buildExportHtml = () => {
    return `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0a192f; margin-bottom: 5px;">SISPROT GLOBAL FIBER</h1>
          <p style="color: #666; text-transform: uppercase; letter-spacing: 2px; font-size: 12px;">Acta de Reunión Corporativa</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="margin-top: 0; color: #0a192f;">${title}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0;"><strong>Fecha:</strong> ${date}</td>
              <td style="padding: 5px 0;"><strong>Área:</strong> ${department}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 5px 0;"><strong>Participantes:</strong> ${participants}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 40px;">
          <h3 style="border-bottom: 2px solid #f59e0b; padding-bottom: 5px; color: #0a192f;">MINUTA ESTRUCTURADA</h3>
          <div style="line-height: 1.6; white-space: pre-wrap;">${minuta}</div>
        </div>

        <div>
          <h3 style="border-bottom: 2px solid #5499c7; padding-bottom: 5px; color: #0a192f;">TRANSCRIPCIÓN COMPLETA</h3>
          <div style="line-height: 1.5; font-size: 13px; color: #444; white-space: pre-wrap;">${transcription}</div>
        </div>
        
        <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} Sisprot Global Fiber - Generado por SGF IA Transcripción
        </div>
      </div>
    `;
  };

  const downloadWord = () => {
    const htmlBody = buildExportHtml();
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'></head>
      <body>${htmlBody}</body>
      </html>
    `;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getFilename()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const htmlContent = buildExportHtml();
    
    // Crear un elemento temporal para el renderizado
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '800px';
    tempDiv.style.padding = '0';
    tempDiv.style.margin = '0';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);

    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      await doc.html(tempDiv, {
        callback: (d) => {
          d.save(`${getFilename()}.pdf`);
          document.body.removeChild(tempDiv);
        },
        x: 0,
        y: 0,
        width: 595, // Ancho de A4 en pt
        windowWidth: 800
      });
    } catch (e) {
      console.error(e);
      alert("Error al generar PDF");
      document.body.removeChild(tempDiv);
    }
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
          <div className="upload-zone">
            <div className="upload-icon-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </div>

            <h2 className="upload-title">Graba tu reunión</h2>
            <p className="upload-subtitle">Captura audio presencial o de reuniones virtuales (Meet, Discord, etc.)</p>

            <div className="button-group" style={{ justifyContent: 'center' }}>
              <button 
                type="button" 
                className={`btn ${isRecording ? 'btn-red' : 'btn-orange'}`}
                onClick={isRecording ? stopRecording : startRecording}
                style={{ minWidth: '240px' }}
              >
                {isRecording ? (
                  <>
                    <div className="recording-dot"></div>
                    Detener Grabación ({formatTime(recordingTime)})
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                    Iniciar Grabación en Vivo
                  </>
                )}
              </button>
            </div>

            {file && (
              <div className="file-info-badge">
                Grabación lista para procesar: <strong>{file.name}</strong>
              </div>
            )}
          </div>

          {/* Metadata Inputs */}
          <div className="metadata-grid">
            <div className="input-group">
              <label>Título de la reunión *</label>
              <input 
                type="text" 
                placeholder="Ej. Planificación Trimestral"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Fecha *</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Departamento / Área *</label>
              <input 
                type="text" 
                placeholder="Ej. Ingeniería"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Participantes *</label>
              <input 
                type="text" 
                placeholder="Ej. Juan, María, Pedro"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                required
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

      {(minuta || transcription) && (
        <section className="results-container animate-fade">
          <div className="tabs-header">
            <button 
              type="button"
              className={`tab-btn ${activeTab === 'minuta' ? 'active' : ''}`}
              onClick={() => setActiveTab('minuta')}
            >
              Minuta Estructurada
            </button>
            <button 
              type="button"
              className={`tab-btn ${activeTab === 'transcripcion' ? 'active' : ''}`}
              onClick={() => setActiveTab('transcripcion')}
            >
              Transcripción Completa
            </button>
          </div>

          <div className="results-header">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              {activeTab === 'minuta' ? 'Minuta Generada' : 'Transcripción del Audio'}
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button"
                onClick={downloadWord} 
                className="btn btn-dark" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                Word
              </button>
              <button 
                type="button"
                onClick={downloadPdf} 
                className="btn btn-dark" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                PDF
              </button>
              <button 
                type="button"
                onClick={() => {
                  const text = activeTab === 'minuta' ? minuta : transcription;
                  navigator.clipboard.writeText(text);
                  alert('Copiado al portapapeles');
                }} 
                className="btn btn-dark" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Copiar Texto
              </button>
            </div>
          </div>
          <div className="markdown-card">
            <div className="markdown-content">
              <ReactMarkdown>{activeTab === 'minuta' ? minuta : transcription}</ReactMarkdown>
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
