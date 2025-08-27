import React, { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
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
  const [formMedico, setFormMedico] = useState({
    diagnostico_principal: '',
    diagnosticos_secundarios: '',
    tratamiento: '',
    observaciones: '',
    receta_medica: '',
    examenes_solicitados: '',
    proxima_cita_recomendada: '',
    duracion_minutos: '',
    requiere_seguimiento: false,
    fecha_seguimiento: ''
  });
  const [medicoLoading, setMedicoLoading] = useState(false);
  const [consulta, setConsulta] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pacienteStream, setPacienteStream] = useState(null);

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
                diagnosticos_secundarios: consultaData.diagnosticos_secundarios || '',
                tratamiento: consultaData.tratamiento || '',
                observaciones: consultaData.observaciones || '',
                receta_medica: consultaData.receta_medica || '',
                examenes_solicitados: consultaData.examenes_solicitados || '',
                proxima_cita_recomendada: consultaData.proxima_cita_recomendada || '',
                duracion_minutos: consultaData.duracion_minutos || '',
                requiere_seguimiento: consultaData.requiere_seguimiento || false,
                fecha_seguimiento: consultaData.fecha_seguimiento || ''
              });
            } else {
              setFormMedico({
                diagnostico_principal: '',
                diagnosticos_secundarios: '',
                tratamiento: '',
                observaciones: '',
                receta_medica: '',
                examenes_solicitados: '',
                proxima_cita_recomendada: '',
                duracion_minutos: '',
                requiere_seguimiento: false,
                fecha_seguimiento: ''
              });
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
      const payload = {
        diagnostico_principal: formMedico.diagnostico_principal,
        diagnosticos_secundarios: formMedico.diagnosticos_secundarios,
        tratamiento: formMedico.tratamiento,
        observaciones: formMedico.observaciones,
        receta_medica: formMedico.receta_medica,
        examenes_solicitados: formMedico.examenes_solicitados,
        proxima_cita_recomendada: formMedico.proxima_cita_recomendada,
        duracion_minutos: formMedico.duracion_minutos,
        requiere_seguimiento: formMedico.requiere_seguimiento,
        fecha_seguimiento: formMedico.fecha_seguimiento
      };
      if (consulta && consulta.idConsulta) {
        // Actualizar consulta existente
        consultaGuardada = await consultaService.actualizarConsulta(consulta.idConsulta, payload);
      } else {
        // Crear nueva consulta
        consultaGuardada = await consultaService.crearConsulta({
          cita_id: cita.idCita,
          ...payload
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

      // Si el usuario remoto es paciente, guardar su stream para PiP
      const paciente = participants.find(
        p => p.userId === remoteUserId && p.userRole !== 'doctor'
      );
      if (paciente) {
        setPacienteStream(event.streams[0]);
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
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length === 0) {
        setError('No se detectó micrófono o no se otorgaron permisos de audio.');
        setIsAudioEnabled(false);
        return;
      }
      const audioTrack = audioTracks[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);

      if (localVideoRef.current) {
        if (audioTrack.enabled) {
          localVideoRef.current.parentElement.classList.remove(styles.micOff);
        } else {
          localVideoRef.current.parentElement.classList.add(styles.micOff);
        }
      }
    } else {
      setError('No se detectó micrófono.');
      setIsAudioEnabled(false);
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

  // Función para finalizar la sesión y marcar la cita como COMPLETADA
  const [finalizando, setFinalizando] = useState(false);
  const finalizarSesion = async () => {
    if (!cita) return;
    setFinalizando(true);
    try {
  await (await import('../services/citaService')).default.actualizarCitaAdmin(cita.idCita, { estado_cita_id: 6 });
      if (window && window.message && typeof window.message.success === 'function') {
        window.message.success('La sesión ha sido finalizada y la cita marcada como COMPLETADA.');
      } else {
        // fallback si no está message de AntD
        alert('La sesión ha sido finalizada y la cita marcada como COMPLETADA.');
      }
      leaveRoom();
    } catch (err) {
      if (window && window.message && typeof window.message.error === 'function') {
        window.message.error('Error al finalizar la sesión.');
      } else {
        alert('Error al finalizar la sesión.');
      }
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <div className={styles.videoContainer}>
      <h2>Sala de Consulta: {roomId}</h2>

      {error && (
        <div className={styles.errorMessage}>{error}</div>
      )}
      {isLoading && (
        <div className={styles.loadingMessage}>Conectando a la sala...</div>
      )}

      <div className={userRole === 'doctor' ? styles.mainLayout : ''}>
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

        {/* Solo el doctor ve el botón para abrir el drawer y el pre-checkin */}
        {userRole === 'doctor' && (
          <>
            {cita && (cita.motivo_consulta || cita.sintomas || cita.notas_paciente) && (
              <div className={styles.infoCard + ' ' + styles.preCheckinCard}>
                <div className={styles.infoCardTitle}>Pre-check-in del paciente</div>
                <div className={styles.infoCardContent}>
                  {cita.motivo_consulta && <div><b>Motivo:</b> {cita.motivo_consulta}</div>}
                  {cita.sintomas && <div><b>Síntomas:</b> {cita.sintomas}</div>}
                  {cita.notas_paciente && <div><b>Notas:</b> {cita.notas_paciente}</div>}
                </div>
              </div>
            )}
            <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
              <Dialog.Trigger asChild>
                <button className={styles.openDrawerButton} type="button">
                  Registrar información médica
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className={styles.drawerOverlay} />
                <Dialog.Content className={styles.drawerContent}>
                  <Dialog.Title className={styles.drawerTitle}>Registrar información médica</Dialog.Title>
                  <form className={styles.medicalForm} onSubmit={e => { e.preventDefault(); guardarInfoMedica(); }}>
                    <label className={styles.formLabel}>Diagnóstico principal</label>
                    <textarea
                      className={styles.formTextarea}
                      value={formMedico.diagnostico_principal}
                      onChange={e => setFormMedico(f => ({ ...f, diagnostico_principal: e.target.value }))}
                      rows={2}
                      placeholder="Escribe el diagnóstico principal..."
                    />
                    <label className={styles.formLabel}>Diagnósticos secundarios</label>
                    <textarea
                      className={styles.formTextarea}
                      value={formMedico.diagnosticos_secundarios}
                      onChange={e => setFormMedico(f => ({ ...f, diagnosticos_secundarios: e.target.value }))}
                      rows={2}
                      placeholder="Diagnósticos adicionales..."
                    />
                    <label className={styles.formLabel}>Tratamiento</label>
                    <textarea
                      className={styles.formTextarea}
                      value={formMedico.tratamiento}
                      onChange={e => setFormMedico(f => ({ ...f, tratamiento: e.target.value }))}
                      rows={2}
                      placeholder="Describe el tratamiento..."
                    />
                    <label className={styles.formLabel}>Observaciones</label>
                    <textarea
                      className={styles.formTextarea}
                      value={formMedico.observaciones}
                      onChange={e => setFormMedico(f => ({ ...f, observaciones: e.target.value }))}
                      rows={2}
                      placeholder="Observaciones adicionales..."
                    />
                    <label className={styles.formLabel}>Receta médica</label>
                    <textarea
                      className={styles.formTextarea}
                      value={formMedico.receta_medica}
                      onChange={e => setFormMedico(f => ({ ...f, receta_medica: e.target.value }))}
                      rows={2}
                      placeholder="Indica la receta médica..."
                    />
                    <label className={styles.formLabel}>Exámenes solicitados</label>
                    <textarea
                      className={styles.formTextarea}
                      value={formMedico.examenes_solicitados}
                      onChange={e => setFormMedico(f => ({ ...f, examenes_solicitados: e.target.value }))}
                      rows={2}
                      placeholder="Exámenes o estudios a solicitar..."
                    />
                    <label className={styles.formLabel}>Próxima cita recomendada</label>
                    <input
                      className={styles.formInput}
                      type="date"
                      value={formMedico.proxima_cita_recomendada}
                      onChange={e => setFormMedico(f => ({ ...f, proxima_cita_recomendada: e.target.value }))}
                    />
                    <label className={styles.formLabel}>Duración (minutos)</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      min="0"
                      value={formMedico.duracion_minutos}
                      onChange={e => setFormMedico(f => ({ ...f, duracion_minutos: e.target.value }))}
                      placeholder="Duración de la consulta"
                    />
                    <label className={styles.formLabel}>¿Requiere seguimiento?</label>
                    <input
                      className={styles.formCheckbox}
                      type="checkbox"
                      checked={formMedico.requiere_seguimiento}
                      onChange={e => setFormMedico(f => ({ ...f, requiere_seguimiento: e.target.checked }))}
                    />
                    <label className={styles.formLabel}>Fecha de seguimiento</label>
                    <input
                      className={styles.formInput}
                      type="date"
                      value={formMedico.fecha_seguimiento}
                      onChange={e => setFormMedico(f => ({ ...f, fecha_seguimiento: e.target.value }))}
                    />
                    <button type="submit" className={styles.saveButton} disabled={medicoLoading}>
                      {medicoLoading ? 'Guardando...' : 'Guardar información'}
                    </button>
                  </form>
                  <Dialog.Close asChild>
                    <button className={styles.closeDrawerButton} type="button">Cerrar</button>
                  </Dialog.Close>
                  {/**
                   * Mini video PiP deshabilitado temporalmente por problemas de transferencia de stream remoto.
                   * Aquí solo se muestra el formulario médico en el drawer.
                   */}
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </>
        )}
      </div>

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
        {/* Botón para finalizar sesión, solo visible para el doctor y si hay cita */}
        {userRole === 'doctor' && cita && (
          <button
            onClick={finalizarSesion}
            className={styles.saveButton}
            style={{background:'#52c41a',marginLeft:'8px'}}
            disabled={finalizando}
          >
            {finalizando ? 'Finalizando...' : 'Finalizar sesión'}
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoChat;