import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/components/Video.module.css';
import consultaService from '../services/consultaService';

const stunServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Señalización: preferir variable de entorno para flexibilidad
export const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_URL || 'wss://sincal.software/api/telemedicine/';

// Helpers para manejar la cola de candidatos ICE
const enqueueIceCandidate = (setQueue, senderId, candidate) => {
  setQueue(prev => ({
    ...prev,
    [senderId]: [...(prev[senderId] || []), candidate]
  }));
};

const processIceQueue = async (pc, queue) => {
  if (!queue || !pc) return;
  for (const candidate of queue) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('Error añadiendo candidato ICE desde cola:', err);
    }
  }
};

const VideoChat = ({ roomId, userRole, userId, onLeaveRoom }) => {
  // --- Estado para cita y formulario médico ---
  const [cita, setCita] = useState(null);
  const [formMedico, setFormMedico] = useState({ diagnostico_principal: '', tratamiento: '', receta_medica: '' });
  const [medicoLoading, setMedicoLoading] = useState(false);
  const [consulta, setConsulta] = useState(null);

  // Obtener datos de la cita al entrar a la sala
  useEffect(() => {
    const fetchCitaYConsulta = async () => {
      try {
        // Buscar cita por roomId
        const res = await import('../services/citaService');
        const citaService = res.default;
        let citaData = null;
        if (userRole === 'doctor') {
          const citas = await citaService.obtenerCitasMedico(userId);
          citaData = citas.find(c => c.room_id === roomId);
        } else {
          const citas = await citaService.obtenerCitasPaciente(userId);
          citaData = citas.find(c => c.room_id === roomId);
        }
        setCita(citaData || null);
        if (citaData) {
          // Buscar consulta asociada a la cita
          try {
            const consultaData = await consultaService.obtenerConsultaPorCitaId(citaData.idCita);
            setConsulta(consultaData || null);
            if (consultaData) {
              setFormMedico({
                diagnostico_principal: consultaData.diagnostico_principal || '',
                tratamiento: consultaData.tratamiento || '',
                receta_medica: consultaData.receta_medica || ''
              });
            } else {
              setFormMedico({ diagnostico_principal: '', tratamiento: '', receta_medica: '' });
            }
          } catch (e) {
            setConsulta(null);
            setFormMedico({ diagnostico_principal: '', tratamiento: '', receta_medica: '' });
          }
        }
      } catch (err) {
        setCita(null);
        setConsulta(null);
      }
    };
    fetchCitaYConsulta();
  }, [roomId, userId, userRole]);

  // Guardar información médica en Consulta
  const guardarInfoMedica = async () => {
    if (!cita) return;
    setMedicoLoading(true);
    try {
      let consultaGuardada = null;
      if (consulta && consulta.idConsulta) {
        // Actualizar consulta existente
        consultaGuardada = await consultaService.actualizarConsulta(consulta.idConsulta, {
          diagnostico_principal: formMedico.diagnostico_principal,
          tratamiento: formMedico.tratamiento,
          receta_medica: formMedico.receta_medica
        });
      } else {
        // Crear nueva consulta
        consultaGuardada = await consultaService.crearConsulta({
          cita_id: cita.idCita,
          diagnostico_principal: formMedico.diagnostico_principal,
          tratamiento: formMedico.tratamiento,
          receta_medica: formMedico.receta_medica
        });
      }
      setConsulta(consultaGuardada);
      alert('Información médica guardada');
    } catch (err) {
      alert('Error guardando información médica');
    } finally {
      setMedicoLoading(false);
    }
  };
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

  const navigate = useNavigate();

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


    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state con ${remoteUserId}: ${pc.iceConnectionState}`);


      const statusIndicator = document.querySelector(`#remote-video-${remoteUserId}`)?.parentElement?.querySelector(`.${styles.statusIndicator}`);
      if (statusIndicator) {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          statusIndicator.classList.remove(styles.disconnected);
        } else {
          statusIndicator.classList.add(styles.disconnected);
        }
      }
    };

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

      console.log(`Estado de señalización actual: ${pc.signalingState}`);

      // Solo proceder si el estado es correcto para recibir una oferta
      if (pc.signalingState === 'stable') {
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
      } else if (pc.signalingState === 'have-local-offer') {
        console.warn(`Ignorando offer de ${senderId} - ya tenemos una oferta local pendiente`);
        return;
      } else {
        console.warn(`Estado de señalización inconsistente: ${pc.signalingState}. Recreando conexión...`);
        pc.close();
        delete peerConnectionsRef.current[senderId];

        // Recrear y procesar la oferta
        pc = createPeerConnection(senderId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendMessage({
          type: 'answer',
          answer: answer,
          targetUserId: senderId
        });

        console.log(`Answer enviada a ${senderId} (después de recrear conexión)`);
      }
    } catch (error) {
      console.error('Error manejando offer:', error);
      setError(`Error al procesar llamada: ${error.message}`);

      if (peerConnectionsRef.current[senderId]) {
        peerConnectionsRef.current[senderId].close();
        delete peerConnectionsRef.current[senderId];
      }
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
      } else if (pc.signalingState === 'stable') {
        console.warn(`Ignorando answer de ${senderId} - conexión ya está en estado stable`);
        return;
      } else {
        console.warn(`No se puede procesar answer en estado: ${pc.signalingState}. Estado esperado: have-local-offer`);
        // Si estamos en un estado inconsistente, recrear la conexión
        console.log(`Recreando conexión peer con ${senderId} debido a estado inconsistente`);
        pc.close();
        delete peerConnectionsRef.current[senderId];

        return;
      }
    } catch (error) {
      console.error('Error manejando answer:', error);
      setError(`Error al procesar respuesta: ${error.message}`);

      // En caso de error, limpiar la conexión problemática
      if (peerConnectionsRef.current[senderId]) {
        peerConnectionsRef.current[senderId].close();
        delete peerConnectionsRef.current[senderId];
      }
    }
  };

  const handleIceCandidate = async (candidate, senderId) => {
    try {
      const pc = peerConnectionsRef.current[senderId];

      if (!pc) {
        console.log(`Peer connection no encontrada para ${senderId}, guardando candidato en cola`);
        enqueueIceCandidate(setIceCandidatesQueue, senderId, candidate);
        return;
      }

      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`Candidato ICE añadido para ${senderId}`);
        // Procesar cualquier cola restante
        if (iceCandidatesQueue[senderId] && iceCandidatesQueue[senderId].length) {
          await processIceQueue(pc, iceCandidatesQueue[senderId]);
          setIceCandidatesQueue(prev => {
            const newQueue = { ...prev };
            delete newQueue[senderId];
            return newQueue;
          });
        }
      } else {
        console.log(`Descripción remota no establecida para ${senderId}, guardando candidato en cola`);
        enqueueIceCandidate(setIceCandidatesQueue, senderId, candidate);
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

 
    setParticipants(prev => prev.filter(p => p.userId !== leftUserId));


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
       
      };

    } catch (err) {
      console.error('Error en startMediaAndJoinRoom:', err);
      setError(`Error al acceder a cámara/micrófono: ${err.name}.`);
      setIsLoading(false);
    }
  };

  const leaveRoom = () => {
    console.log('Dejando la sala...');


    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'leave-room',
        roomId,
        userId
      });
    }


    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.kind} detenido`);
      });
      localStreamRef.current = null;
    }

  
    Object.keys(peerConnectionsRef.current).forEach(userId => {
      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        console.log(`Peer connection con ${userId} cerrada`);
      }
    });
    peerConnectionsRef.current = {};


    Object.keys(remoteVideosRef.current).forEach(userId => {
      const videoElement = remoteVideosRef.current[userId];
      const videoContainer = videoElement.parentElement;
      if (videoContainer) {
        videoContainer.remove();
      }
    });
    remoteVideosRef.current = {};

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

 
    setIsConnectedToServer(false);
    setIsCallInProgress(false);
    setParticipants([]);
    setIceCandidatesQueue({});
    setError('');

  if (onLeaveRoom) onLeaveRoom();
  // Redirigir al Dashboard después de salir
  navigate('/dashboard');
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraEnabled(videoTrack.enabled);

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
        <div className={styles.errorMessage}>{error}</div>
      )}
      {isLoading && (
        <div className={styles.loadingMessage}>Conectando a la sala...</div>
      )}

      {/* Bloque informativo de pre-check-in para el doctor */}
      {userRole === 'doctor' && cita && (
        (cita.motivo_consulta || cita.sintomas || cita.notas_paciente) && (
          <div style={{ margin: '16px 0', background: '#f6ffed', padding: 12, borderRadius: 6 }}>
            <strong>Pre-check-in del paciente:</strong>
            {cita.motivo_consulta && <div><b>Motivo:</b> {cita.motivo_consulta}</div>}
            {cita.sintomas && <div><b>Síntomas:</b> {cita.sintomas}</div>}
            {cita.notas_paciente && <div><b>Notas:</b> {cita.notas_paciente}</div>}
          </div>
        )
      )}

      {/* Formulario para ingresar información médica (solo doctor) */}
      {userRole === 'doctor' && cita && (
        <div style={{ margin: '16px 0', background: '#e6f7ff', padding: 12, borderRadius: 6 }}>
          <strong>Registrar información médica:</strong>
          <div style={{ marginTop: 8 }}>
            <label>Diagnóstico:</label>
            <textarea
              value={formMedico.diagnostico_principal}
              onChange={e => setFormMedico(f => ({ ...f, diagnostico_principal: e.target.value }))}
              rows={2}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <label>Tratamiento:</label>
            <textarea
              value={formMedico.tratamiento}
              onChange={e => setFormMedico(f => ({ ...f, tratamiento: e.target.value }))}
              rows={2}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <label>Receta:</label>
            <textarea
              value={formMedico.receta_medica}
              onChange={e => setFormMedico(f => ({ ...f, receta_medica: e.target.value }))}
              rows={2}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <button onClick={guardarInfoMedica} disabled={medicoLoading} style={{ marginTop: 8 }}>
              {medicoLoading ? 'Guardando...' : 'Guardar información'}
            </button>
          </div>
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
          {/* Videos remotos */}
        </div>
      </div>
    </div>
  );
};

export default VideoChat;