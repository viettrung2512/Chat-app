import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

const RoomList = ({ onJoinRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.emit('get-rooms');
      
      socket.on('room-list', (roomList) => {
        setRooms(roomList);
      });

      socket.on('room-created', (room) => {
        setRooms(prev => [...prev, room]);
      });
    }

    return () => {
      if (socket) {
        socket.off('room-list');
        socket.off('room-created');
      }
    };
  }, [socket]);

  const handleCreateRoom = () => {
    if (newRoomName.trim() && socket) {
      socket.emit('create-room', newRoomName.trim());
      setNewRoomName('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Chat Room List</h2>
      
      <div className="mb-4 flex">
        <input
          type="text"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="New Room Name"
          className="flex-1 p-2 border border-gray-300 rounded-l"
          onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
        />
        <button
          onClick={handleCreateRoom}
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
        >
          Create Room
        </button>
      </div>

      <div className="space-y-2">
        {rooms.map((room) => (
          <div key={room.id} className="flex justify-between items-center p-3 bg-gray-100 rounded">
            <span>{room.name}</span>
            <button
              onClick={() => onJoinRoom(room)}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomList;