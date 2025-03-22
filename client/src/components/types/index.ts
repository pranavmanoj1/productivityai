export interface Message {
    id: number | string;
    type: 'user' | 'ai';
    content: string;
    timestamp: string;
  }
  
  export interface Task {
    title: string;
    due_date: string | null;
    priority: string;
    due_time: string | null;
    user_id: string;
    completed: boolean;
  }
  
  export interface ChatTranscriptProps {
    messages: Message[];
  }

export type Priority = 'low' | 'medium' | 'high';