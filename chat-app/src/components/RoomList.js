"use client"

import { useState, useEffect } from "react"
import { useSocket } from "../hooks/useSocket"

const RoomList = ({ onJoinRoom }) => {
  const [rooms, setRooms] = useState([])
  const [newRoomName, setNewRoomName] = useState("")
  const { socket } = useSocket()

  useEffect(() => {
    if (socket) {
      socket.emit("get-rooms")

      socket.on("room-list", (roomList) => {
        setRooms(roomList)
      })

      socket.on("room-created", (room) => {
        setRooms((prev) => [...prev, room])
      })
    }

    return () => {
      if (socket) {
        socket.off("room-list")
        socket.off("room-created")
      }
    }
  }, [socket])

  const handleCreateRoom = () => {
    if (newRoomName.trim() && socket) {
      socket.emit("create-room", newRoomName.trim())
      setNewRoomName("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Chat Rooms
          </h1>
          <p className="text-xl text-slate-600 font-medium">Connect with others in real-time conversations</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200/60 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">+</span>
            </span>
            <span>Create New Room</span>
          </h2>

          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter room name..."
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium"
                onKeyPress={(e) => e.key === "Enter" && handleCreateRoom()}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none opacity-0 transition-opacity duration-300 peer-focus:opacity-100"></div>
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={!newRoomName.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
            >
              Create Room
            </button>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200/60">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center space-x-3">
            <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">💬</span>
            </span>
            <span>Available Rooms</span>
          </h2>

          {rooms.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room, index) => (
                <div
                  key={room.id}
                  className="group bg-gradient-to-br from-white to-slate-50 p-6 rounded-xl border border-slate-200/60 hover:border-blue-300/60 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">🏠</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors text-lg">
                          {room.name}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">Click to join</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onJoinRoom(room)}
                    className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg font-semibold transform hover:-translate-y-0.5"
                  >
                    Join Room
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🏠</div>
              <h3 className="text-2xl font-bold text-slate-700 mb-3">No rooms available</h3>
              <p className="text-slate-500 text-lg font-medium mb-6">
                Be the first to create a room and start chatting!
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomList
