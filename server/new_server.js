require('dotenv').config();
const express = require('express');
const cors = require('cors');
// 1) Import the server-side client constructor
const { StreamClient } = require('@stream-io/node-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// 2) Read your Stream credentials from env
const STREAM_API_KEY = process.env.STREAM_VIDEO_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

// 3) Create the server client
const client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET, {
  timeout: 3000, // optional, default is 3000ms
});

// Example endpoint to create a user and generate a token
app.post('/api/get-stream-video-token', async (req, res) => {
  try {
    // Suppose your frontend sends { userId, name, image } in the request
    const { userId, name, image } = req.body;

    // 4) Upsert the user (create if not exists, or update existing)
    await client.upsertUsers([
      {
        id: userId,     // required
        role: 'user',   // or 'admin'
        name,           // optional
        image,          // optional
        // You can add custom data too:
        custom: { color: 'red' },
      },
    ]);

    // 5) Generate the user token (JWT).
    // By default it’s valid for 1 hour, but you can override that:
    const token = client.generateUserToken({
      user_id: userId,
      // validity_in_seconds: 3600, // set if you want something other than 1 hour
    });

    // Send this token back to the client
    return res.json({ token });
  } catch (error) {
    console.error('Error creating user / token:', error);
    return res.status(500).json({ error: 'Server error generating token' });
  }
});

// Example endpoint to create (or get) a call
app.post('/api/create-or-get-call', async (req, res) => {
  try {
    // Suppose your frontend passes a call ID, maybe a random UUID
    const { callId, createdById } = req.body;

    // 6) Access the video endpoint from the Node SDK
    const call = client.video.call('default', callId);

    // 7) Create or get the call
    // You can pass optional data, e.g. call members, custom fields, etc.
    // If it already exists, it’ll just fetch it.
    await call.getOrCreate({
      data: {
        created_by_id: createdById,
        custom: { color: 'blue' },
        members: [
          { user_id: createdById, role: 'admin' },
          // could add others here
        ],
      },
    });

    // Respond with success
    return res.json({ success: true, callId });
  } catch (error) {
    console.error('Error creating/getting call:', error);
    return res.status(500).json({ error: 'Server error creating/getting call' });
  }
});

// Start your server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server listening on port ' + PORT);
});
