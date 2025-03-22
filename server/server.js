const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const textToSpeech = require('@google-cloud/text-to-speech');
const { createClient } = require('@supabase/supabase-js');
const { fetchTasks } = require('./tasks');

const { StreamClient } = require("@stream-io/node-sdk");
// Create a Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const userConversations = {};






app.get('/', (req, res) => {
  res.send("Server is running. POST to /api/ai-response or /api/tts, or GET /api/tasks.");
});

/**
 * GET /api/tasks
 * Fetch tasks from Supabase with optional sorting/filtering.
 */
app.get('/api/tasks', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }
  const token = authHeader.split(' ')[1];

  // Verify token and get user using Supabase auth.
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const userId = user.id;
  
  const { sortBy } = req.query;
  const tasks = await fetchTasks(userId, sortBy);
  res.json({ tasks });
});

// Function to make GPT API calls with optimized prompts
async function callGPT(messages, maxTokens = 1000) {
  return axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: maxTokens,
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
}

// Step 1: Initial analysis of user input - simpler, more focused
async function analyzeUserIntent(message) {
  const now = new Date();
  const currentDate = now.toLocaleDateString();
  const currentTime = now.toLocaleTimeString();
  
  const messages = [
    {
      role: "system",
      content: `You are analyzing a user message to determine intent. Current date: ${currentDate}, time: ${currentTime}.
Respond with a JSON object containing:
{
  "intent": one of ["task_creation", "task_query", "check_in", "general_chat"],
  "check_in_delay": number of milliseconds if specified (e.g. 300000 for 5 minutes) or null,
  "task_query_type": one of ["today", "thisWeek", "thisMonth", "priority", "dueDate", "dueTime"] or null,
  "emotional_state": one of ["neutral", "stressed", "positive"] 
}`
    },
    { role: "user", content: message }
  ];

  const response = await callGPT(messages, 1000);
  return JSON.parse(response.data.choices[0].message.content.trim());
}

// Step 2: Generate appropriate response based on intent
async function generateResponse(message, intent) {
  let systemPrompt = "";

  if (intent.intent === "task_creation") {
    systemPrompt = `You are a productivity assistant. Current date: ${new Date().toLocaleDateString().slice(0, 10)} Current time: ${new Date().toLocaleTimeString().slice(0, 10)}. Generate tasksk breaks the user's task into manageable steps. Also create a structured_output JSON with tasks to add. Return the entire response as valid JSON only (no markdown, no code blocks).

    {
      "freeform_answer": "your helpful response",
      "structured_output": {
        "tasks": [
          {
            "title": "task title",
            "due_date": "YYYY-MM-DD ",
            "priority": "high|medium|low",
            "due_time": "HH:MM:SS "
          }
        ]
      }
    }`;
  } else if (intent.intent === "check_in") {
    systemPrompt = `You are checking in with the user. Generate a freeform response asking how their progress is going. Return the entire response as valid JSON only (no markdown, no code blocks).

{
  "freeform_answer": "your check-in response"
}`;
  } else if (intent.intent === "task_query") {
    systemPrompt = `You are helping retrieve tasks. Generate a freeform response acknowledging the user's request. Return the entire response as valid JSON only (no markdown, no code blocks).

{
  "freeform_answer": "your response about retrieving tasks"
}`;
  } else {
    // General chat
    systemPrompt = `You are a productivity and wellness assistant. Based on the user's emotional state (${intent.emotional_state}), provide a supportive response. Return the entire response as valid JSON only (no markdown, no code blocks).

{
  "freeform_answer": "your empathetic response",
  "requires_followup": true or false
}`;
  }

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message }
  ];

  // Call your GPT function
  const response = await callGPT(messages, 1000);
  let responseText = response.data.choices[0].message.content.trim();

  // Remove any code fences if they appear
  responseText = responseText
    .replace(/^```(?:json)?\s*/i, "")  // remove opening ```
    .replace(/```$/, "");             // remove closing ```
  console.log("[/api/ai-response] AI raw JSON:", responseText);
  // Finally, parse and return the JSON
  // (You could wrap this in try/catch if you want to handle malformed JSON gracefully)
  return JSON.parse(responseText);
}


/**
 * POST /api/ai-response
 * Optimized to break down the large GPT call into smaller, more focused calls
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

  if (!userConversations[userId]) {
    userConversations[userId] = [];
  }

  try {
    // Step 1: Analyze intent with a smaller, focused API call
    const intent = await analyzeUserIntent(message);
    console.log("[/api/ai-response] Analyzed intent:", intent);
    
    // Step 2: Generate appropriate response based on intent
    const aiResponse = await generateResponse(message, intent);
    console.log("[/api/ai-response] Generated response:", aiResponse);
    
    // Extract data from AI response
    let freeformAnswer = aiResponse.freeform_answer || "";
    let parsedTasks = [];
    let requiresFollowup = aiResponse.requires_followup === true;
    let checkInDelay = intent.check_in_delay;
    let taskQuery = intent.task_query_type;
    
    if (aiResponse.structured_output && Array.isArray(aiResponse.structured_output.tasks)) {
      parsedTasks = aiResponse.structured_output.tasks;
    }

    // Handle task insertion if needed
    let supabaseInsertData = [];
    let ttsAudioBase64 = null;
    let proposedTasks = [];

    if (parsedTasks.length > 0 && intent.intent === "task_creation") {
      // Instead of inserting, send tasks to frontend for approval
      proposedTasks = parsedTasks.map((t) => ({
        title: t.title,
        due_date: t.due_date || null,
        priority: t.priority || "medium",
        due_time: t.due_time || null,
        user_id: userId,
        completed: false
      }));

      if (parsedTasks.length > 0) {
        // Build the rows we'll insert
        const rows = parsedTasks.map((t) => ({
          title: t.title,
          due_date: t.due_date || null,
          priority: t.priority || null,
          due_time: t.due_time || null,
          user_id: userId
        }));

      console.log("[/api/ai-response] Inserting rows into Supabase:", rows);

      const { data: inserted, error: supaErr } = await supabase
        .from('tasks')
        .insert(rows);

      if (supaErr) {
        console.error("Supabase insert error:", supaErr);
      } else {
        supabaseInsertData = inserted;
        console.log("[/api/ai-response] Inserted tasks from AI:", supabaseInsertData);

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
    }}

    // If a task_query was provided, fetch tasks accordingly
    let tasksFetched = null;
    if (taskQuery) {
      tasksFetched = await fetchTasks(userId, taskQuery);
      console.log("[/api/ai-response] Fetched tasks for query:", taskQuery, tasksFetched);
    }

    // Return the complete response
    res.json({
      freeform_answer: freeformAnswer,
      tasks_inserted: supabaseInsertData,
      tasks_fetched: tasksFetched,
      tts_audio: ttsAudioBase64,
      check_in_delay: checkInDelay,
      requires_followup: requiresFollowup,
      proposed_tasks: proposedTasks
    });

  } catch (error) {
    console.error("Error in /api/ai-response:", error);
    return res.status(500).json({ error: 'Failed to get AI response' });
  }
});
  
app.post('/api/confirm-tasks', async (req, res) => {
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
  
  const { tasksToConfirm } = req.body;
  
  try {
    // Insert confirmed tasks
    const { data: inserted, error: supaErr } = await supabase
      .from('tasks')
      .insert(tasksToConfirm);

    if (supaErr) {
      console.error("Supabase insert error:", supaErr);
      return res.status(500).json({ error: 'Failed to insert tasks' });
    }

    // Generate TTS for task confirmation
    let ttsAudioBase64 = null;
    try {
      const ttsResponse = await axios.post(
        `https://productivityai.onrender.com/api/tts/`,
        { text: "Tasks added successfully" },
        { responseType: 'arraybuffer' }
      );

      if (ttsResponse.data) {
        ttsAudioBase64 = Buffer.from(ttsResponse.data, 'binary').toString('base64');
      }
    } catch (ttsErr) {
      console.error("Error calling /api/tts:", ttsErr);
    }

    return res.json({ 
      success: true, 
      tasks_inserted: inserted,
      tts_audio: ttsAudioBase64
    });
  } catch (error) {
    console.error("Error confirming tasks:", error);
    return res.status(500).json({ error: 'Failed to confirm tasks' });
  }
});

/**
 * POST /api/tts
 * Text-to-speech endpoint
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