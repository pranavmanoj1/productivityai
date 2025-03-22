import React, { useState } from 'react';
import { Circle, Check, X } from 'lucide-react';
import { Task, Priority } from '../types';

interface TaskItemProps {
  task: Task;
  onUpdate?: (updatedTask: Task) => void; 
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);

  const formatDateTime = (date: string | null, time: string | null) => {
    if (!date && !time) return '';
    
    let formattedDate = '';
    if (date) {
      try {
        const dateObj = new Date(date);
        formattedDate = dateObj.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        });
      } catch (e) {
        formattedDate = date;
      }
    }
    
    return `due on ${formattedDate}${time ? ` at ${time}` : ''}`;
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedTask);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg bg-white border border-gray-200">
        <div className="flex items-center mb-3">
          <div className="mr-3 text-gray-400">
            <Circle className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={editedTask.title}
            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Task title"
          />
        </div>
        
        <div className="ml-8 space-y-3">
          <div className="flex gap-3">
            <input
              type="date"
              value={editedTask.due_date || ''}
              onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="time"
              value={editedTask.due_time || ''}
              onChange={(e) => setEditedTask({ ...editedTask, due_time: e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Priority:</label>
            <select
              value={editedTask.priority}
              onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as Priority })}
              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              <Check className="w-4 h-4 mr-1" /> Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center p-3 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-gray-50"
      onClick={() => setIsEditing(true)}
    >
      <div className="mr-3 text-gray-400">
        <Circle className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-800">{task.title}</p>
        {(task.due_date || task.due_time) && (
          <p className="text-sm text-gray-500">
            {formatDateTime(task.due_date, task.due_time)}
          </p>
        )}
        <span
          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
            priorityColors[task.priority]
          }`}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );
};

export default TaskItem;