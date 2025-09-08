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
        placeholder="Enter message..."
        className="flex-1 p-3 mr-2 border border-gray-300 rounded-xl "
      />
      <button
        type="submit"
        className="group bg-gradient-to-r from-blue-400 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
      >
        Send
      </button>
      <label className="bg-white text-white px-4 py-2 cursor-pointer hover:bg-white ml-2 rounded-xl">
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