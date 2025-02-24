const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const textToSpeech = require('@google-cloud/text-to-speech');
const { createClient } = require('@supabase/supabase-js');

// 1) Create a Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send("Server is running. POST to /api/ai-response or /api/tts.");
});

/**
 * POST /api/ai-response
 * 1) Calls GPT-3.5-turbo to parse tasks
 * 2) Inserts tasks into Supabase (TEMP user_id)
 * 3) If tasks inserted -> calls /api/tts with text: "Task added"
 * 4) Returns JSON with freeform_answer, inserted tasks, and TTS audio
 */
app.post('/api/ai-response', async (req, res) => {
  console.log("Received request at /api/ai-response");
  const { message } = req.body;

  // Build your OpenAI prompt
  const promptMessages = [
    {
      role: "system",
      content: `You are a helpful assistant. 
- First, produce a short "freeform_answer" responding to the user's question or statement. If they want to do a task make sure to give helpful advice and general advice for them to get started. Check in with them if they ask you to. Don't ask too many questions at once. Always be positve and upbeat and make sure the user makes the right decisions. If you don't know what to say ask 'would you like me to check in with you later'. ask this only if you haven't asked it before. IMPORTANT: Your entire response must be valid JSON. Do not include any additional commentary, greetings, or text outside of the JSON structure.

- Next, If the user instructs you to "check in", ask them "After how long should I check in with you?" if they did not include a time. Once they specify a time, later remind them by checking in.
- Then, produce a JSON object called "structured_output" of the form:

{
  "tasks": [
    {
      "title": string,
      "due_date": string or null
    },
    ...
  ]
}

If no tasks are found, return { "tasks": [] }.

You must wrap your entire response in valid JSON, like:

{
  "freeform_answer": "...",
  "structured_output": {
    "tasks": [ ... ]
  }
}

No other top-level keys.`
    },
    {
      role: "user",
      content: message
    }
  ];

  try {
    // 1) Call OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: promptMessages,
        max_tokens: 250,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    // 2) The AI's raw text (should be JSON)
    const aiText = response.data.choices[0].message.content.trim();
    console.log("[/api/ai-response] Raw AI JSON response:\n", aiText);

    // 3) Parse the JSON
    let freeformAnswer = "";
    let parsedTasks = [];
    try {
      const data = JSON.parse(aiText);
      freeformAnswer = data.freeform_answer || "";
      if (data.structured_output && Array.isArray(data.structured_output.tasks)) {
        parsedTasks = data.structured_output.tasks;
      }

      console.log("[/api/ai-response] Parsed freeform_answer:\n", freeformAnswer);
      console.log("[/api/ai-response] Parsed tasks:\n", parsedTasks);

    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      // fallback: return the raw text
      return res.json({
        response: aiText,
        warning: "Failed to parse tasks from AI response"
      });
    }

    // 4) Insert tasks into Supabase with a TEMP user_id
    let supabaseInsertData = [];
    let ttsAudioBase64 = null; // We'll store "Task added" TTS here

    if (parsedTasks.length > 0) {
      // Always use this temporary user ID
      const TEMP_USER_ID = "a2551082-57cb-454e-8ac8-4d2de727537b";

      // Build the rows we'll insert
      const rows = parsedTasks.map((t) => ({
        title: t.title,
        due_date: t.due_date || null,
        user_id: TEMP_USER_ID
      }));

      console.log("[/api/ai-response] Inserting rows into Supabase:\n", rows);

      const { data: inserted, error: supaErr } = await supabase
        .from('tasks')
        .insert(rows);

      if (supaErr) {
        console.error("Supabase insert error:", supaErr);
      } else {
        supabaseInsertData = inserted;
        console.log("[/api/ai-response] Inserted tasks from AI:\n", supabaseInsertData);

        // If tasks inserted -> call /api/tts with "Task added"
        if (inserted && inserted.length > 0) {
          try {
            // Make an *internal* call to our own TTS endpoint
            // We'll request "arraybuffer" so we get raw binary data back
            const ttsResponse = await axios.post(
              `https://productivityai.onrender.com/api/tts/`,
              { text: "Task added" },
              { responseType: 'arraybuffer' }
            );

            if (ttsResponse.data) {
              // Convert the binary response to base64
              const audioBase64 = Buffer.from(ttsResponse.data, 'binary').toString('base64');
              ttsAudioBase64 = audioBase64;
              console.log("[/api/ai-response] TTS: 'Task added' generated successfully.");
            }
          } catch (ttsErr) {
            console.error("Error calling /api/tts for 'Task added':", ttsErr);
          }
        }
      }
    } else {
      console.log("[/api/ai-response] No tasks found, skipping insert.");
    }

    // 5) Return a JSON response (including TTS audio if generated)
    res.json({
      freeform_answer: freeformAnswer,
      tasks_inserted: supabaseInsertData,
      tts_audio: ttsAudioBase64
    });

  } catch (error) {
    console.error("OpenAI request error:", error);
    return res.status(500).json({ error: 'Failed to get AI response' });
  }
});

/**
 * POST /api/tts
 * 1) Takes { text } in the body
 * 2) Calls Google Cloud TTS
 * 3) Returns MP3 audio in binary form
 */
const credentials = process.env.GOOGLE_CLOUD_TTS_CREDENTIALS
  ? JSON.parse(process.env.GOOGLE_CLOUD_TTS_CREDENTIALS)
  : null;

const ttsClient = new textToSpeech.TextToSpeechClient({
  ...(credentials && { credentials }),
});

app.post('/api/tts', async (req, res) => {
  const { text } = req.body;

  try {
    if (!text) {
      return res.status(400).send('Text is empty or undefined');
    }

    const request = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.1,
        pitch: 1.0
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    if (!response.audioContent) {
      return res.status(500).send('No audio content received');
    }

    // Return the MP3 bytes directly
    res.set('Content-Type', 'audio/mpeg');
    return res.send(response.audioContent); // This is a Buffer or base64 string
  } catch (err) {
    console.error('Error calling TTS:', err);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
