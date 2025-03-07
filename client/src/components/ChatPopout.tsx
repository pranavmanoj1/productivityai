import React from 'react';
import { createRoot } from 'react-dom/client';
import Chat from './Chat';

// Create a function to mount the Chat component in the popout window
export function mountChatInPopout(containerElement: HTMLElement) {
  const root = createRoot(containerElement);
  root.render(
    <React.StrictMode>
      <Chat isPopout={true} />
    </React.StrictMode>
  );
}