import React, { useState } from 'react';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';
import { useSocket } from './hooks/useSocket';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const { isConnected } = useSocket();

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