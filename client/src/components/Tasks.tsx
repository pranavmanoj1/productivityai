import React, { useState } from 'react';
import { Plus, CheckCircle, Circle, Calendar, Clock } from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Complete project proposal', completed: false, priority: 'high', dueDate: null, dueTime: null },
    { id: 2, title: 'Review team presentations', completed: true, priority: 'medium', dueDate: null, dueTime: null },
    { id: 3, title: 'Update weekly report', completed: false, priority: 'high', dueDate: null, dueTime: null },
  ]);

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const parseTimeFromTitle = (title) => {
    const timeRegex = /at\s+(\d{1,2})(?::\d{2})?\s*(pm|am)?/i;
    const match = title.match(timeRegex);
    
    if (match) {
      let hours = parseInt(match[1]);
      const period = match[2]?.toLowerCase();
      
      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      
      const now = new Date();
      let suggestedDate = new Date();
      
      // If no am/pm specified and it's just a number, assume it's tomorrow
      if (!period) {
        suggestedDate.setDate(now.getDate() + 1);
      }
      
      suggestedDate.setHours(hours, 0, 0, 0);
      
      return {
        date: suggestedDate.toISOString().split('T')[0],
        time: `${String(hours).padStart(2, '0')}:00`
      };
    }
    return null;
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const parsedTime = parseTimeFromTitle(newTaskTitle);
    
    const newTask = {
      id: tasks.length ? tasks[tasks.length - 1].id + 1 : 1,
      title: newTaskTitle,
      completed: false,
      priority: newTaskPriority,
      dueDate: selectedDate || (parsedTime ? parsedTime.date : null),
      dueTime: selectedTime || (parsedTime ? parsedTime.time : null),
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setSelectedDate('');
    setSelectedTime('');
    setShowAddTask(false);
    setShowCalendar(false);
    setShowTimePicker(false);
  };

  const formatDateTime = (date, time) => {
    if (!date && !time) return '';
    const formattedDate = date ? new Date(date).toLocaleDateString() : '';
    return `due on ${formattedDate}${time ? ` at ${time}` : ''}`;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
        <p className="text-gray-600">Manage your daily tasks and priorities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Today's Tasks</h3>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </button>
          </div>

          {showAddTask && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => {
                    setNewTaskTitle(e.target.value);
                    const parsed = parseTimeFromTitle(e.target.value);
                    if (parsed) {
                      setSelectedDate(parsed.date);
                      setSelectedTime(parsed.time);
                    }
                  }}
                  placeholder="Task Title (try 'at 5' or 'at 5pm')"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring focus:border-blue-300"
                />
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  {selectedDate || 'Set Date'}
                </button>
                <button
                  onClick={() => setShowTimePicker(!showTimePicker)}
                  className="flex items-center px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  {selectedTime || 'Set Time'}
                </button>
              </div>

              {showCalendar && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring focus:border-blue-300"
                />
              )}

              {showTimePicker && (
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring focus:border-blue-300"
                />
              )}

              <button
                onClick={handleAddTask}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save Task
              </button>
            </div>
          )}

          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center p-3 rounded-lg ${
                  task.completed ? 'bg-gray-50' : 'bg-white border border-gray-200'
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mr-3 text-gray-400 hover:text-blue-500"
                >
                  {task.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      task.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                    }`}
                  >
                    {task.title}
                  </p>
                  {(task.dueDate || task.dueTime) && (
                    <p className="text-sm text-gray-500">
                      {formatDateTime(task.dueDate, task.dueTime)}
                    </p>
                  )}
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'low'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Analytics Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-6">Task Analytics</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Daily Progress</span>
                <span className="text-sm font-medium text-gray-800">8/10 tasks</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Weekly Goal</span>
                <span className="text-sm font-medium text-gray-800">25/30 tasks</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '83%' }}></div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-600 mb-4">Task Categories</h4>
              <div className="space-y-3">
                {[
                  { label: 'Work', count: 12, color: 'bg-blue-500' },
                  { label: 'Personal', count: 8, color: 'bg-purple-500' },
                  { label: 'Learning', count: 5, color: 'bg-green-500' },
                ].map((category, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${category.color} mr-3`}></div>
                    <span className="flex-1 text-sm text-gray-600">{category.label}</span>
                    <span className="text-sm font-medium text-gray-800">{category.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;