import React from 'react';
import TaskItem from './TaskItem';
import { Task } from '../types';

interface TaskApprovalProps {
  tasks: Task[];
  onApprove: () => void;
  onCancel: () => void;
}

const TaskApproval: React.FC<TaskApprovalProps> = ({ 
  tasks, 
  onApprove, 
  onCancel,
}) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Proposed Tasks</h3>
        <div className="space-x-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Approve All
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <TaskItem 
            key={index} 
            task={task}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskApproval;