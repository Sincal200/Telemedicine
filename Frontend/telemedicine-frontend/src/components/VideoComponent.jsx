/* filepath: c:\Users\sinca\OneDrive\Documents\Telemedicine\Frontend\telemedicine-frontend\src\components\VideoComponent.jsx */
import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/components/Video.module.css';

const stunServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const SIGNALING_SERVER_URL = 'ws://localhost:8081/api/telemedicine/';

const VideoChat = ({ roomId, userRole, userId, onLeaveRoom }) => {
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const peerConnectionsRef = useRef({});
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
  const [isLoading, setIsLoading] = useState(true);

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
    
    // Si ya existe una conexión, cerrarla primero
    if (peerConnectionsRef.current[remoteUserId]) {
      console.log(`Cerrando conexión existente con ${remoteUserId}`);
      peerConnectionsRef.current[remoteUserId].close();
      delete peerConnectionsRef.current[remoteUserId];
    }
    
    const pc = new RTCPeerConnection(stunServers);
    
    // Añadir tracks locales al peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`Añadiendo track: ${track.kind}`);
        pc.addTrack(track, localStreamRef.current);
      });
    }
    
    // Manejar candidatos ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Enviando candidato ICE a ${remoteUserId}`);
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
      
      // Actualizar indicador visual de estado
      const statusIndicator = document.querySelector(`#remote-video-${remoteUserId}`)?.parentElement?.querySelector(`.${styles.statusIndicator}`);
      if (statusIndicator) {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          statusIndicator.classList.remove(styles.disconnected);
        } else {
          statusIndicator.classList.add(styles.disconnected);
        }
      }
    };

    // Manejar cambios de estado de señalización
    pc.onsignalingstatechange = () => {
      console.log(`Signaling state con ${remoteUserId}: ${pc.signalingState}`);
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
          videoContainer.className = styles.remoteVideoWrapper;
          
          // Añadir etiqueta con el rol
          const roleLabel = document.createElement('div');
          roleLabel.className = styles.roleLabel;
          const participant = participants.find(p => p.userId === remoteUserId);
          roleLabel.textContent = participant ? 
            (participant.userRole === 'doctor' ? 'Doctor' : 'Paciente') : 'Usuario';
          
          // Añadir indicador de estado
          const statusIndicator = document.createElement('div');
          statusIndicator.className = `${styles.statusIndicator} ${styles.disconnected}`;
          
          videoContainer.appendChild(videoElement);
          videoContainer.appendChild(roleLabel);
          videoContainer.appendChild(statusIndicator);
          remoteVideosContainer.appendChild(videoContainer);
          
          remoteVideosRef.current[remoteUserId] = videoElement;
        }
      }
      
      // Asignar el stream al elemento de video
      if (remoteVideosRef.current[remoteUserId]) {
        remoteVideosRef.current[remoteUserId].srcObject = event.streams[0];
        setIsCallInProgress(true);
        setIsLoading(false);
      }
    };
    
    peerConnectionsRef.current[remoteUserId] = pc;
    return pc;
  };

  const handleOffer = async (offer, senderId) => {
    try {
      console.log(`Manejando offer de ${senderId}`);
      
      // Crear o obtener peer connection
      let pc = peerConnectionsRef.current[senderId];
      if (!pc) {
        pc = createPeerConnection(senderId);
      }

      // Verificar el estado antes de proceder
      console.log(`Estado de señalización actual: ${pc.signalingState}`);
      
      // Solo proceder si el estado es correcto
      if (pc.signalingState === 'stable' || pc.signalingState === 'have-remote-offer') {
        if (pc.signalingState === 'have-remote-offer') {
          console.log('Ya hay una oferta remota pendiente, recreando conexión...');
          pc.close();
          pc = createPeerConnection(senderId);
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log(`Remote description establecida para ${senderId}`);
        
        // Procesar candidatos ICE en cola
        if (iceCandidatesQueue[senderId]) {
          console.log(`Procesando ${iceCandidatesQueue[senderId].length} candidatos ICE en cola para ${senderId}`);
          for (const candidate of iceCandidatesQueue[senderId]) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn('Error añadiendo candidato ICE:', err);
            }
          }
          // Limpiar la cola
          setIceCandidatesQueue(prev => {
            const newQueue = { ...prev };
            delete newQueue[senderId];
            return newQueue;
          });
        }
        
        // Crear y enviar respuesta
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        sendMessage({
          type: 'answer',
          answer: answer,
          targetUserId: senderId
        });
        
        console.log(`Answer enviada a ${senderId}`);
      } else {
        console.warn(`No se puede procesar offer en estado: ${pc.signalingState}`);
      }
    } catch (error) {
      console.error('Error manejando offer:', error);
      setError(`Error al procesar llamada: ${error.message}`);
    }
  };

  const handleAnswer = async (answer, senderId) => {
    try {
      console.log(`Manejando answer de ${senderId}`);
      
      const pc = peerConnectionsRef.current[senderId];
      if (!pc) {
        console.error(`No se encontró peer connection para ${senderId}`);
        return;
      }

      console.log(`Estado de señalización actual: ${pc.signalingState}`);
      
      // Solo proceder si estamos esperando una respuesta
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`Remote description (answer) establecida para ${senderId}`);
        
        // Procesar candidatos ICE en cola
        if (iceCandidatesQueue[senderId]) {
          console.log(`Procesando ${iceCandidatesQueue[senderId].length} candidatos ICE en cola para ${senderId}`);
          for (const candidate of iceCandidatesQueue[senderId]) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn('Error añadiendo candidato ICE:', err);
            }
          }
          // Limpiar la cola
          setIceCandidatesQueue(prev => {
            const newQueue = { ...prev };
            delete newQueue[senderId];
            return newQueue;
          });
        }
      } else {
        console.warn(`No se puede procesar answer en estado: ${pc.signalingState}. Estado esperado: have-local-offer`);
      }
    } catch (error) {
      console.error('Error manejando answer:', error);
      setError(`Error al procesar respuesta: ${error.message}`);
    }
  };

  const handleIceCandidate = async (candidate, senderId) => {
    try {
      const pc = peerConnectionsRef.current[senderId];
      
      if (!pc) {
        console.log(`Peer connection no encontrada para ${senderId}, guardando candidato en cola`);
        setIceCandidatesQueue(prev => ({
          ...prev,
          [senderId]: [...(prev[senderId] || []), candidate]
        }));
        return;
      }

      // Solo añadir candidatos si la descripción remota está establecida
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`Candidato ICE añadido para ${senderId}`);
      } else {
        console.log(`Descripción remota no establecida para ${senderId}, guardando candidato en cola`);
        setIceCandidatesQueue(prev => ({
          ...prev,
          [senderId]: [...(prev[senderId] || []), candidate]
        }));
      }
    } catch (error) {
      console.error('Error manejando candidato ICE:', error);
    }
  };

  const handleUserJoined = async (newUserId, newUserRole) => {
    try {
      console.log(`Usuario ${newUserId} (${newUserRole}) se unió a la sala`);
      
      // Actualizar lista de participantes
      setParticipants(prev => [
        ...prev.filter(p => p.userId !== newUserId),
        { userId: newUserId, userRole: newUserRole }
      ]);
      
      // Si somos el que inicia (normalmente el doctor), crear offer
      if (userRole === 'doctor' || userId < newUserId) {
        console.log(`Iniciando llamada con ${newUserId}`);
        
        const pc = createPeerConnection(newUserId);
        
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          
          await pc.setLocalDescription(offer);
          
          sendMessage({
            type: 'offer',
            offer: offer,
            targetUserId: newUserId
          });
          
          console.log(`Offer enviada a ${newUserId}`);
        } catch (error) {
          console.error('Error creando offer:', error);
          setError(`Error iniciando llamada: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error manejando usuario que se unió:', error);
    }
  };

  const handleUserLeft = (leftUserId) => {
    console.log(`Usuario ${leftUserId} dejó la sala`);
    
    // Cerrar peer connection
    if (peerConnectionsRef.current[leftUserId]) {
      peerConnectionsRef.current[leftUserId].close();
      delete peerConnectionsRef.current[leftUserId];
    }
    
    // Remover video elemento
    if (remoteVideosRef.current[leftUserId]) {
      const videoElement = remoteVideosRef.current[leftUserId];
      const videoContainer = videoElement.parentElement;
      if (videoContainer) {
        videoContainer.remove();
      }
      delete remoteVideosRef.current[leftUserId];
    }
    
    // Actualizar lista de participantes
    setParticipants(prev => prev.filter(p => p.userId !== leftUserId));
    
    // Limpiar candidatos ICE en cola
    setIceCandidatesQueue(prev => {
      const newQueue = { ...prev };
      delete newQueue[leftUserId];
      return newQueue;
    });
  };

  const startMediaAndJoinRoom = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Obtener acceso a la cámara y micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
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
        setIsLoading(false);
        
        // Unirse a la sala
        sendMessage({
          type: 'join-room',
          roomId,
          userId,
          userRole
        });
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Mensaje recibido:', message.type, message);
          
          switch (message.type) {
            case 'room-joined':
              console.log('Te uniste a la sala exitosamente');
              setRoomInfo(message.roomInfo);
              break;
              
            case 'user-joined':
              handleUserJoined(message.userId, message.userRole);
              break;
              
            case 'user-left':
              handleUserLeft(message.userId);
              break;
              
            case 'offer':
              handleOffer(message.offer, message.senderId);
              break;
              
            case 'answer':
              handleAnswer(message.answer, message.senderId);
              break;
              
            case 'candidate':
              handleIceCandidate(message.candidate, message.senderId);
              break;
              
            case 'error':
              setError(message.error);
              break;
              
            default:
              console.log('Tipo de mensaje desconocido:', message.type);
          }
        } catch (error) {
          console.error('Error procesando mensaje:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        setError('Error de conexión al servidor.');
        setIsLoading(false);
      };
      
      wsRef.current.onclose = () => {
        console.log('Conexión WebSocket cerrada.');
        setIsConnectedToServer(false);
        if (!error) {
          setError('Conexión perdida con el servidor.');
        }
      };
      
    } catch (err) {
      console.error('Error en startMediaAndJoinRoom:', err);
      setError(`Error al acceder a cámara/micrófono: ${err.name}.`);
      setIsLoading(false);
    }
  };

  const leaveRoom = () => {
    console.log('Dejando la sala...');
    
    // Enviar mensaje de salida
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'leave-room',
        roomId,
        userId
      });
    }
    
    // Detener todos los tracks de media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.kind} detenido`);
      });
      localStreamRef.current = null;
    }
    
    // Cerrar todas las conexiones peer
    Object.keys(peerConnectionsRef.current).forEach(userId => {
      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        console.log(`Peer connection con ${userId} cerrada`);
      }
    });
    peerConnectionsRef.current = {};
    
    // Limpiar videos remotos
    Object.keys(remoteVideosRef.current).forEach(userId => {
      const videoElement = remoteVideosRef.current[userId];
      const videoContainer = videoElement.parentElement;
      if (videoContainer) {
        videoContainer.remove();
      }
    });
    remoteVideosRef.current = {};
    
    // Cerrar WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Resetear estados
    setIsConnectedToServer(false);
    setIsCallInProgress(false);
    setParticipants([]);
    setIceCandidatesQueue({});
    setError('');
    
    if (onLeaveRoom) onLeaveRoom();
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraEnabled(videoTrack.enabled);
        
        // Actualizar clase CSS para indicador visual
        if (localVideoRef.current) {
          if (videoTrack.enabled) {
            localVideoRef.current.parentElement.classList.remove(styles.cameraOff);
          } else {
            localVideoRef.current.parentElement.classList.add(styles.cameraOff);
          }
        }
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        // Actualizar clase CSS para indicador visual
        if (localVideoRef.current) {
          if (audioTrack.enabled) {
            localVideoRef.current.parentElement.classList.remove(styles.micOff);
          } else {
            localVideoRef.current.parentElement.classList.add(styles.micOff);
          }
        }
      }
    }
  };

  useEffect(() => {
    startMediaAndJoinRoom();
    
    return () => {
      console.log('Limpiando VideoChat...');
      // Limpieza similar a leaveRoom pero sin enviar mensajes
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
    <div className={styles.videoContainer}>
      <h2>Sala de Consulta: {roomId}</h2>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className={styles.loadingMessage}>
          Conectando a la sala...
        </div>
      )}
      
      <div className={styles.callControls}>
        <button onClick={toggleCamera}>
          {isCameraEnabled ? '📷 Apagar Cámara' : '📷 Encender Cámara'}
        </button>
        <button onClick={toggleAudio}>
          {isAudioEnabled ? '🎤 Silenciar Mic' : '🎤 Activar Mic'}
        </button>
        <button onClick={leaveRoom}>
          📞 Salir de la Sala
        </button>
      </div>
      
      <div className={styles.videoGrid}>
        <div className={`${styles.localVideo} ${!isCameraEnabled ? styles.cameraOff : ''} ${!isAudioEnabled ? styles.micOff : ''}`}>
          <video ref={localVideoRef} autoPlay muted playsInline />
          <div className={styles.roleLabel}>
            {userRole === 'doctor' ? 'Doctor' : 'Paciente'} (Tú)
          </div>
          <div className={`${styles.statusIndicator} ${isConnectedToServer ? '' : styles.disconnected}`}></div>
        </div>
        
        <div id="remote-videos-container" className={styles.remoteVideosContainer}>
          {/* Videos remotos se añaden aquí dinámicamente */}
        </div>
      </div>
    </div>
  );
};

export default VideoChat;