import React, { useState } from 'react';

const MessageInput = ({ onSendMessage, onSendFile }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onSendFile(file);
      e.target.value = null; // Reset input file
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t flex">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Nhập tin nhắn..."
        className="flex-1 p-2 border border-gray-300 rounded-l"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600"
      >
        Gửi
      </button>
      <label className="bg-green-500 text-white px-4 py-2 cursor-pointer hover:bg-green-600 ml-2">
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
        📎
      </label>
    </form>
  );
};

export default MessageInput;