import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Clock } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabase';

interface Message {
  id: number | string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface ChatTranscriptProps {
  messages: Message[];
}

const ChatTranscript: React.FC<ChatTranscriptProps> = ({ messages }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-sm'
              }`}
            >
              <p>{message.content}</p>
              <p className="text-xs mt-2 opacity-75">{message.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOnCall, setIsOnCall] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [callDuration, setCallDuration] = useState(0);
  const recognitionRef = useRef<any>(null);
  const callTimerRef = useRef<number>();

  // TTS State
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Check-in countdown state
  const [nextCheckInTime, setNextCheckInTime] = useState<number | null>(null);
  const [checkInCountdown, setCheckInCountdown] = useState<number>(0);

  // New state for text input message
  const [textMessage, setTextMessage] = useState('');

  useEffect(() => {
    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (isOnCall) {
      callTimerRef.current = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isOnCall]);

  // Countdown effect for check-in
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (nextCheckInTime) {
      interval = setInterval(() => {
        const remaining = nextCheckInTime - Date.now();
        if (remaining <= 0) {
          setCheckInCountdown(0);
          setNextCheckInTime(null);
          console.log("Check-in countdown reached 0");
          clearInterval(interval);
        } else {
          const countdownSeconds = Math.ceil(remaining / 1000);
          setCheckInCountdown(countdownSeconds);
          console.log("Check-in countdown:", countdownSeconds);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [nextCheckInTime]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const queueTTSMessage = (message: string) => {
    setMessageQueue(prev => [...prev, message]);
  };

  useEffect(() => {
    if (!isSpeaking && messageQueue.length > 0) {
      playNextTTS(messageQueue[0]);
    }
  }, [messageQueue, isSpeaking]);

  const playNextTTS = async (message: string) => {
    setIsSpeaking(true);
    try {
      const response = await axios.post(
        'https://productivityai.onrender.com/api/tts',
        { text: message },
        { responseType: 'arraybuffer' }
      );
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      const handleCleanup = () => {
        URL.revokeObjectURL(audioUrl);
        setMessageQueue(prev => prev.slice(1));
        setIsSpeaking(false);
      };

      audio.onended = handleCleanup;
      audio.onerror = handleCleanup;
      await audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
      setMessageQueue(prev => prev.slice(1));
      setIsSpeaking(false);
    }
  };

  const addMessage = (content: string, type: 'user' | 'ai') => {
    const newMessage = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, newMessage]);
    if (type === 'ai') {
      queueTTSMessage(content);
    }
  };

  // Helper function to schedule the check-in message and set up the countdown timer
  const scheduleCheckIn = (delay: number) => {
    setNextCheckInTime(Date.now() + delay);
    setTimeout(() => {
      addMessage("I'm checking in with you now! How are you doing with your tasks?", 'ai');
      setNextCheckInTime(null);
      setCheckInCountdown(0);
    }, delay);
  };

  const handleStartCall = () => {
    setIsOnCall(true);
    addMessage(
      "Hello! I'm your AI assistant. I'm listening to you now. You can click the microphone button to start talking. I can check in with you at any time. Just let me know when you're ready.",
      'ai'
    );
  };

  const handleEndCall = () => {
    setIsOnCall(false);
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    addMessage("Call ended. Thank you for talking with me!", 'ai');
  };

  const toggleListening = () => {
    if (!isListening) {
      startVoiceRecognition();
    } else {
      stopVoiceRecognition();
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addMessage("Sorry, voice recognition isn't supported in your browser.", 'ai');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = async (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      addMessage(transcript, 'user');

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("User not authenticated");
        }
        const token = session.access_token;
        const response = await axios.post('https://productivityai.onrender.com/api/ai-response', {
          message: transcript
        }, { headers: { Authorization: `Bearer ${token}` } });

        addMessage(response.data.freeform_answer, 'ai');
        if (response.data.tasks_fetched && response.data.tasks_fetched.length > 0) {
          const tasksList = response.data.tasks_fetched
            .map(task => `${task.title}`)
            .join('\n');
          addMessage(`Here are your tasks:\n${tasksList}`, 'ai');
        }
        if (response.data.tasks_fetched && response.data.tasks_fetched.length === 0) {
          addMessage(`You have no tasks scheduled for the given time period.`, 'ai');
        }
        if (response.data.check_in_delay && typeof response.data.check_in_delay === 'number') {
          scheduleCheckIn(response.data.check_in_delay);
        }
      } catch (error) {
        console.error('AI Response Error:', error);
        addMessage("I'm having trouble processing your request.", 'ai');
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Voice Recognition Error:', event.error);
      if (event.error === 'no-speech') {
        addMessage("I didn't catch that. Could you please speak again?", 'ai');
      }
    };

    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Handle text message submission
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textMessage.trim()) return;

    addMessage(textMessage, 'user');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("User not authenticated");
      }
      const token = session.access_token;
      const response = await axios.post('https://productivityai.onrender.com/api/ai-response', {
        message: textMessage
      }, { headers: { Authorization: `Bearer ${token}` } });

      addMessage(response.data.freeform_answer, 'ai');
      if (response.data.tasks_fetched && response.data.tasks_fetched.length > 0) {
        const tasksList = response.data.tasks_fetched
          .map(task => `${task.title}`)
          .join('\n');
        addMessage(`Here are your tasks:\n${tasksList}`, 'ai');
      }
      if (response.data.tasks_fetched && response.data.tasks_fetched.length === 0) {
        addMessage(`You have no tasks scheduled for the given time period.`, 'ai');
      }
      if (response.data.check_in_delay && typeof response.data.check_in_delay === 'number') {
        scheduleCheckIn(response.data.check_in_delay);
      }
    } catch (error) {
      console.error('AI Response Error:', error);
      addMessage("I'm having trouble processing your request.", 'ai');
    }
    setTextMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header with Clock */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex ml-auto items-center">
          <div className="flex items-center gap-4">
            {isOnCall && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span>On Call</span>
                <span className="text-gray-600">({formatDuration(callDuration)})</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
            {!isOnCall ? (
              <button
                onClick={handleStartCall}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span>Start Call</span>
              </button>
            ) : (
              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
                <span>End Call</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Check-In Countdown Display */}
      {nextCheckInTime && (
        <div className="bg-yellow-100 p-2 text-center text-gray-800">
          Next check in: {formatDuration(checkInCountdown)}
        </div>
      )}

      {/* Chat Transcript */}
      <ChatTranscript messages={messages} />

      {/* Text Input for Messaging */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <input
            type="text"
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            placeholder="Don't feel like talking? Text me..."
            className="flex-1 border rounded-lg p-2"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </form>
      </div>

      {/* Voice Control Footer */}
      <div className="bg-white border-t p-4">
        <div className="flex justify-center">
          <button
            onClick={toggleListening}
            disabled={!isOnCall}
            className={`p-4 rounded-full transition-colors ${
              isOnCall
                ? isListening
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-300'
            } text-white`}
          >
            {isListening ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>
        </div>
        <p className="text-center mt-2 text-sm text-gray-600">
          {isOnCall
            ? isListening
              ? "I'm listening... Click to pause"
              : "Click the microphone to start speaking"
            : "Start a call to begin"}
        </p>
      </div>
    </div>
  );
};

export default Chat;
