import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import path from "path";
import os from "os";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

export async function processAudioForMinuta(audioBuffer, mimeType, fileName, metadata = {}) {
  const { title, date, department, participants } = metadata;
  
  // 1. Guardar temporalmente el archivo para subirlo a Gemini File API
  const ext = path.extname(fileName) || '.mp3';
  const tempPath = path.join(os.tmpdir(), `upload_${Date.now()}${ext}`);
  fs.writeFileSync(tempPath, audioBuffer);
  try {
    // 2. Subir a Gemini File API
    const uploadResult = await fileManager.uploadFile(tempPath, {
      mimeType,
      displayName: fileName,
    });

    const fileUri = uploadResult.file.uri;
    const fileNameOnAI = uploadResult.file.name;
    console.log(`Audio subido correctamente: ${fileUri}`);

    // 3. Esperar a que el archivo esté procesado
    let file = await fileManager.getFile(fileNameOnAI);
    while (file.state === "PROCESSING") {
      process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      file = await fileManager.getFile(fileNameOnAI);
    }

    if (file.state === "FAILED") {
      console.error("Detalle del error de Google File API:", file.error);
      throw new Error(`El procesamiento del audio falló: ${file.error ? file.error.message : 'Error desconocido'}`);
    }

    // 4. Generar la minuta con el modelo disponible en el entorno
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
      - Organiza la información en bullets cuando sea necesario.
      - Si falta información, deja el campo como placeholder entre corchetes.

      Usa exactamente este separador entre las dos secciones: [SEPARADOR_SGF]
    `;

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: fileUri
        }
      },
      { text: prompt },
    ]);

    const responseText = await result.response.text();
    const parts = responseText.split('[SEPARADOR_SGF]');
    
    return {
      transcription: parts[0]?.trim() || "No se pudo generar la transcripción.",
      minuta: parts[1]?.trim() || parts[0]?.trim() // Fallback if no separator found
    };

  } finally {
    // Limpiar archivo temporal
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}
