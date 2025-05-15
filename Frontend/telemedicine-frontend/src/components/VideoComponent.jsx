import React, { useEffect, useRef, useState } from 'react';

const stunServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// URL del servidor de señalización WebSocket
const SIGNALING_SERVER_URL = 'ws://localhost:3000';

const VideoChat = ({ roomId, userRole, userId, onLeaveRoom }) => {
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({}); // Ahora guardamos múltiples videos remotos
  const peerConnectionsRef = useRef({}); // Múltiples conexiones peer
  const localStreamRef = useRef(null);
  const wsRef = useRef(null);

  const [error, setError] = useState('');
  const [isConnectedToServer, setIsConnectedToServer] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [iceCandidatesQueue, setIceCandidatesQueue] = useState({});
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        senderId: userId,
        senderRole: userRole
      }));
    } else {
      console.error('WebSocket no está abierto. No se puede enviar mensaje:', message);
      setError('Error: No se pudo conectar al servidor de señalización.');
    }
  };

  const createPeerConnection = (remoteUserId) => {
    console.log(`Creando conexión peer con usuario: ${remoteUserId}`);
    
    const pc = new RTCPeerConnection(stunServers);
    
    // Añadir tracks locales al peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }
    
    // Manejar candidatos ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'candidate',
          candidate: event.candidate,
          targetUserId: remoteUserId
        });
      }
    };
    
    // Manejar cambios de estado de la conexión ICE
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state con ${remoteUserId}: ${pc.iceConnectionState}`);
    };
    
    // Manejar streams remotas
    pc.ontrack = (event) => {
      console.log(`Track recibido del usuario ${remoteUserId}`);
      
      if (!remoteVideosRef.current[remoteUserId]) {
        // Crear un nuevo elemento de video para este usuario
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.id = `remote-video-${remoteUserId}`;
        
        // Añadir el video al DOM
        const remoteVideosContainer = document.getElementById('remote-videos-container');
        if (remoteVideosContainer) {
          const videoContainer = document.createElement('div');
          videoContainer.className = 'remote-video-wrapper';
          
          // Añadir etiqueta con el rol
          const roleLabel = document.createElement('div');
          roleLabel.className = 'role-label';
          const participant = participants.find(p => p.userId === remoteUserId);
          roleLabel.textContent = participant ? participant.userRole : 'Usuario';
          
          videoContainer.appendChild(videoElement);
          videoContainer.appendChild(roleLabel);
          remoteVideosContainer.appendChild(videoContainer);
          
          remoteVideosRef.current[remoteUserId] = videoElement;
        }
      }
      
      // Asignar el stream al elemento de video
      if (remoteVideosRef.current[remoteUserId]) {
        remoteVideosRef.current[remoteUserId].srcObject = event.streams[0];
        setIsCallInProgress(true);
      }
    };
    
    peerConnectionsRef.current[remoteUserId] = pc;
    return pc;
  };

  const processPendingIceCandidates = (remoteUserId) => {
    const pc = peerConnectionsRef.current[remoteUserId];
    const candidates = iceCandidatesQueue[remoteUserId] || [];
    
    if (pc && pc.remoteDescription && candidates.length > 0) {
      console.log(`Procesando ${candidates.length} candidatos ICE pendientes para ${remoteUserId}`);
      
      // Copia actual y limpia la cola para este usuario
      const candidatesToProcess = [...candidates];
      setIceCandidatesQueue(prev => ({
        ...prev,
        [remoteUserId]: []
      }));
      
      // Añadir cada candidato
      for (const candidate of candidatesToProcess) {
        try {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn(`Error al añadir candidato ICE para ${remoteUserId}:`, e.message);
        }
      }
    }
  };

  const handleOffer = async (message) => {
    const { senderId, offer } = message;
    
    console.log(`Recibida oferta de ${senderId}`);
    
    let pc = peerConnectionsRef.current[senderId];
    if (!pc) {
      pc = createPeerConnection(senderId);
    }
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log(`Oferta remota establecida para ${senderId}`);
      
      // Procesar candidatos ICE pendientes
      processPendingIceCandidates(senderId);
      
      // Crear respuesta
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      // Enviar respuesta
      sendMessage({
        type: 'answer',
        answer,
        targetUserId: senderId
      });
      
    } catch (e) {
      console.error(`Error al procesar oferta de ${senderId}:`, e);
      setError(`Error al procesar oferta: ${e.message}`);
    }
  };

  const handleAnswer = async (message) => {
    const { senderId, answer } = message;
    
    console.log(`Recibida respuesta de ${senderId}`);
    
    const pc = peerConnectionsRef.current[senderId];
    if (!pc) {
      console.error(`No hay conexión peer para ${senderId}`);
      return;
    }
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`Respuesta remota establecida para ${senderId}`);
      
      // Procesar candidatos ICE pendientes
      processPendingIceCandidates(senderId);
      
    } catch (e) {
      console.error(`Error al procesar respuesta de ${senderId}:`, e);
      setError(`Error al procesar respuesta: ${e.message}`);
    }
  };

  const handleCandidate = async (message) => {
    const { senderId, candidate } = message;
    
    const pc = peerConnectionsRef.current[senderId];
    
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn(`Error al añadir candidato ICE de ${senderId}:`, e.message);
      }
    } else {
      // Guardar candidato para procesamiento posterior
      setIceCandidatesQueue(prev => ({
        ...prev,
        [senderId]: [...(prev[senderId] || []), candidate]
      }));
    }
  };

  const handleUserJoined = async (message) => {
    const { userId: newUserId, userRole: newUserRole } = message;
    
    console.log(`Nuevo usuario unido a la sala: ${newUserId} (${newUserRole})`);
    
    // Actualizar lista de participantes
    setParticipants(prev => [
      ...prev,
      { userId: newUserId, userRole: newUserRole }
    ]);
    
    // Si somos doctor, iniciar llamada con el nuevo participante
    // O si somos paciente y se une un doctor
    if ((userRole === 'doctor') || (userRole === 'patient' && newUserRole === 'doctor')) {
      // Crear conexión y enviar oferta
      const pc = createPeerConnection(newUserId);
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        sendMessage({
          type: 'offer',
          offer,
          targetUserId: newUserId
        });
        
      } catch (e) {
        console.error(`Error al crear oferta para ${newUserId}:`, e);
        setError(`Error al crear oferta: ${e.message}`);
      }
    }
  };

  const handleUserLeft = (message) => {
    const { userId: leftUserId } = message;
    
    console.log(`Usuario ${leftUserId} ha dejado la sala`);
    
    // Cerrar la conexión peer con ese usuario
    const pc = peerConnectionsRef.current[leftUserId];
    if (pc) {
      pc.close();
      delete peerConnectionsRef.current[leftUserId];
    }
    
    // Eliminar su video
    const videoElement = remoteVideosRef.current[leftUserId];
    if (videoElement) {
      const container = videoElement.parentElement;
      if (container) {
        container.remove();
      }
      delete remoteVideosRef.current[leftUserId];
    }
    
    // Actualizar lista de participantes
    setParticipants(prev => prev.filter(p => p.userId !== leftUserId));
  };

  const startMediaAndJoinRoom = async () => {
    try {
      // Obtener acceso a la cámara y micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      localStreamRef.current = stream;
      
      // Conectar al servidor WebSocket
      wsRef.current = new WebSocket(SIGNALING_SERVER_URL);
      
      wsRef.current.onopen = () => {
        console.log('Conectado al servidor de señalización WebSocket.');
        setIsConnectedToServer(true);
        setError('');
        
        // Unirse a la sala
        sendMessage({
          type: 'join-room',
          roomId,
          userId,
          userRole
        });
      };
      
      wsRef.current.onmessage = async (event) => {
        try {
          const message = JSON.parse(await event.data);
          console.log('Mensaje recibido:', message.type);
          
          switch (message.type) {
            case 'connection-success':
              break;
              
            case 'room-joined':
              setRoomInfo(message);
              // Actualizar lista de participantes
              if (message.usersInRoom) {
                setParticipants(message.usersInRoom.filter(u => u.userId !== userId));
              }
              break;
              
            case 'user-joined':
              handleUserJoined(message);
              break;
              
            case 'user-left':
              handleUserLeft(message);
              break;
              
            case 'offer':
              handleOffer(message);
              break;
              
            case 'answer':
              handleAnswer(message);
              break;
              
            case 'candidate':
              handleCandidate(message);
              break;
              
            default:
              console.log('Mensaje desconocido recibido:', message);
          }
        } catch (e) {
          console.error('Error al procesar mensaje:', e);
          setError(`Error al procesar mensaje: ${e.message}`);
        }
      };
      
      wsRef.current.onerror = (err) => {
        console.error('Error en WebSocket:', err);
        setError('Error de conexión con el servidor de señalización.');
        setIsConnectedToServer(false);
      };
      
      wsRef.current.onclose = () => {
        console.log('Desconectado del servidor de señalización.');
        setIsConnectedToServer(false);
      };
      
    } catch (err) {
      console.error('Error en startMediaAndJoinRoom:', err);
      setError(`Error al iniciar medios: ${err.name}.`);
    }
  };

  const leaveRoom = () => {
    // Notificar al servidor que dejamos la sala
    sendMessage({
      type: 'leave-room',
      roomId
    });
    
    // Cerrar todas las conexiones peer
    Object.values(peerConnectionsRef.current).forEach(pc => {
      if (pc) pc.close();
    });
    peerConnectionsRef.current = {};
    
    // Detener streams locales
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Cerrar WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Notificar al componente padre
    if (onLeaveRoom) onLeaveRoom();
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  useEffect(() => {
    startMediaAndJoinRoom();
    
    return () => {
      console.log('Limpiando VideoChat...');
      // Limpieza similar a leaveRoom
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      Object.values(peerConnectionsRef.current).forEach(pc => {
        if (pc) pc.close();
      });
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [roomId, userId, userRole]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px' }}>
      <h2>Sala de Consulta: {roomId}</h2>
      <p>
        Estado: {isConnectedToServer ? 'Conectado' : 'Desconectado'} | 
        Rol: <strong>{userRole === 'doctor' ? 'Doctor' : 'Paciente'}</strong> | 
        Participantes: {participants.length + 1}
      </p>
      
      <div className="call-controls" style={{ margin: '10px 0' }}>
        <button onClick={toggleCamera} style={{ marginRight: '10px' }}>
          {isCameraEnabled ? 'Apagar Cámara' : 'Encender Cámara'}
        </button>
        <button onClick={toggleAudio} style={{ marginRight: '10px' }}>
          {isAudioEnabled ? 'Silenciar Mic' : 'Activar Mic'}
        </button>
        <button onClick={leaveRoom} style={{ backgroundColor: '#ff4d4f', color: 'white' }}>
          Salir de la Sala
        </button>
      </div>
      
      {isCallInProgress && <p style={{ color: 'green' }}>Llamada en curso...</p>}

      <div className="video-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: '100%', gap: '20px' }}>
        {/* Video local */}
        <div className="video-container" style={{ position: 'relative', width: '280px' }}>
          <h3>Mi Video ({userRole === 'doctor' ? 'Doctor' : 'Paciente'})</h3>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ border: '1px solid black', width: '100%', height: 'auto', backgroundColor: '#333', borderRadius: '8px' }}
          />
          <div className="video-controls" style={{ position: 'absolute', bottom: '5px', right: '5px' }}>
            {!isCameraEnabled && (
              <div style={{ background: 'rgba(255,0,0,0.7)', color: 'white', padding: '3px 6px', borderRadius: '4px' }}>
                Cámara apagada
              </div>
            )}
            {!isAudioEnabled && (
              <div style={{ background: 'rgba(255,0,0,0.7)', color: 'white', padding: '3px 6px', borderRadius: '4px', marginTop: '3px' }}>
                Micrófono silenciado
              </div>
            )}
          </div>
        </div>
        
        {/* Videos remotos */}
        <div id="remote-videos-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {/* Los videos remotos se añadirán dinámicamente aquí */}
        </div>
      </div>
      
      {participants.length === 0 && (
        <div style={{ margin: '20px', padding: '15px', backgroundColor: '#f0f2f5', borderRadius: '8px', textAlign: 'center' }}>
          <p>Esperando a que otros participantes se unan a la sala...</p>
          <p>Comparta este código de sala para invitar: <strong>{roomId}</strong></p>
        </div>
      )}
      
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default VideoChat;