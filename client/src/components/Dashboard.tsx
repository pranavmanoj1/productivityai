import React, { useState, useEffect } from 'react';
import { Clock, Calendar, BarChart, TrendingUp, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import { format, parseISO, isToday } from 'date-fns';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date: string | null;
  due_time: string | null;
  created_at: string;
}

interface AIInsight {
  message: string;
  type: 'info' | 'success' | 'warning';
}

const Dashboard = () => {
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [focusedTime, setFocusedTime] = useState<number>(0);
  const [scheduleAdherence, setScheduleAdherence] = useState<number>(0);
  const [progressChange, setProgressChange] = useState<number>(0);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTodaysTasks();
    fetchTaskStats();
    fetchAIInsights();
  }, []);

  const fetchTodaysTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('due_date', today)
        .order('due_time', { ascending: true });
      
      if (error) throw error;
      
      setTodaysTasks(data || []);
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // Get all tasks for the current user
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (!allTasks) return;
      
      // Calculate completed tasks for today
      const today = new Date().toISOString().split('T')[0];
      const todaysTasks = allTasks.filter(task => task.due_date === today);
      const completed = todaysTasks.filter(task => task.completed).length;
      const total = todaysTasks.length;
      
      setCompletedTasks(completed);
      setTotalTasks(total);
      
      // Calculate schedule adherence (completed tasks on time / total tasks due)
      const pastWeekTasks = allTasks.filter(task => {
        const taskDate = new Date(task.due_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return taskDate >= weekAgo && taskDate <= new Date();
      });
      
      const completedOnTime = pastWeekTasks.filter(task => task.completed).length;
      const adherence = pastWeekTasks.length > 0 
        ? Math.round((completedOnTime / pastWeekTasks.length) * 100) 
        : 0;
      
      setScheduleAdherence(adherence);
      
      // Calculate progress change (this week vs last week)
      const thisWeekTasks = allTasks.filter(task => {
        const taskDate = new Date(task.due_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return taskDate >= weekAgo && taskDate <= new Date();
      });
      
      const lastWeekTasks = allTasks.filter(task => {
        const taskDate = new Date(task.due_date);
        const twoWeeksAgo = new Date();
        const oneWeekAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return taskDate >= twoWeeksAgo && taskDate < oneWeekAgo;
      });
      
      const thisWeekCompleted = thisWeekTasks.filter(task => task.completed).length;
      const lastWeekCompleted = lastWeekTasks.filter(task => task.completed).length;
      
      const thisWeekCompletionRate = thisWeekTasks.length > 0 
        ? (thisWeekCompleted / thisWeekTasks.length) 
        : 0;
      
      const lastWeekCompletionRate = lastWeekTasks.length > 0 
        ? (lastWeekCompleted / lastWeekTasks.length) 
        : 0;
      
      let progressDiff = 0;
      if (lastWeekCompletionRate > 0) {
        progressDiff = Math.round(((thisWeekCompletionRate - lastWeekCompletionRate) / lastWeekCompletionRate) * 100);
      } else if (thisWeekCompletionRate > 0) {
        progressDiff = 100; // If last week was 0 and this week is > 0, that's a 100% increase
      }
      
      setProgressChange(progressDiff);
      
      // Estimate focused work time (assuming each task takes ~30 minutes)
      const estimatedFocusTime = completed * 0.5;
      setFocusedTime(estimatedFocusTime);
      
    } catch (error) {
      console.error('Error fetching task stats:', error);
    }
  };

  const fetchAIInsights = async () => {
    try {
      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Default insights if not authenticated
        setAiInsights([
          { 
            message: "Sign in to get personalized productivity insights from our AI coach.", 
            type: 'info' 
          }
        ]);
        return;
      }
      
      // Call the AI insights API
      const response = await axios.post(
        'https://productivityai.onrender.com/api/ai-response',
        { message: "Give me productivity insights based on my tasks" },
        { 
          headers: { 
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data && response.data.freeform_answer) {
        // Split the freeform answer into separate insights
        const insightText = response.data.freeform_answer;
        const insightSentences = insightText.split(/(?<=\.)\s+/);
        
        const insights: AIInsight[] = insightSentences.map((sentence: string, index: number) => {
          // Assign different types based on content or just alternate for visual variety
          let type: 'info' | 'success' | 'warning' = 'info';
          
          if (sentence.toLowerCase().includes('suggest') || 
              sentence.toLowerCase().includes('recommend')) {
            type = 'info';
          } else if (sentence.toLowerCase().includes('great') || 
                    sentence.toLowerCase().includes('well done') ||
                    sentence.toLowerCase().includes('good job')) {
            type = 'success';
          } else if (sentence.toLowerCase().includes('caution') || 
                    sentence.toLowerCase().includes('careful') ||
                    sentence.toLowerCase().includes('attention')) {
            type = 'warning';
          } else {
            // Alternate types for variety
            const types: ('info' | 'success' | 'warning')[] = ['info', 'success', 'warning'];
            type = types[index % types.length];
          }
          
          return { message: sentence.trim(), type };
        });
        
        setAiInsights(insights.filter(insight => insight.message.length > 0).slice(0, 3));
      } else {
        // Fallback insights
        setAiInsights([
          { message: "Try breaking down large tasks into smaller, manageable steps.", type: 'info' },
          { message: "Your most productive hours appear to be in the morning.", type: 'success' },
          { message: "Consider scheduling focused work sessions with regular breaks.", type: 'warning' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      // Fallback insights
      setAiInsights([
        { message: "Try breaking down large tasks into smaller, manageable steps.", type: 'info' },
        { message: "Your most productive hours appear to be in the morning.", type: 'success' },
        { message: "Consider scheduling focused work sessions with regular breaks.", type: 'warning' }
      ]);
    }
  };

  const formatTaskTime = (task: Task) => {
    if (!task.due_time) return '';
    
    // Convert 24-hour time format to 12-hour format with AM/PM
    const [hours, minutes] = task.due_time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Estimate task duration based on priority
  const getTaskDuration = (task: Task) => {
    switch (task.priority) {
      case 'high': return '2h';
      case 'medium': return '1.5h';
      case 'low': return '1h';
      default: return '1h';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Welcome back!</h2>
        <p className="text-gray-600">Here's your productivity overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium text-gray-500">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{focusedTime.toFixed(1)} hrs</h3>
          <p className="text-sm text-gray-600">Focused work time</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-6 h-6 text-green-500" />
            <span className="text-sm font-medium text-gray-500">This Week</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{scheduleAdherence}%</h3>
          <p className="text-sm text-gray-600">Schedule adherence</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <BarChart className="w-6 h-6 text-purple-500" />
            <span className="text-sm font-medium text-gray-500">Tasks</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{completedTasks}/{totalTasks}</h3>
          <p className="text-sm text-gray-600">Completed today</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <span className="text-sm font-medium text-gray-500">Progress</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">
            {progressChange > 0 ? `+${progressChange}%` : `${progressChange}%`}
          </h3>
          <p className="text-sm text-gray-600">vs. last week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h3>
          {todaysTasks.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500">No tasks scheduled for today</p>
              <p className="text-sm text-gray-400 mt-1">Add tasks to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaysTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      task.priority === 'high' 
                        ? 'bg-red-500' 
                        : task.priority === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-500">{formatTaskTime(task)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-500">{getTaskDuration(task)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Coach Insights</h3>
          <div className="space-y-4">
            {aiInsights.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">No insights available</p>
                <p className="text-sm text-gray-400 mt-1">Complete more tasks to get personalized insights</p>
              </div>
            ) : (
              aiInsights.map((insight, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${
                    insight.type === 'info' 
                      ? 'bg-blue-50 border-blue-100' 
                      : insight.type === 'success'
                        ? 'bg-green-50 border-green-100'
                        : 'bg-yellow-50 border-yellow-100'
                  }`}
                >
                  <p className={`text-sm ${
                    insight.type === 'info' 
                      ? 'text-blue-800' 
                      : insight.type === 'success'
                        ? 'text-green-800'
                        : 'text-yellow-800'
                  }`}>
                    {insight.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;