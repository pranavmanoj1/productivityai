// server/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();



// 1) Import the Google TTS library
const textToSpeech = require('@google-cloud/text-to-speech');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- Existing endpoint for AI responses (OpenAI) ---
app.post('/api/ai-response', async (req, res) => {
  const { message } = req.body;
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "user", content: message }
        ],
        max_tokens: 150,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: ["User:", "AI:"],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const aiResponse = response.data.choices[0].message.content.trim();
    res.json({ response: aiResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// 2) Create a TTS client instance
//    Make sure your GOOGLE_APPLICATION_CREDENTIALS is pointing to the JSON key
const ttsClient = new textToSpeech.TextToSpeechClient();

// 3) TTS endpoint
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;  // The text you want to convert to speech

  try {
    // Construct request payload for Google Cloud TTS
    const request = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        ssmlGender: 'FEMALE' // or MALE, NEUTRAL
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.1, // adjust to taste
        pitch: 1.0
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);

    // Check if we got audio content back
    if (!response.audioContent) {
      return res.status(500).send('No audio content received');
    }

    // 4) Send the audio content as MP3
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (err) {
    console.error('Error calling TTS:', err);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
