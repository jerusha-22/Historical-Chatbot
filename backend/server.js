require('dotenv').config();
const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Re-introducing GoogleGenerativeAI

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// ✅ Gemini API Configuration (Reverted to Gemini)
console.log("🔐 Initializing Gemini with provided API key...");
// Use the API key from the .env file for local environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 
console.log("✅ Gemini initialized.");

// POST route to handle chat
app.post('/chat', async (req, res) => {
  const { message, character } = req.body;

  // Debug logs
  console.log("📩 Incoming chat request:");
  console.log("Character:", character);
  console.log("Message:", message);

  if (!message || !character) {
    console.warn("⚠️ Missing message or character in request body.");
    return res.status(400).json({ reply: "Invalid request data." });
  }

  // Normalize character selection
  let characterKey = 'einstein';
  const charLower = character.toLowerCase();
  if (charLower.includes('cleopatra')) characterKey = 'cleopatra';
  else if (charLower.includes('vinci')) characterKey = 'davinci';

  const prompts = {
    einstein: "You are Albert Einstein, a brilliant physicist. Respond wisely, with scientific clarity and a curious tone.",
    cleopatra: "You are Cleopatra, Queen of Egypt. Speak with royal confidence and ancient charm.",
    davinci: "You are Leonardo da Vinci. Respond like a Renaissance genius with poetic insight and curiosity."
  };

  const prompt = `${prompts[characterKey]}\nUser: ${message}`;

  try {
    console.log("🔁 Sending request to Gemini...");
    // Using gemini-2.0-flash as it's generally available in this environment
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });

    const reply = result.response.text();
    if (!reply) {
      console.error("❌ No reply returned from Gemini.");
      throw new Error("Empty or invalid response from Gemini");
    }

    console.log("✅ Gemini replied successfully.");
    console.log("🗨️ Reply:", reply);
    res.json({ reply });

  } catch (error) {
    console.error("❌ Gemini API Error:");
    console.error("⚠️ Message:", error.message);
    res.status(500).json({ reply: "Sorry, something went wrong with the AI service." });
  }
});

// Serve pages
app.get('/', (_, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/eistein-chat', (_, res) => res.sendFile(path.join(__dirname, '../public/eistein-chat.html')));
app.get('/cleopatra-chat', (_, res) => res.sendFile(path.join(__dirname, '../public/cleopatra-chat.html')));
app.get('/davinci-chat', (_, res) => res.sendFile(path.join(__dirname, '../public/davinci-chat.html')));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
