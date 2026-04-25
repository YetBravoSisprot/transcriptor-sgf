const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // Note: The SDK doesn't have a direct listModels method on the genAI object usually, 
    // but we can try to hit the endpoint or just test a few variants.
    // Actually, the error message itself suggested calling ListModels.
    
    // We'll try a simple generateContent with a dummy text to see if the model is found.
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-pro"];
    
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("test");
        console.log(`Model ${m}: SUCCESS`);
      } catch (e) {
        console.log(`Model ${m}: FAILED - ${e.message}`);
      }
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
