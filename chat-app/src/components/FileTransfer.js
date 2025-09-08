import React, { useState } from 'react';

const FileTransfer = ({ onSendFile, roomId }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onSendFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onSendFile(file);
    }
  };

  return (
    <div
      className={`p-4 border-2 border-dashed rounded-lg text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <p className="text-gray-600 mb-2">Kéo thả file vào đây hoặc</p>
      <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
        <input
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
        Chọn file
      </label>
    </div>
  );
};

export default FileTransfer;