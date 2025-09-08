import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';

const VideoConference = ({ roomId, userId }) => {
  const [localStream, setLocalStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const peersRef = useRef({});
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const { socket } = useSocket();

  const createPeer = useCallback((isInitiator, stream) => {
    const { SimplePeer } = window;
    if (!SimplePeer) {
      console.error('SimplePeer not available');
      return null;
    }

    const peer = new SimplePeer({
      initiator: isInitiator,
      stream: stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (data) => {
      if (data.type === 'offer') {
        socket.emit('webrtc-offer', {
          roomId,
          offer: data
        });
      } else if (data.type === 'answer') {
        socket.emit('webrtc-answer', {
          roomId,
          answer: data
        });
      } else if (data.candidate) {
        socket.emit('webrtc-ice-candidate', {
          roomId,
          candidate: data
        });
      }
    });

    peer.on('stream', (stream) => {
      remoteVideoRef.current.srcObject = stream;
    });

    peer.on('error', (err) => {
      console.error('WebRTC Error:', err);
    });

    return peer;
  }, [roomId, socket]);

  const handleOffer = useCallback(async (data) => {
    if (!isCallActive) {
      try {
        const stream = await initializeVideo();
        const peer = createPeer(false, stream);
        if (peer) {
          peersRef.current[data.from] = peer;
          peer.signal(data.offer);
          setIsCallActive(true);
        }
      } catch (error) {
        console.error('Failed to handle offer:', error);
      }
    }
  }, [isCallActive, createPeer]);

  const handleAnswer = useCallback((data) => {
    const peer = peersRef.current[data.from];
    if (peer) {
      peer.signal(data.answer);
    }
  }, []);

  const handleNewICECandidate = useCallback((data) => {
    const peer = peersRef.current[data.from];
    if (peer) {
      peer.signal(data.candidate);
    }
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('webrtc-offer', handleOffer);
      socket.on('webrtc-answer', handleAnswer);
      socket.on('webrtc-ice-candidate', handleNewICECandidate);
    }

    return () => {
      if (socket) {
        socket.off('webrtc-offer', handleOffer);
        socket.off('webrtc-answer', handleAnswer);
        socket.off('webrtc-ice-candidate', handleNewICECandidate);
      }
    };
  }, [socket, handleOffer, handleAnswer, handleNewICECandidate]);

  const initializeVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      localVideoRef.current.srcObject = stream;
      return stream;
    } catch (error) {
      console.error('Lỗi khi truy cập camera/micro:', error);
      throw error;
    }
  };

  const startCall = async () => {
    try {
      const stream = await initializeVideo();
      const peer = createPeer(true, stream);
      if (peer) {
        peersRef.current[socket.id] = peer;
        setIsCallActive(true);
      }
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsCallActive(false);
    
    // Gửi thông báo kết thúc cuộc gọi
    Object.values(peersRef.current).forEach(peer => peer.destroy());
    peersRef.current = {};
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Hội nghị truyền hình</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Camera của bạn</h4>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-48 bg-black rounded"
          />
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Người khác</h4>
          <video
            ref={remoteVideoRef}
            autoPlay
            className="w-full h-48 bg-black rounded"
          />
        </div>
      </div>

      <div className="flex space-x-2">
        {!isCallActive ? (
          <button
            onClick={startCall}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Bắt đầu gọi
          </button>
        ) : (
          <button
            onClick={endCall}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Kết thúc
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoConference;