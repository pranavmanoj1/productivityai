import React, { useState } from 'react';
import { Plus, CheckCircle, Circle } from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Complete project proposal', completed: false, priority: 'high' },
    { id: 2, title: 'Review team presentations', completed: true, priority: 'medium' },
    { id: 3, title: 'Update weekly report', completed: false, priority: 'high' },
  ]);

  // State for toggling the add-task form and holding new task values
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return; // Prevent adding empty tasks

    const newTask = {
      id: tasks.length ? tasks[tasks.length - 1].id + 1 : 1,
      title: newTaskTitle,
      completed: false,
      priority: newTaskPriority,
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setShowAddTask(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
        <p className="text-gray-600">Manage your daily tasks and priorities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks List Card */}
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
            <div className="mb-4 flex items-center space-x-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task Title"
                className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring focus:border-blue-300"
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
              <button
                onClick={handleAddTask}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Save
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
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'low' ? 'bg-green-100 text-yellow-800'
                        :  'bg-yellow-100 text-yellow-800'
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
