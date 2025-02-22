import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';


interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date: string | null;
  due_time: string | null;
}

interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDay = firstDayOfMonth.getDay();

  const calendarCells = [];
  for (let i = 0; i < startingDay; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const date = new Date(currentYear, currentMonth, day);
    return isSameDay(date, today);
  };

  const getTasksForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
    return tasks.filter(task => task.due_date === date);
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          {format(new Date(currentYear, currentMonth), 'MMMM yyyy')}
        </h3>
        <div className="flex space-x-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {days.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarCells.map((day, index) =>
          day ? (
            <div
              key={index}
              className={`aspect-square p-1 rounded-lg ${
                isToday(day) ? 'bg-blue-50 border border-blue-200' : ''
              }`}
            >
              <div className="text-sm mb-1 font-medium">
                {day}
              </div>
              <div className="space-y-1">
                {getTasksForDay(day).map((task, taskIndex) => (
                  <div
                    key={taskIndex}
                    className={`text-xs truncate px-1 py-0.5 rounded ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'low'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div key={index} />
          )
        )}
      </div>
    </div>
  );
};

export default CalendarView;