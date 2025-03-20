import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatProvider } from './ChatContext';
import Chat from './chat/Chat';

export const mountChatInPopout = (container: HTMLElement) => {
  const root = createRoot(container);
  root.render(
    <ChatProvider>
      <Chat />
    </ChatProvider>
  );
};