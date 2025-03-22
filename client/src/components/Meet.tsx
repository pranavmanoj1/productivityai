import React, { useEffect, useState } from 'react';
import {
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  User,
} from '@stream-io/video-react-sdk';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import './style.css';

// Use your existing Supabase client
import { supabase } from '../lib/supabase';

// Replace with your Stream API key (do not expose your secret!)
const apiKey = import.meta.env.VITE_API_KEY as string;

export default function Meet() {
  // State to store the initialized StreamVideoClient
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  // State to store the current call object
  const [currentCall, setCurrentCall] = useState<ReturnType<StreamVideoClient['call']> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initClient = async () => {
      // 1) Fetch the current Supabase user
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Error fetching Supabase user:', error);
        return;
      }
      if (!user) {
        console.warn('No Supabase user is logged in.');
        return;
      }

      // 2) Extract the user's ID and display name
      const supabaseUserId = user.id;
      const displayName = (user.user_metadata?.full_name as string) || 'No Name';

      // 3) Fetch a Stream Video token from your server
      const response = await fetch('https://productivityai-1.onrender.com/api/get-stream-video-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: supabaseUserId,
          name: displayName,
        }),
      });
      const { token } = await response.json();

      // 4) Build the Stream Video user object
      const streamUser: User = {
        id: supabaseUserId,
        name: displayName,
      };

      // 5) Initialize the StreamVideoClient using the server-generated token
      const newClient = new StreamVideoClient({
        apiKey,
        user: streamUser,
        token,
      });

      // 6) Create a default placeholder call
      const placeholderCall = newClient.call('default', 'placeholder-id');

      // 7) Store in state and mark loading as complete
      setClient(newClient);
      setCurrentCall(placeholderCall);
      setLoading(false);
    };

    initClient();
  }, []);

  // Show a loading message if the client or call hasn't been initialized
  if (loading || !client || !currentCall) {
    return <div>Loading or no logged-in user…</div>;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={currentCall}>
        <MyUILayout client={client} currentCall={currentCall} onCallChange={setCurrentCall} />
      </StreamCall>
    </StreamVideo>
  );
}

type MyUILayoutProps = {
  client: StreamVideoClient;
  currentCall: ReturnType<StreamVideoClient['call']>;
  onCallChange: (call: ReturnType<StreamVideoClient['call']> | null) => void;
};
export const MyUILayout = ({ client, currentCall, onCallChange }: MyUILayoutProps) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        // 8) Query your "availability" table for available users
        const { data, error } = await supabase
          .from('availability')
          .select('*')
          .eq('available', true);

        if (error) {
          console.error('Error fetching users from availability:', error);
        } else {
          setAvailableUsers(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchAvailableUsers();
  }, []);

  // 9) When a user clicks "Call", create and join a new call for that user
  const handleJoinCallWithUser = async (otherUserId: string) => {
    try {
      // Build a unique call ID (you can customize this as needed)
      const newCallId = `my-call-${otherUserId}`;

      // Get a new call object from the existing client
      const newCall = client.call('default', newCallId);

      // Join (and create if not exists) the new call
      await newCall.join({ create: true });

      // Replace the placeholder call with the new call
      onCallChange(newCall);
    } catch (error) {
      console.error('Error joining call:', error);
    }
  };

  // 10) If the call is not yet joined, display available users to call
  if (callingState !== CallingState.JOINED) {
    if (loadingUsers) {
      return <div>Loading available users…</div>;
    }

    return (
      <div>
        <h3>Users Available to Call</h3>
        {availableUsers.length === 0 && <p>No users are currently available.</p>}

        {availableUsers.map((u) => {
          // Expecting 'user_id' from the "availability" table; use 'user_name' if available
          const otherId = u.user_id;
          const otherName = u.name || otherId;

          return (
            <div key={otherId} style={{ marginBottom: '1rem' }}>
              <strong>{otherName}</strong>
              <br />
              <button onClick={() => handleJoinCallWithUser(otherId)}>
                Call {otherName}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  // 11) Once joined, display the actual call UI with speaker layout and controls
  return (
    <StreamTheme>
      <SpeakerLayout participantsBarPosition="bottom" />
      <CallControls />
    </StreamTheme>
  );
};
