import React from 'react';
import { Clock, Calendar, BarChart, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, User!</h2>
        <p className="text-gray-600">Here's your productivity overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium text-gray-500">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">6.5 hrs</h3>
          <p className="text-sm text-gray-600">Focused work time</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-6 h-6 text-green-500" />
            <span className="text-sm font-medium text-gray-500">This Week</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">85%</h3>
          <p className="text-sm text-gray-600">Schedule adherence</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <BarChart className="w-6 h-6 text-purple-500" />
            <span className="text-sm font-medium text-gray-500">Tasks</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">12/15</h3>
          <p className="text-sm text-gray-600">Completed today</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <span className="text-sm font-medium text-gray-500">Progress</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">+15%</h3>
          <p className="text-sm text-gray-600">vs. last week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h3>
          <div className="space-y-4">
            {[
              { time: '09:00 AM', task: 'Team Meeting', duration: '1h' },
              { time: '10:30 AM', task: 'Project Research', duration: '2h' },
              { time: '02:00 PM', task: 'Client Presentation', duration: '1.5h' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-800">{item.task}</p>
                    <p className="text-sm text-gray-500">{item.time}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-500">{item.duration}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Coach Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                Based on your recent activity patterns, I suggest taking a break at 11:30 AM to maintain peak productivity.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-sm text-green-800">
                You've been consistently meeting your morning goals. Consider increasing your target by 10%.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-800">
                Your focus sessions are most effective between 9 AM and 11 AM. I've adjusted your schedule accordingly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;