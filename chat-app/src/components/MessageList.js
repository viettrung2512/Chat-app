import React, { useEffect, useRef } from 'react';

const MessageList = ({ messages, onDownloadFile }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((message, index) => (
        <div
          key={message.messageId || index}
          className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.isOwn
                ? 'bg-blue-500 text-white'
                : message.type === 'system'
                ? 'bg-yellow-100 text-yellow-800 text-center'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {!message.isOwn && message.type !== 'system' && (
              <div className="font-bold text-sm">{message.username}</div>
            )}
            
            {message.type === 'text' ? (
              <p>{message.content}</p>
            ) : message.type === 'file' ? (
              <div className="cursor-pointer" onClick={() => onDownloadFile(message.fileId, message.fileName)}>
                <div className="font-semibold">📎 {message.fileName}</div>
                <div className="text-sm underline">Nhấn để tải xuống</div>
              </div>
            ) : message.type === 'system' ? (
              <p className="italic">{message.content}</p>
            ) : null}
            
            <div className="text-xs opacity-75 mt-1">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;