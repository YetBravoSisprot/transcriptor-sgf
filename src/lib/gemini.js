import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import path from "path";
import os from "os";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

export async function processAudioForMinuta(audioBufferOrUri, mimeType, fileName, metadata = {}) {
  const { title, date, department, participants } = metadata;

  let fileUri = null;
  let fileNameOnAI = null;
  let tempPath = null;

  try {
    if (typeof audioBufferOrUri === 'string' && audioBufferOrUri.startsWith('https://')) {
      // Caso 1: Ya se subió desde el cliente (URI directa)
      fileUri = audioBufferOrUri;
      console.log(`[Gemini] Usando URI de audio pre-subida: ${fileUri}`);
    } else {
      // Caso 2: Buffer de audio (Subida tradicional)
      const audioBuffer = audioBufferOrUri;
      const ext = path.extname(fileName) || '.mp3';
      tempPath = path.join(os.tmpdir(), `upload_${Date.now()}${ext}`);
      console.log(`[Gemini] Guardando archivo temporal en: ${tempPath}`);
      fs.writeFileSync(tempPath, audioBuffer);

      console.log(`[Gemini] Subiendo archivo a File API (${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB)...`);
      const uploadResult = await fileManager.uploadFile(tempPath, {
        mimeType,
        displayName: fileName,
      });

      fileUri = uploadResult.file.uri;
      fileNameOnAI = uploadResult.file.name;
      console.log(`[Gemini] Audio subido correctamente: ${fileUri}`);
    }

    // 3. Esperar a que el archivo esté procesado (Solo si tenemos el nombre del archivo en AI)
    // Si solo tenemos el URI, intentamos procesar directamente, pero es mejor verificar el estado.
    // Para simplificar, si viene de URI externa (cliente), asumimos que el cliente puede haber esperado o que Gemini lo manejará.
    // Pero si el cliente nos dio el nombre del archivo, esperamos.
    if (fileNameOnAI) {
      console.log(`[Gemini] Esperando procesamiento interno de Google para ${fileNameOnAI}...`);
      let file = await fileManager.getFile(fileNameOnAI);
      let attempts = 0;
      while (file.state === "PROCESSING") {
        attempts++;
        process.stdout.write(".");
        if (attempts % 6 === 0) {
          console.log(`\n[Gemini] Sigue procesando... (tiempo transcurrido: ${attempts * 5}s)`);
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
        file = await fileManager.getFile(fileNameOnAI);
      }
      console.log(`\n[Gemini] Estado final del archivo: ${file.state}`);

      if (file.state === "FAILED") {
        throw new Error(`El procesamiento del audio falló en Google AI: ${file.error ? file.error.message : 'Error desconocido'}`);
      }
    }

    // 4. Generar la minuta con el modelo solicitado
    console.log(`[Gemini] Generando contenido con el modelo: gemini-2.5-flash...`);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
      Analiza el audio proporcionado y genera DOS secciones claramente diferenciadas:
      
      1. TRANSCRIPCIÓN COMPLETA: Una transcripción literal y fiel de todo lo que se dice en el audio.
      2. MINUTA ESTRUCTURADA: Sigue exactamente las reglas a continuación.

      REGLAS PARA LA MINUTA ESTRUCTURADA:
      Genera una minuta de reunión profesional y estructurada a partir de la información del audio.

      IMPORTANTE:
      - No agregues introducciones, saludos ni frases explicativas.
      - No incluyas textos como "¡Absolutamente!" ni comentarios sobre lo que estás haciendo.
      - Ve directo al contenido.
      - Usa un tono corporativo, claro y conciso.

      Estructura obligatoria:
      MINUTA DE REUNIÓN
      Título: ${title || '[TÍTULO DE LA REUNIÓN]'}
      Fecha: ${date || '[FECHA]'}
      Área o equipo: ${department || '[ÁREA O EQUIPO]'}
      Participantes: ${participants || '[PARTICIPANTES]'}
      Objetivo de la reunión
      Desarrollo de la reunión (resumen claro y ordenado)
      Decisiones tomadas
      Tareas y responsables
      Rutas / dependencias técnicas (si aplica)
      Bloqueos o riesgos (si aplica)
      Conclusión
      Próximos pasos

      Reglas adicionales:
      - Redacta en tercera persona.
      - Sé concreto, evita redundancias.
      - PRECISIÓN EXTREMA: Presta especial atención a nombres propios, títulos y géneros (ej. Si escuchas "Sr. Elisaul", no escribas "Srta. Lisbeth").
      - VERACIDAD: No inventes tareas ni asignes responsables que no se mencionen explícitamente en el audio. Si no hay un responsable claro, indica [No asignado].
      - Organiza la información en bullets cuando sea necesario.
      - Si falta información, deja el campo como placeholder entre corchetes.

      Usa exactamente este separador entre las dos secciones: [SEPARADOR_SGF]
    `;

    console.log(`[Gemini] Solicitando generación de contenido (esto puede tardar para audios largos)...`);
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: mimeType || 'audio/mp3',
          fileUri: fileUri
        }
      },
      { text: prompt },
    ]);

    console.log(`[Gemini] Respuesta recibida de la AI.`);
    const responseText = await result.response.text();
    const parts = responseText.split('[SEPARADOR_SGF]');

    return {
      transcription: parts[0]?.trim() || "No se pudo generar la transcripción.",
      minuta: parts[1]?.trim() || parts[0]?.trim() // Fallback if no separator found
    };

  } catch (error) {
    console.error("[Gemini] Error en processAudioForMinuta:", error);
    throw error;
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      console.log(`[Gemini] Limpiando archivo temporal: ${tempPath}`);
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {
        console.warn(`[Gemini] No se pudo borrar el archivo temporal: ${e.message}`);
      }
    }
  }
}


