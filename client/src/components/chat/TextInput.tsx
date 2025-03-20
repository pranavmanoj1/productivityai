import React, { useState } from 'react';

interface TextInputProps {
  onSubmit: (message: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ onSubmit }) => {
  const [textMessage, setTextMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textMessage.trim()) return;
    onSubmit(textMessage);
    setTextMessage('');
  };

  return (
    <div className="bg-white border-t p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={textMessage}
          onChange={(e) => setTextMessage(e.target.value)}
          placeholder="Don't feel like talking? Text me..."
          className="flex-1 border rounded-lg p-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default TextInput;