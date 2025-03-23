import React from 'react';
import { UserCircle } from 'lucide-react';

interface UserCardProps {
  name: string;
  onCallStart: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ name, onCallStart }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-50 rounded-full p-3">
            <UserCircle className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Available now
            </span>
          </div>
          <button
            onClick={onCallStart}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Start Call
          </button>
        </div>
      </div>
    </div>
  );
};