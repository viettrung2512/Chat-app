"use client"

import { useState, useEffect } from "react"
import { useSocket } from "../hooks/useSocket"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import VideoConference from "./VideoConference"
import FileTransfer from "./FileTransfer"

const ChatRoom = ({ room, onLeaveRoom }) => {
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState("chat")
  const { socket } = useSocket()

  useEffect(() => {
    if (socket && room) {
      socket.emit("join-room", room.id)

      socket.on("message", (message) => {
        setMessages((prev) => [...prev, { ...message, isOwn: message.userId === socket.id }])
      })

      socket.on("message-history", (messageHistory) => {
        const messagesWithOwnership = messageHistory.map((msg) => ({
          ...msg,
          isOwn: msg.userId === socket.id,
        }))
        setMessages(messagesWithOwnership)
      })

      socket.on("user-list", (userList) => {
        setUsers(userList)
      })

      socket.on("file-received", (fileData) => {
        setMessages((prev) => [
          ...prev,
          {
            ...fileData,
            isOwn: fileData.userId === socket.id,
            type: "file",
          },
        ])
      })
    }

    return () => {
      if (socket) {
        socket.off("message")
        socket.off("message-history")
        socket.off("user-list")
        socket.off("file-received")
      }
    }
  }, [socket, room])

  const handleSendMessage = (content) => {
    if (socket && content) {
      socket.emit("send-message", {
        roomId: room.id,
        content,
        type: "text",
      })
    }
  }

  const handleSendFile = (file) => {
    if (socket && file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        socket.emit("send-file", {
          roomId: room.id,
          file: e.target.result,
          fileName: file.name,
          fileType: file.type,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit("leave-room", room.id)
    }
    onLeaveRoom()
  }

  const handleDownloadFile = (fileId, fileName) => {
    const downloadUrl = `http://localhost:3001/api/files/${fileId}`
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                {room.name}
              </h2>
              <div className="text-sm text-slate-500 font-medium">
                {users.length} {users.length === 1 ? "person" : "people"} online
              </div>
            </div>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="group bg-gradient-to-r from-slate-500 to-slate-600 text-white px-6 py-3 rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
          >
            <span className="flex items-center space-x-2">
              <span className="transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
              <span>Back</span>
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/40">
        <div className="flex relative">
          {[
            { id: "chat", label: "Chat", icon: "💬" },
            { id: "video", label: "Video Call", icon: "📹" },
            { id: "files", label: "Files", icon: "📁" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`relative px-8 py-4 font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-blue-600 bg-blue-50/80"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50/50"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="flex items-center space-x-2">
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" && (
          <div className="flex flex-col h-full bg-gradient-to-b from-white/40 to-slate-50/60">
            <MessageList messages={messages} onDownloadFile={handleDownloadFile} />
            <MessageInput onSendMessage={handleSendMessage} onSendFile={handleSendFile} />
          </div>
        )}

        {activeTab === "video" && (
          <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60">
              <VideoConference roomId={room.id} userId={socket?.id} />
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div className="p-8 bg-gradient-to-br from-slate-50 to-purple-50">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60">
              <FileTransfer onSendFile={handleSendFile} roomId={room.id} />
              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
                  <span className="text-2xl">📎</span>
                  <span>Shared Files</span>
                </h3>
                <div className="space-y-3">
                  {messages
                    .filter((m) => m.type === "file")
                    .map((message, index) => (
                      <div
                        key={index}
                        className="group bg-gradient-to-r from-white to-slate-50 p-4 rounded-xl border border-slate-200/60 hover:border-blue-300/60 transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg">📄</span>
                            </div>
                            <span className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                              {message.fileName}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(message.fileId, message.fileName)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  {messages.filter((m) => m.type === "file").length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <div className="text-6xl mb-4">📁</div>
                      <p className="text-lg font-medium">No files shared yet</p>
                      <p className="text-sm">Files shared in this room will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatRoom
