import React from 'react';
import { ChatTranscriptProps } from '../types';

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

export default ChatTranscript;