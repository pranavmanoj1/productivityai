// ChatContext.tsx
import React, { createContext, useContext, useState } from 'react';

export interface Message {
  id: number | string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface ChatContextProps {
  messages: Message[];
  addMessage: (message: Message) => void;
  // include any additional shared state/methods here
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
