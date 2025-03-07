import React, { useState, useEffect } from 'react';
import {  Clock, CheckCircle, BarChart, MessageSquare, Settings } from 'lucide-react';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Chat from './components/Chat';
import Auth from './components/Auth';
import Analytics from './components/Analytics';
import { mountChatInPopout } from './components/ChatPopout';
import { ChatProvider } from './components/ChatContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPopout, setIsPopout] = useState(false);
  const [popoutWindow, setPopoutWindow] = useState<Window | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Handle popout window close
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
        <html>
          <head>
            <title>Chum AI Chat</title>
            <link rel="stylesheet" href="/src/index.css">
            <script src="/src/chatPopout.js" type="module"></script>
          </head>
          <body>
            <div id="chat-root"></div>
          </body>
        </html>
      `);

      // Mount the Chat component in the popout window
      const chatRoot = newWindow.document.getElementById('chat-root');
      if (chatRoot) {
        mountChatInPopout(chatRoot);
      }

      setIsPopout(true);
      setPopoutWindow(newWindow);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'chat' && !isPopout && (
          <div className="relative h-full">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handlePopout}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                out
              </button>
            </div>

              <Chat />
  
          </div>
        )}
      </main>
    </div>
  );
}

export default App;