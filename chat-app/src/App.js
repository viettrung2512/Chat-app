import React, { useState, useEffect } from 'react';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';
import { useSocket } from './hooks/useSocket';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      console.log('Socket connected:', socket.connected);
      console.log('Backend URL:', process.env.REACT_APP_SOCKET_SERVER_URL);
      
      socket.on('connect', () => {
        console.log('Connected to backend successfully!');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from backend');
      });

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }
  }, [socket]);

  const handleJoinRoom = (room) => {
    setCurrentRoom(room);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Chat Web</h1>
          <p>Backend: {process.env.REACT_APP_SOCKET_SERVER_URL || 'Not configured'}</p>
        </header>

        <main>
          {!currentRoom ? (
            <RoomList onJoinRoom={handleJoinRoom} />
          ) : (
            <ChatRoom room={currentRoom} onLeaveRoom={handleLeaveRoom} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;