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
 * sortBy can be: today, thisWeek, thisMonth, priority, dueDate, or dueTime.
 */
async function fetchTasks(sortBy) {
  let query = supabase.from('tasks').select('*');

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
 * Fetch tasks from Supabase with optional sorting/filtering.
 */
app.get('/api/tasks', async (req, res) => {
  const { sortBy } = req.query;
  const tasks = await fetchTasks(sortBy);
  res.json({ tasks });
});

/**
 * POST /api/ai-response
 * 1) Calls GPT-3.5-turbo to generate a freeform answer, optionally a check-in delay,
 *    a task_query, and task details.
 * 2) Inserts tasks into Supabase using the authenticated user's id.
 * 3) If tasks are inserted -> calls /api/tts with text: "Task added".
 * 4) If a task_query is provided, fetches tasks accordingly.
 * 5) Returns JSON with freeform_answer, tasks_inserted, tasks_fetched (if any),
 *    TTS audio, and check_in_delay.
 */
app.post('/api/ai-response', async (req, res) => {
  console.log("Received request at /api/ai-response");
  
  // Extract JWT from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }
  const token = authHeader.split(' ')[1];

  // Verify token and get user using Supabase auth
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const userId = user.id;
  console.log("Authenticated user id:", userId);

  const { message } = req.body;

  // Get the current date and time for dynamic context
  const now = new Date();
  const currentDate = now.toLocaleDateString();
  const currentTime = now.toLocaleTimeString();

  // Build the OpenAI prompt with current date/time information.
  // Notice the new "task_query" key instruction.
  const promptMessages = [
    {
      role: "system",
      content: `You are a helpful assistant.
Current date is: ${currentDate} and current time is: ${currentTime}.
- First, produce a short "freeform_answer" You are a productivity and wellness assistant integrated into a ChumAI tool. Your role is to support users in three key areas:

1. **Avoiding Procrastination and Getting Started:**  
   - Help users address hidden anxieties and embrace imperfection.
   - Guide them to break tasks into manageable chunks and kickstart with mini-goals.
   - Encourage the use of regular check-ins to build and maintain momentum.

2. **Recovering from Distractions and Staying Focused:**  
   - Detect when users are engaging in less important tasks or scrolling on social media.
   - Identify underlying concerns that lead to these distractions.
   - Provide actionable advice to help users refocus on their most important tasks.

3. **Managing Stress and Preventing Burnout:**  
   - Recognize signs of stress buildup during work.
   - Integrate mindfulness techniques into the workflow.
   - Recommend short, rejuvenating breaks to help users stay composed and refreshed.

Your output should be clear, actionable, and written in a supportive and motivational tone that empowers users to improve their productivity and overall well-being.
- If the user's message indicates a check-in command (for example, "check in" optionally followed by a time specification),
  include an additional key "check_in_delay" in your JSON output. If a time is provided (e.g. "after 5 minutes"),
  set "check_in_delay" to the number of milliseconds (e.g. 300000). If no time is provided, set "check_in_delay" to null.
- Additionally, if the user wants to fetch tasks, include an optional key "task_query" with one of the following values:
  "today", "thisWeek", "thisMonth", "priority", "dueDate", or "dueTime".
- Next, produce a JSON object called "structured_output" of the form. Important: I want this to be not null only when the users asks you to add tasks.:

{
  "tasks": [
    {
      "title": string,
      "due_date": date (format: YYYY-MM-DD),
      "priority": "high" | "medium" | "low",
      "due_time": time (format: HH:MM:SS 24-hour)
    },
    ...
  ]
}

If no tasks are found, return { "tasks": [] }.

You must wrap your entire response in valid JSON, like:

{
  "freeform_answer": "...",
  "check_in_delay": number or null,
  "task_query": string or null, 
  "structured_output": {
    "tasks": [ ... ]
  }
}

Do not include any commentary or text outside of the JSON structure.`
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

    // 2) The AI's raw text (should be valid JSON)
    const aiText = response.data.choices[0].message.content.trim();
    console.log("[/api/ai-response] Raw AI JSON response:\n", aiText);

    // 3) Parse the JSON
    let freeformAnswer = "";
    let parsedTasks = [];
    let checkInDelay = null;
    let taskQuery = null;
    try {
      const data = JSON.parse(aiText);
      freeformAnswer = data.freeform_answer || "";
      checkInDelay = data.check_in_delay || null;
      taskQuery = data.task_query || null;
      if (data.structured_output && Array.isArray(data.structured_output.tasks)) {
        parsedTasks = data.structured_output.tasks;
      }
      console.log("[/api/ai-response] Parsed freeform_answer:\n", freeformAnswer);
      console.log("[/api/ai-response] Parsed tasks:\n", parsedTasks);
      console.log("[/api/ai-response] Parsed check_in_delay:\n", checkInDelay);
      console.log("[/api/ai-response] Parsed task_query:\n", taskQuery);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      // fallback: return the raw text
      return res.json({
        response: aiText,
        warning: "Failed to parse tasks from AI response"
      });
    }

    // 4) Insert tasks into Supabase using the authenticated user's id
    let supabaseInsertData = [];
    let ttsAudioBase64 = null; // We'll store "Task added" TTS here

    if (parsedTasks.length > 0) {
      // Build the rows we'll insert, including additional task fields if provided.
      const rows = parsedTasks.map((t) => ({
        title: t.title,
        due_date: t.due_date || null,
        priority: t.priority || null,
        due_time: t.due_time || null,
        user_id: userId
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
            const ttsResponse = await axios.post(
              `https://productivityai.onrender.com/api/tts/`,
              { text: "Task added" },
              { responseType: 'arraybuffer' }
            );

            if (ttsResponse.data) {
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

    // 5) If a task_query was provided by the AI, fetch tasks accordingly.
    let tasksFetched = null;
    if (taskQuery) {
      tasksFetched = await fetchTasks(taskQuery);
      console.log("[/api/ai-response] Fetched tasks for query:", taskQuery, tasksFetched);
    }

    // 6) Return a JSON response including check_in_delay and any fetched tasks.
    res.json({
      freeform_answer: freeformAnswer,
      tasks_inserted: supabaseInsertData,
      tasks_fetched: tasksFetched,
      tts_audio: ttsAudioBase64,
      check_in_delay: checkInDelay
    });

  } catch (error) {
    console.error("OpenAI request error:", error);
    return res.status(500).json({ error: 'Failed to get AI response' });
  }
});

/**
 * POST /api/tts
 * 1) Takes { text } in the body.
 * 2) Calls Google Cloud TTS.
 * 3) Returns MP3 audio in binary form.
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

    res.set('Content-Type', 'audio/mpeg');
    return res.send(response.audioContent);
  } catch (err) {
    console.error('Error calling TTS:', err);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
