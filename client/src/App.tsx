import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, BarChart, MessageSquare, Settings } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CalendarView from './components/Calendar';
import Tasks from './components/Tasks';
import Chat from './components/Chat';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'chat' && <Chat />}
      </main>
    </div>
  );
}

export default App;