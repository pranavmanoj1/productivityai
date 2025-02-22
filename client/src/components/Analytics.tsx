import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Clock, CheckCircle2, Target } from 'lucide-react';

const Analytics = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Enhanced task data with more metrics
  const taskData = [
    {
      title: 'Daily Progress',
      progress: '8/10 tasks',
      percentage: 80,
      color: 'bg-blue-500',
      icon: CheckCircle2,
      change: '+15%',
      subtitle: 'from yesterday'
    },
    {
      title: 'Weekly Goal',
      progress: '25/30 tasks',
      percentage: 83,
      color: 'bg-green-500',
      icon: Target,
      change: '+8%',
      subtitle: 'from last week'
    },
    {
      title: 'Completion Rate',
      progress: '45/50 tasks',
      percentage: 90,
      color: 'bg-purple-500',
      icon: TrendingUp,
      change: '+12%',
      subtitle: 'this month'
    },
    {
      title: 'Average Time',
      progress: '2.5 hours/task',
      percentage: 75,
      color: 'bg-orange-500',
      icon: Clock,
      change: '-10%',
      subtitle: 'improvement'
    }
  ];

  const taskCategories = [
    { label: 'Work', count: 12, color: 'bg-blue-500', trend: '+3' },
    { label: 'Personal', count: 8, color: 'bg-purple-500', trend: '+1' },
    { label: 'Learning', count: 5, color: 'bg-green-500', trend: '+2' },
    { label: 'Health', count: 4, color: 'bg-orange-500', trend: '0' }
  ];

  const timeDistribution = [
    { time: 'Morning', percentage: 40 },
    { time: 'Afternoon', percentage: 35 },
    { time: 'Evening', percentage: 25 }
  ];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? taskData.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === taskData.length - 1 ? 0 : prev + 1));
  };

  const CurrentIcon = taskData[currentIndex].icon;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800">Task Analytics</h3>
          <div className="text-sm text-gray-500">Last updated: Just now</div>
        </div>

        {/* Main Metric Card */}
        <div className="relative bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${taskData[currentIndex].color.replace('bg-', 'bg-opacity-20')} mr-3`}>
                <CurrentIcon className={`w-5 h-5 ${taskData[currentIndex].color.replace('bg-', 'text-').replace('-500', '-600')}`} />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">{taskData[currentIndex].title}</h4>
                <p className="text-sm text-gray-500">{taskData[currentIndex].subtitle}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">{taskData[currentIndex].progress}</div>
              <div className={`text-sm ${taskData[currentIndex].change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {taskData[currentIndex].change} {taskData[currentIndex].subtitle}
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`${taskData[currentIndex].color} h-3 rounded-full transition-all duration-500 ease-in-out`}
              style={{ width: `${taskData[currentIndex].percentage}%` }}
            ></div>
          </div>

          {/* Navigation Arrows */}
          <button
            className="absolute top-1/2 left-4 -translate-y-1/2 bg-white shadow-md rounded-full p-2 hover:bg-gray-50 transition-colors"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            className="absolute top-1/2 right-4 -translate-y-1/2 bg-white shadow-md rounded-full p-2 hover:bg-gray-50 transition-colors"
            onClick={handleNext}
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Task Categories */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-800 mb-4">Task Categories</h4>
          <div className="space-y-4">
            {taskCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${category.color} mr-3`}></div>
                  <span className="text-sm text-gray-600">{category.label}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-800 mr-2">{category.count}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    category.trend.startsWith('+') 
                      ? 'bg-green-100 text-green-600' 
                      : category.trend === '0' 
                      ? 'bg-gray-100 text-gray-500' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {category.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Distribution */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-800 mb-4">Time Distribution</h4>
          <div className="space-y-6">
            {timeDistribution.map((time, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{time.time}</span>
                  <span className="font-medium text-gray-800">{time.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${time.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;