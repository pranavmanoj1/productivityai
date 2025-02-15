import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarView = () => {
  // Today's date
  const today = new Date();

  // State to keep track of the displayed month/year
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Get first and last days of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  // Number of days in the month
  const daysInMonth = lastDayOfMonth.getDate();

  // The day index (0 = Sunday, 1 = Monday, etc.) of the first day of the month
  const startingDay = firstDayOfMonth.getDay();

  // Create an array to hold the calendar cells (empty cells for offset + day numbers)
  const calendarCells = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDay; i++) {
    calendarCells.push(null);
  }

  // Add day numbers for each day in the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  // Handlers to move to the previous or next month
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

  // Check if a given day should be highlighted as "today"
  const isToday = (day) => {
    return (
      day !== null &&
      currentYear === today.getFullYear() &&
      currentMonth === today.getMonth() &&
      day === today.getDate()
    );
  };

  // Array of day names for the header
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Calendar</h2>
        <p className="text-gray-600">Manage your schedule and appointments</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} {currentYear}
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

        {/* Days header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {days.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((day, index) =>
            day ? (
              <button
                key={index}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                  isToday(day) ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                }`}
              >
                {day}
              </button>
            ) : (
              <div key={index} />
            )
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
        <div className="space-y-4">
          {[
            { time: '09:00 AM', title: 'Team Standup', type: 'Meeting' },
            { time: '11:00 AM', title: 'Project Review', type: 'Work' },
            { time: '02:00 PM', title: 'Client Call', type: 'Meeting' },
          ].map((event, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-16 text-sm font-medium text-gray-500">{event.time}</div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{event.title}</p>
                <p className="text-sm text-gray-500">{event.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
