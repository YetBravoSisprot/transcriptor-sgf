const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function checkModelsRest() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await axios.get(url);
    console.log("Available Models:");
    response.data.models.forEach(m => console.log(m.name));
  } catch (error) {
    if (error.response) {
      console.error(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error("Error:", error.message);
    }
  }
}

checkModelsRest();
