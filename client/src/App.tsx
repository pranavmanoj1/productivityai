import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// Components (adjust paths to match your structure)
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Analytics from './components/Analytics';
import Auth from './components/Auth';

// Chat-related imports
import { ChatProvider } from './components/ChatContext';
import Chat from './components/chat/Chat';
import { mountChatInPopout } from './components/ChatPopout';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Whether chat is popped out into its own window
  const [isPopout, setIsPopout] = useState(false);
  // Reference to the popout window, if open
  const [popoutWindow, setPopoutWindow] = useState<Window | null>(null);

  // 1) Check session on mount and listen for auth changes
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2) Clean up popout window on unmount or when user closes the popout
  useEffect(() => {
    const handlePopoutClose = () => {
      setIsPopout(false);
      setPopoutWindow(null);
    };

    if (popoutWindow) {
      popoutWindow.onbeforeunload = handlePopoutClose;
    }

    return () => {
      if (popoutWindow) {
        popoutWindow.close();
      }
    };
  }, [popoutWindow]);

  // 3) Handle opening the popout window and injecting the Chat
  const handlePopout = () => {
    const width = 400;
    const height = 600;
    const left = window.screen.width - width;
    const top = 0;

    const newWindow = window.open(
      '',
      'ChatPopout',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Chum AI Chat</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 0; padding: 0; }
              #chat-root { height: 100vh; }
            </style>
          </head>
          <body>
            <div id="chat-root"></div>
          </body>
        </html>
      `);
      newWindow.document.close();

      setPopoutWindow(newWindow);
      setIsPopout(true);

      // Mount Chat into the new window
      newWindow.onload = () => {
        const chatRoot = newWindow.document.getElementById('chat-root');
        if (chatRoot) {
          mountChatInPopout(chatRoot);
        }
      };
    }
  };

  // 4) Show loading spinner while fetching session
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // 5) If no session, show Auth
  if (!session) {
    return <Auth />;
  }

  // 6) Wrap your main UI in ChatProvider so that Chat has access to the chat context
  return (
    <ChatProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'tasks' && <Tasks />}

          {/* Render Chat in the main window unless we've popped it out */}
          {activeTab === 'chat' && !isPopout && (
            <div className="relative h-full">
              {/* Button to pop out the chat */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={handlePopout}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  {/* Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Popout
                </button>
              </div>
              {/* Actual Chat component */}
              <Chat />
            </div>
          )}
        </main>
      </div>
    </ChatProvider>
  );
}

export default App;
