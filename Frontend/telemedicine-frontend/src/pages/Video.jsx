import React, { useState } from 'react';
import VideoChat from '../components/VideoComponent.jsx';
import RoomSelector from '../components/RoomSelector.jsx';

function Video() {
  const [roomDetails, setRoomDetails] = useState(null);
  
  const handleRoomJoin = (roomId, userRole, userId) => {
    setRoomDetails({ roomId, userRole, userId });
  };
  
  const handleLeaveRoom = () => {
    setRoomDetails(null);
  };
  
  return (
    <div className="video-page">
      {!roomDetails ? (
        <RoomSelector onRoomJoin={handleRoomJoin} />
      ) : (
        <VideoChat 
          roomId={roomDetails.roomId}
          userRole={roomDetails.userRole}
          userId={roomDetails.userId}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default Video;