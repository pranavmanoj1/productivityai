// TasksContext.tsx
import React, { createContext, useState, ReactNode } from 'react';

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: string;
}

interface TasksContextType {
  tasks: Task[];
  addTask: (task: Task) => void;
  toggleTask: (id: number) => void;
}

export const TasksContext = createContext<TasksContextType>({
  tasks: [],
  addTask: () => {},
  toggleTask: () => {},
});

export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Complete project proposal', completed: false, priority: 'high' },
    { id: 2, title: 'Review team presentations', completed: true, priority: 'medium' },
    { id: 3, title: 'Update weekly report', completed: false, priority: 'high' },
  ]);

  const addTask = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <TasksContext.Provider value={{ tasks, addTask, toggleTask }}>
      {children}
    </TasksContext.Provider>
  );
};
