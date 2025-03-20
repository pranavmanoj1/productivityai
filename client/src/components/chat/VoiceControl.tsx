import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useChatContext } from '../ChatContext';

interface VoiceControlsProps {
  onToggleListening: () => void;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({ onToggleListening }) => {
  const { isOnCall, isListening } = useChatContext();

  return (
    <div className="bg-white border-t p-4">
      <div className="flex justify-center">
        <button
          onClick={onToggleListening}
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
  );
};

export default VoiceControls;