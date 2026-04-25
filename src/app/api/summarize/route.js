import { NextResponse } from 'next/server';
import { processAudioForMinuta } from '@/lib/gemini';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio');
    const title = formData.get('title');
    const date = formData.get('date');
    const department = formData.get('department');
    const participants = formData.get('participants');

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo de audio.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Procesar el audio con Gemini
    const result = await processAudioForMinuta(buffer, file.type, file.name, {
      title,
      date,
      department,
      participants
    });

    return NextResponse.json({ 
      minuta: result.minuta, 
      transcription: result.transcription 
    });
  } catch (error) {
    console.error('Error procesando el audio:', error);
    return NextResponse.json({ 
      error: 'Hubo un problema al procesar el audio.', 
      details: error.message 
    }, { status: 500 });
  }
}
