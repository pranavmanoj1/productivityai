import React from 'react';
import { Circle } from 'lucide-react';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
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

  return (
    <div className="flex items-center p-3 rounded-lg bg-white border border-gray-200">
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
  );
};

export default TaskItem;