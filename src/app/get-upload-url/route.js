import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { fileName, fileSize, fileType } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY no configurada en Vercel.' }, { status: 500 });
    }

    // 1. Iniciar subida resumible en Google AI File API
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': fileSize.toString(),
        'X-Goog-Upload-Header-Content-Type': fileType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: fileName } })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error al iniciar sesión de subida en Google');
    }

    // La URL de destino real viene en el encabezado 'x-goog-upload-url'
    const targetUrl = response.headers.get('x-goog-upload-url');

    return NextResponse.json({ uploadUrl: targetUrl });

  } catch (error) {
    console.error('Error generando URL de subida:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
