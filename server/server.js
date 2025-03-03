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
  res.send("Server is running. POST to /api/ai-response or /api/tts, or GET /api/tasks.");
});

/**
 * Helper function to fetch tasks from Supabase based on a sort/filter parameter.
 * Ensures tasks are only retrieved for the authenticated user.
 */
async function fetchTasks(sortBy, userId) {
  let query = supabase.from('tasks').select('*').eq('user_id', userId); // Ensure tasks belong to user

  if (sortBy === 'today') {
    const today = new Date().toISOString().slice(0, 10);
    query = query.eq('due_date', today);
  } else if (sortBy === 'thisWeek') {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().slice(0, 10);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);
    query = query.gte('due_date', todayStr).lte('due_date', nextWeekStr);
  } else if (sortBy === 'thisMonth') {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    query = query.gte('due_date', firstDay).lte('due_date', lastDay);
  } else if (sortBy === 'priority') {
    query = query.order('priority', { ascending: false });
  } else if (sortBy === 'dueDate') {
    query = query.order('due_date', { ascending: true });
  } else if (sortBy === 'dueTime') {
    query = query.order('due_time', { ascending: true });
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
  return data;
}

/**
 * GET /api/tasks
 * Fetch tasks from Supabase with optional sorting/filtering for the authenticated user.
 */
app.get('/api/tasks', async (req, res) => {
  const { sortBy } = req.query;
  
  // Extract JWT from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }
  const token = authHeader.split(' ')[1];

  // Verify token and get user
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  const userId = user.id;
  console.log("Authenticated user id:", userId);

  // Fetch tasks only for this user
  const tasks = await fetchTasks(sortBy, userId);
  res.json({ tasks });
});

/**
 * POST /api/ai-response
 * AI generates response, inserts tasks into Supabase, fetches user-specific tasks, and returns them.
 */
app.post('/api/ai-response', async (req, res) => {
  console.log("Received request at /api/ai-response");

  // Extract JWT from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }
  const token = authHeader.split(' ')[1];

  // Verify token and get user
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const userId = user.id;
  console.log("Authenticated user id:", userId);

  const { message } = req.body;

  // Call OpenAI API
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        max_tokens: 250,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const aiText = response.data.choices[0].message.content.trim();
    console.log("[/api/ai-response] Raw AI response:", aiText);

    // Parse AI response
    let parsedData = JSON.parse(aiText);
    let tasksToInsert = parsedData.structured_output?.tasks || [];
    let checkInDelay = parsedData.check_in_delay || null;
    let taskQuery = parsedData.task_query || null;
    let insertedTasks = [];

    // Insert tasks if provided
    if (tasksToInsert.length > 0) {
      const rows = tasksToInsert.map((t) => ({
        title: t.title,
        due_date: t.due_date || null,
        priority: t.priority || null,
        due_time: t.due_time || null,
        user_id: userId
      }));

      console.log("[/api/ai-response] Inserting tasks:", rows);

      const { data: inserted, error } = await supabase.from('tasks').insert(rows);
      if (error) {
        console.error("Supabase insert error:", error);
      } else {
        insertedTasks = inserted;
      }
    }

    // Fetch tasks only for this user based on query
    let fetchedTasks = taskQuery ? await fetchTasks(taskQuery, userId) : null;

    res.json({
      freeform_answer: parsedData.freeform_answer,
      tasks_inserted: insertedTasks,
      tasks_fetched: fetchedTasks,
      check_in_delay: checkInDelay
    });

  } catch (error) {
    console.error("Error in AI response:", error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

/**
 * POST /api/tts
 * Generates speech using Google Cloud Text-to-Speech.
 */
const credentials = process.env.GOOGLE_CLOUD_TTS_CREDENTIALS
  ? JSON.parse(process.env.GOOGLE_CLOUD_TTS_CREDENTIALS)
  : null;

const ttsClient = new textToSpeech.TextToSpeechClient({
  ...(credentials && { credentials }),
});

app.post('/api/tts', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).send('Text is empty or undefined');
  }

  try {
    const request = {
      input: { text },
      voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1.1, pitch: 1.0 },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    if (!response.audioContent) {
      return res.status(500).send('No audio content received');
    }

    res.set('Content-Type', 'audio/mpeg');
    return res.send(response.audioContent);
  } catch (err) {
    console.error('Error calling TTS:', err);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
