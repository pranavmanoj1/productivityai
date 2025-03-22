import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Circle, Calendar, Clock, Trash2, Edit2, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import CalendarView from './CalendarView';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date: string | null;
  due_time: string | null;
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setTasks([]);
        return;
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDate(task.due_date || '');
    setEditTime(task.due_time || '');
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditTitle('');
    setEditPriority('');
    setEditDate('');
    setEditTime('');
  };

  const saveEdit = async (taskId: string) => {
    try {
      const updates = {
        title: editTitle,
        priority: editPriority,
        due_date: editDate || null,
        due_time: editTime || null,
      };

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates }
          : task
      ));

      cancelEditing();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const parseTimeFromTitle = (title: string) => {
    const timeRegex = /at\s+(\d{1,2})(?::\d{2})?\s*(pm|am)?/i;
    const match = title.match(timeRegex);

    if (match) {
      let hours = parseInt(match[1]);
      const period = match[2]?.toLowerCase();

      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      const now = new Date();
      let suggestedDate = new Date();

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

  const toggleTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', id);

      if (error) throw error;

      setTasks(tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const parsedTime = parseTimeFromTitle(newTaskTitle);

      const newTask = {
        title: newTaskTitle,
        completed: false,
        priority: newTaskPriority,
        due_date: selectedDate || (parsedTime ? parsedTime.date : null),
        due_time: selectedTime || (parsedTime ? parsedTime.time : null),
        user_id: (await supabase.auth.getUser()).data.user?.id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      setTasks([data, ...tasks]);
      setNewTaskTitle('');
      setNewTaskPriority('medium');
      setSelectedDate('');
      setSelectedTime('');
      setShowAddTask(false);
      setShowCalendar(false);
      setShowTimePicker(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(tasks.filter(task => task.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const formatDateTime = (date: string | null, time: string | null) => {
    if (!date && !time) return '';
    const formattedDate = date ? format(parseISO(date), 'PPP') : '';
    return `due on ${formattedDate}${time ? ` at ${time}` : ''}`;
  };

  if (loading) {
    return <div className="p-8">Wait a sec</div>;
  }

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
            {tasks.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No tasks yet. Add one to get started!</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center p-3 rounded-lg ${
                    task.completed ? 'bg-gray-50' : 'bg-white border border-gray-200'
                  }`}
                >
                  {editingTask === task.id ? (
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring focus:border-blue-300"
                        />
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring focus:border-blue-300"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring focus:border-blue-300"
                        />
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring focus:border-blue-300"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => saveEdit(task.id)}
                          className="flex items-center px-2 py-1 text-sm text-green-600 hover:text-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                        {(task.due_date || task.due_time) && (
                          <p className="text-sm text-gray-500">
                            {formatDateTime(task.due_date, task.due_time)}
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
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditing(task)}
                          className="text-gray-400 hover:text-blue-500"
                          aria-label="Edit task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === task.id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(task.id)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <CalendarView tasks={tasks} />
      </div>
    </div>
  );
};

export default Tasks;