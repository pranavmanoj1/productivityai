import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message, Task } from '../types';

interface ChatContextType {
  messages: Message[];
  addMessage: (content: string, type: 'user' | 'ai') => void;
  proposedTasks: Task[];
  setProposedTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  isOnCall: boolean;
  setIsOnCall: React.Dispatch<React.SetStateAction<boolean>>;
  isListening: boolean;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
  callDuration: number;
  setCallDuration: React.Dispatch<React.SetStateAction<number>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposedTasks, setProposedTasks] = useState<Task[]>([]);
  const [isOnCall, setIsOnCall] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  
  const addMessage = (content: string, type: 'user' | 'ai') => {
    const newMessage = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <ChatContext.Provider value={{
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
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};