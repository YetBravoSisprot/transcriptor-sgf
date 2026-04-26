import { NextResponse } from 'next/server';
import { processAudioForMinuta } from '@/lib/gemini';

// Aumentar el tiempo máximo de ejecución para archivos largos (112 min+)
export const maxDuration = 300; // 5 minutos (Ajustar según plan de hosting)

export async function POST(request) {
  console.log('--- Iniciando procesamiento de audio ---');
  try {
    const formData = await request.formData();
    const file = formData.get('audio');
    const title = formData.get('title');
    const date = formData.get('date');
    const department = formData.get('department');
    const participants = formData.get('participants');

    if (!file) {
      console.warn('Advertencia: No se proporcionó archivo de audio.');
      return NextResponse.json({ error: 'No se proporcionó ningún archivo de audio.' }, { status: 400 });
    }

    console.log(`Recibido archivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Procesar el audio con Gemini
    console.log('Llamando a Gemini para transcripción y minuta...');
    const result = await processAudioForMinuta(buffer, file.type, file.name, {
      title,
      date,
      department,
      participants
    });

    console.log('Procesamiento completado con éxito.');
    return NextResponse.json({ 
      minuta: result.minuta, 
      transcription: result.transcription 
    });
  } catch (error) {
    console.error('Error CRÍTICO en la ruta API:', error);
    return NextResponse.json({ 
      error: 'Hubo un problema al procesar el audio.', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

