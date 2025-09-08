import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VideoConference from './VideoConference';
import FileTransfer from './FileTransfer';

const ChatRoom = ({ room, onLeaveRoom }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const { socket } = useSocket();

  useEffect(() => {
    if (socket && room) {
      socket.emit('join-room', room.id);

      socket.on('message', (message) => {
        setMessages(prev => [...prev, { ...message, isOwn: message.userId === socket.id }]);
      });

      socket.on('message-history', (messageHistory) => {
        const messagesWithOwnership = messageHistory.map(msg => ({
          ...msg,
          isOwn: msg.userId === socket.id
        }));
        setMessages(messagesWithOwnership);
      });

      socket.on('user-list', (userList) => {
        setUsers(userList);
      });

      socket.on('file-received', (fileData) => {
        setMessages(prev => [...prev, { 
          ...fileData, 
          isOwn: fileData.userId === socket.id,
          type: 'file'
        }]);
      });
    }

    return () => {
      if (socket) {
        socket.off('message');
        socket.off('message-history');
        socket.off('user-list');
        socket.off('file-received');
      }
    };
  }, [socket, room]);

  const handleSendMessage = (content) => {
    if (socket && content) {
      socket.emit('send-message', {
        roomId: room.id,
        content,
        type: 'text'
      });
    }
  };

  const handleSendFile = (file) => {
    if (socket && file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        socket.emit('send-file', {
          roomId: room.id,
          file: e.target.result,
          fileName: file.name,
          fileType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', room.id);
    }
    onLeaveRoom();
  };

  const handleDownloadFile = (fileId, fileName) => {
    // Create URL to download file from server
    const downloadUrl = `http://localhost:3001/api/files/${fileId}`;

    // Create a hidden a tag to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 shadow">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{room.name}</h2>
          <button
            onClick={handleLeaveRoom}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            ← Back
          </button>
        </div>
        <div className="text-sm text-gray-600">
          {users.length} people online
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            className={`px-4 py-2 ${activeTab === 'chat' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'video' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('video')}
          >
            Video Call
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'files' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('files')}
          >
            Files
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <MessageList 
              messages={messages} 
              onDownloadFile={handleDownloadFile}
            />
            <MessageInput 
              onSendMessage={handleSendMessage} 
              onSendFile={handleSendFile}
            />
          </div>
        )}

        {activeTab === 'video' && (
          <div className="p-4">
            <VideoConference roomId={room.id} userId={socket?.id} />
          </div>
        )}

        {activeTab === 'files' && (
          <div className="p-4">
            <FileTransfer 
              onSendFile={handleSendFile} 
              roomId={room.id}
            />
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Sent Files</h3>
              {messages
                .filter(m => m.type === 'file')
                .map((message, index) => (
                  <div key={index} className="p-2 border-b flex justify-between items-center">
                    <span>📎 {message.fileName}</span>
                    <button
                      onClick={() => handleDownloadFile(message.fileId, message.fileName)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Download
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;