import React from 'react';
import { Phone, PhoneOff, Clock } from 'lucide-react';
import { useChatContext } from '../ChatContext';

interface ChatHeaderProps {
  currentTime: Date;
  onStartCall: () => void;
  onEndCall: () => void;
  formatDuration: (seconds: number) => string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentTime,
  onStartCall,
  onEndCall,
  formatDuration,
}) => {
  const { isOnCall, callDuration } = useChatContext();

  return (
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
              onClick={onStartCall}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>Start Call</span>
            </button>
          ) : (
            <button
              onClick={onEndCall}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End Call</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;