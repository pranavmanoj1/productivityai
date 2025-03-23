import React from 'react';
import { Users } from 'lucide-react';
import { UserCard } from './UserCard';

export interface User {
  user_id: string;
  name: string;
}

interface UserListProps {
  users: User[];
  onCallUser: (userId: string) => void;
  isLoading: boolean;
  currentUserId?: string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  onCallUser,
  isLoading,
  currentUserId,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-gray-200 h-14 w-14"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Filter out the current user if provided.
  const filteredUsers = currentUserId
    ? users.filter(user => user.user_id !== currentUserId)
    : users;

  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-md">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No users available</h3>
        <p className="mt-2 text-sm text-gray-500">Wait for others to join or invite someone.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredUsers.map(user => (
        <UserCard
          key={user.user_id}
          name={user.name}
          onCallStart={() => onCallUser(user.user_id)}
        />
      ))}
    </div>
  );
};
