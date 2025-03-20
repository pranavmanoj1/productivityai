import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { supabase } from '../../lib/supabase';
import { useChatContext } from '../ChatContext';
import ChatHeader from './ChatHeader';
import ChatTranscript from './ChatTranscript';
import TaskApproval from './TaskApproval';
import TextInput from './TextInput';
import VoiceControls from './VoiceControl';


const Chat: React.FC = () => {
  const {
    messages,
    addMessage,
    proposedTasks,
    setProposedTasks,
    isOnCall,
    setIsOnCall,
    isListening,
    setIsListening,
    callDuration,
    setCallDuration,
  } = useChatContext();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextCheckInTime, setNextCheckInTime] = useState<number | null>(null);
  const [checkInCountdown, setCheckInCountdown] = useState<number>(0);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const callTimerRef = useRef<number>();

  useEffect(() => {
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
  }, [isOnCall, setCallDuration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (nextCheckInTime) {
      interval = setInterval(() => {
        const remaining = nextCheckInTime - Date.now();
        if (remaining <= 0) {
          setCheckInCountdown(0);
          setNextCheckInTime(null);
          addMessage("I'm checking in with you now! How are you doing with your tasks?", 'ai');
          queueTTSMessage("I'm checking in with you now! How are you doing with your tasks?");
          clearInterval(interval);
        } else {
          setCheckInCountdown(Math.ceil(remaining / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [nextCheckInTime, addMessage]);

  useEffect(() => {
    if (!isSpeaking && messageQueue.length > 0) {
      playNextTTS(messageQueue[0]);
    }
  }, [messageQueue, isSpeaking]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const queueTTSMessage = (message: string) => {
    setMessageQueue(prev => [...prev, message]);
  };

  const playNextTTS = async (message: string) => {
    setIsSpeaking(true);
    try {
      const response = await axios.post(
        'http://localhost:5001/api/tts',
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

  const scheduleCheckIn = (delay: number) => {
    setNextCheckInTime(Date.now() + delay);
  };

  const handleStartCall = () => {
    setIsOnCall(true);
    addMessage(
      "Hello! I'm your AI assistant. You can click the microphone button to start talking. I can check in with you at any time. Just let me know when you're ready.",
      'ai'
    );
    queueTTSMessage("Hello! I'm your AI assistant. You can click the microphone button to start talking. I can check in with you at any time. Just let me know when you're ready.")
  };

  const handleEndCall = () => {
    setIsOnCall(false);
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    addMessage("Call ended. Thank you for talking with me!", 'ai');
    queueTTSMessage("Call ended. Thank you for talking with me!");
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
      queueTTSMessage("Sorry, voice recognition isn't supported in your browser.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = async (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      addMessage(transcript, 'user');
      queueTTSMessage(transcript);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("User not authenticated");
        }
        const token = session.access_token;
        const response = await axios.post('http://localhost:5001/api/ai-response', {
          message: transcript
        }, { headers: { Authorization: `Bearer ${token}` } });

        addMessage(response.data.freeform_answer, 'ai');
        queueTTSMessage(response.data.freeform_answer);
        if (response.data.tasks_fetched?.length > 0) {
          const tasksList = response.data.tasks_fetched
            .map((task: any) => `${task.title}`)
            .join('\n');
          addMessage(`Here are your tasks:\n${tasksList}`, 'ai');
          queueTTSMessage(`Here are your tasks:\n${tasksList}`);
        }
        
        if (response.data.tasks_fetched?.length === 0) {
          addMessage(`You have no tasks scheduled for the given time period.`, 'ai');
          queueTTSMessage(`You have no tasks scheduled for the given time period.`);
        }
        
        if (response.data.proposed_tasks?.length > 0) {
          setProposedTasks(response.data.proposed_tasks);
          addMessage(`I've proposed some tasks based on your input. Please review and approve them.`, 'ai');
          queueTTSMessage(`I've proposed some tasks based on your input. Please review and approve them.`);
        }
        
        if (response.data.check_in_delay && typeof response.data.check_in_delay === 'number') {
          scheduleCheckIn(response.data.check_in_delay);
        }
      } catch (error) {
        console.error('AI Response Error:', error);
        addMessage("I'm having trouble processing your request.", 'ai');
        queueTTSMessage("I'm having trouble processing your request.");
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Voice Recognition Error:', event.error);
      if (event.error === 'no-speech') {
        addMessage("I didn't catch that. Could you please speak again?", 'ai');
        queueTTSMessage("I didn't catch that. Could you please speak again?");
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

  const handleTextSubmit = async (message: string) => {
    addMessage(message, 'user');
    queueTTSMessage(message);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("User not authenticated");
      }
      const token = session.access_token;
      const response = await axios.post('http://localhost:5001/api/ai-response', {
        message
      }, { headers: { Authorization: `Bearer ${token}` } });

      addMessage(response.data.freeform_answer, 'ai');
      queueTTSMessage(response.data.freeform_answer);
      if (response.data.tasks_fetched?.length > 0) {
        const tasksList = response.data.tasks_fetched
          .map((task: any) => `${task.title}`)
          .join('\n');
        addMessage(`Here are your tasks:\n${tasksList}`, 'ai');
        queueTTSMessage(`Here are your tasks:\n${tasksList}`);
      }
      
      if (response.data.tasks_fetched?.length === 0) {
        addMessage(`You have no tasks scheduled for the given time period.`, 'ai');
        queueTTSMessage(`You have no tasks scheduled for the given time period.`);
      }
      
      if (response.data.proposed_tasks?.length > 0) {
        setProposedTasks(response.data.proposed_tasks);
        addMessage(`I've proposed some tasks based on your input. Please review and approve them.`, 'ai');
        queueTTSMessage(`I've proposed some tasks based on your input. Please review and approve them.`);
      }
      
      if (response.data.check_in_delay && typeof response.data.check_in_delay === 'number') {
        scheduleCheckIn(response.data.check_in_delay);
      }
    } catch (error) {
      console.error('AI Response Error:', error);
      addMessage("I'm having trouble processing your request.", 'ai');
      queueTTSMessage("I'm having trouble processing your request.");
    }
  };

  const handleConfirmTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("User not authenticated");
      }
      
      const token = session.access_token;
      const response = await axios.post(
        "/api/confirm-tasks", 
        { tasksToConfirm: proposedTasks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.tts_audio) {
        const audioBlob = new Blob(
          [Buffer.from(response.data.tts_audio, 'base64')], 
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
      
      addMessage("Tasks have been added successfully!", 'ai');
      queueTTSMessage("Tasks have been added successfully!");
      setProposedTasks([]);
    } catch (err) {
      console.error("Error confirming tasks:", err);
      addMessage("There was an error adding your tasks. Please try again.", 'ai');
      queueTTSMessage("There was an error adding your tasks. Please try again.");
    }
  };

  const handleCancelTasks = () => {
    setProposedTasks([]);
    addMessage("Tasks have been discarded. Is there anything else you'd like me to help with?", 'ai');
    queueTTSMessage("Tasks have been discarded. Is there anything else you'd like me to help with?");
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ChatHeader
        currentTime={currentTime}
        onStartCall={handleStartCall}
        onEndCall={handleEndCall}
        formatDuration={formatDuration}
      />

      {nextCheckInTime && (
        <div className="bg-yellow-100 p-2 text-center text-gray-800">
          Next check in: {formatDuration(checkInCountdown)}
        </div>
      )}

      {proposedTasks.length > 0 && (
        <div className="px-4 pt-4">
          <TaskApproval
            tasks={proposedTasks}
            onApprove={handleConfirmTasks}
            onCancel={handleCancelTasks}
          />
        </div>
      )}

      <ChatTranscript messages={messages} />
      <TextInput onSubmit={handleTextSubmit} />
      <VoiceControls onToggleListening={toggleListening} />
    </div>
  );
};

export default Chat