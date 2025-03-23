import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { Clock } from 'lucide-react';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './style.css';
import { supabase } from '../lib/supabase';
import { UserList } from './UserList';

const apiKey = import.meta.env.VITE_API_KEY as string;
const CALL_TIMEOUT = 25 * 60 * 1000; // 25 minutes in milliseconds

export default function Meet() {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [currentCall, setCurrentCall] = useState<ReturnType<StreamVideoClient['call']> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initClient = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('Error fetching Supabase user:', error);
        return;
      }
      const supabaseUserId = user.id;
      const displayName = (user.user_metadata?.full_name as string) || 'No Name';

      const response = await fetch('https://productivityai-1.onrender.com/api/get-stream-video-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: supabaseUserId,
          name: displayName,
        }),
      });
      const { token } = await response.json();

      const streamUser: User = {
        id: supabaseUserId,
        name: displayName,
      };

      const newClient = new StreamVideoClient({
        apiKey,
        user: streamUser,
        token,
      });

      // Create a placeholder call
      const placeholderCall = newClient.call('default', 'placeholder-id');
      setClient(newClient);
      setCurrentCall(placeholderCall);
      setLoading(false);
    };

    initClient();
  }, []);

  if (loading || !client || !currentCall) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-lg font-medium text-gray-600">
          Initializing video call...
        </div>
      </div>
    );
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
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Updates the current user's availability in Supabase.
  const updateUserAvailability = useCallback(async (available: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('availability')
        .update({ available })
        .eq('user_id', user.id);
    }
  }, []);

  // Fetch and store the current user id.
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch available users and filter out the current user.
  useEffect(() => {
    if (!currentUserId) return;
    const fetchAvailableUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('availability')
          .select('*')
          .eq('available', true);
        if (error) {
          console.error('Error fetching users:', error);
        } else {
          // Remove the current user's record from the list.
          const filtered = (data || []).filter((u: any) => u.user_id !== currentUserId);
          setAvailableUsers(filtered);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchAvailableUsers();
    const interval = setInterval(fetchAvailableUsers, 10000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  // Monitor call state and participant count.
  // Only when there are 2 or more participants, mark the current user as unavailable and set the auto-leave timer.
  useEffect(() => {
    if (callingState === CallingState.JOINED && participantCount >= 2) {
      updateUserAvailability(false);
      if (callTimerRef.current) {
        clearTimeout(callTimerRef.current);
      }
      callTimerRef.current = setTimeout(async () => {
        await currentCall.leave();
        updateUserAvailability(true);
      }, CALL_TIMEOUT);
    }
    return () => {
      if (callTimerRef.current) {
        clearTimeout(callTimerRef.current);
      }
    };
  }, [callingState, participantCount, currentCall, updateUserAvailability]);

  // When a user clicks on a call card, generate a consistent call id based on both users’ ids.
  // Do not update availability until the second participant joins.
  const handleJoinCallWithUser = async (targetUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const callerId = user.id;
    // Create a consistent call id by sorting the two user ids.
    const sortedIds = [callerId, targetUserId].sort();
    const callId = `call-${sortedIds[0].slice(0, 8)}-${sortedIds[1].slice(0, 8)}`;

    try {
      const newCall = client.call('default', callId);
      await newCall.join({ create: true });
      onCallChange(newCall);
    } catch (error) {
      console.error('Error joining call:', error);
    }
  };

  // If not in a call, show available users list.
  if (callingState !== CallingState.JOINED) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Available Users</h2>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span>25 min limit per call</span>
              </div>
            </div>
          </div>
          <UserList
            users={availableUsers}
            onCallUser={handleJoinCallWithUser}
            isLoading={loadingUsers}
            currentUserId={currentUserId || undefined}
          />
        </div>
      </div>
    );
  }

  // Once in a call, show the call UI.
  return (
    <StreamTheme>
      <div className="relative">
        <SpeakerLayout participantsBarPosition="bottom" />
        <CallControls />
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          Time remaining: 25:00
        </div>
      </div>
    </StreamTheme>
  );
};
