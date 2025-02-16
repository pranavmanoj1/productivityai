import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic } from 'lucide-react';
import axios from 'axios';

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // Tracks if the user is "on a call" with the AI
  const [isOnCall, setIsOnCall] = useState(false);

  // Whether the user wants periodic check-ins
  const [checkInEnabled, setCheckInEnabled] = useState(false);
  const [checkInMinutes, setCheckInMinutes] = useState(5);

  // We'll store the interval ID in a ref so we can clear it on unmount or "end call"
  const checkInIntervalRef = useRef<number | undefined>(undefined);

  // --- NEW: TTS Queue ---
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  /**
   * Push a message onto the TTS queue.
   * The queue system will speak it when ready (when not currently speaking).
   */
  const queueTTSMessage = (message: string) => {
    setMessageQueue((prevQueue) => [...prevQueue, message]);
  };

  /**
   * Whenever the queue or `isSpeaking` changes, if we're NOT speaking
   * and the queue isn't empty, we play the first item.
   */
  useEffect(() => {
    if (!isSpeaking && messageQueue.length > 0) {
      playNextTTS(messageQueue[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageQueue, isSpeaking]);

  /**
   * Actually fetch the MP3 from your server and play it.
   * Once it ends (or errors), remove it from the queue and allow the next one to play.
   */
  const playNextTTS = async (message: string) => {
    setIsSpeaking(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await axios.post(
        `${backendUrl}/api/tts`,
        { text: message },
        { responseType: 'arraybuffer' }
      );
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // When audio finishes (or errors), remove the played message and free up for the next
      const handleCleanup = () => {
        setMessageQueue((prev) => prev.slice(1)); // remove the first item
        setIsSpeaking(false);
      };

      audio.onended = handleCleanup;
      audio.onerror = handleCleanup;
      audio.play();
    } catch (error) {
      console.error('Error with Google TTS:', error);
      // Even if error, remove the first item so we don't get stuck
      setMessageQueue((prev) => prev.slice(1));
      setIsSpeaking(false);
    }
  };

  /**
   * Handle AI messages: add to chat + queue TTS
   */
  const addAIMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, type: 'ai', content },
    ]);
    // Instead of playing directly, queue the message
    queueTTSMessage(content);
  };

  /**
   * Handle user messages: add to chat (no TTS)
   */
  const addUserMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, type: 'user', content },
    ]);
  };

  /**
   * Send user input to the server and get AI response.
   * Note: We're now calling the `/api/ai-response` endpoint.
   */
  const handleSend = async () => {
    if (!input.trim()) return;

    addUserMessage(input);
    const currentInput = input;
    setInput('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await axios.post(`${backendUrl}/api/ai-response`, {
        message: currentInput,
      });
      const aiResponse: string = response.data.response;
      addAIMessage(aiResponse);
    } catch (error) {
      console.error(error);
      addAIMessage("Sorry, I'm having trouble connecting right now.");
    }
  };

  /**
   * Start listening for voice input using browser SpeechRecognition
   */
  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.start();
  };

  /**
   * Start the "call" with the AI
   */
  const handleStartCall = () => {
    setIsOnCall(true);
    addAIMessage(
      "Hello! I'm your AI productivity coach. How can I help you today? Would you like me to check in with you periodically?"
    );
  };

  /**
   * End the "call" with the AI
   */
  const handleEndCall = () => {
    setIsOnCall(false);
    clearInterval(checkInIntervalRef.current);
    addAIMessage(
      "Okay, I'll end our call here. Feel free to reach out again anytime. Have a great day!"
    );
  };

  /**
   * Periodic check-ins
   */
  useEffect(() => {
    if (checkInIntervalRef.current) {
      clearInterval(checkInIntervalRef.current);
    }
    if (isOnCall && checkInEnabled) {
      const intervalId = window.setInterval(() => {
        addAIMessage("Just checking in—how are you doing?");
      }, checkInMinutes * 60 * 1000);

      checkInIntervalRef.current = intervalId;
    }
    return () => {
      if (checkInIntervalRef.current) clearInterval(checkInIntervalRef.current);
    };
  }, [checkInEnabled, isOnCall, checkInMinutes]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-8 pb-4 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-800">AI Coach On Call</h2>
        <p className="text-gray-600">
          Start a call to receive live AI guidance, voice prompts, and check-ins.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleStartCall}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            disabled={isOnCall}
          >
            Start Call
          </button>
          <button
            onClick={handleEndCall}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            disabled={!isOnCall}
          >
            End Call
          </button>
        </div>
        {isOnCall && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="checkInEnabled"
                checked={checkInEnabled}
                onChange={(e) => setCheckInEnabled(e.target.checked)}
              />
              <label htmlFor="checkInEnabled" className="text-sm">
                Enable periodic check-ins
              </label>
            </div>
            {checkInEnabled && (
              <div className="flex items-center gap-2">
                <label htmlFor="checkInMinutes" className="text-sm">
                  Check in every
                </label>
                <input
                  type="number"
                  id="checkInMinutes"
                  value={checkInMinutes}
                  onChange={(e) => setCheckInMinutes(Number(e.target.value))}
                  className="w-16 p-1 border rounded text-sm"
                  min={1}
                />
                <span className="text-sm">minutes</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Display */}
      <div className="flex-1 overflow-y-auto px-8 pb-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Controls */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isOnCall
                ? 'Speak or type your response...'
                : 'Start the call to begin chatting...'
            }
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={!isOnCall}
          />
          <button
            onClick={startVoiceInput}
            className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            title="Voice Input"
            disabled={!isOnCall}
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            title="Send Message"
            disabled={!isOnCall}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
