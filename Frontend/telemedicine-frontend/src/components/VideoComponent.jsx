// filepath: Frontend/telemedicine-frontend/src/components/video/VideoChat.jsx
import React, { useEffect, useRef, useState } from 'react';

const stunServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// URL de tu servidor de señalización WebSocket
const SIGNALING_SERVER_URL = 'wss://telemedicine-jvok.onrender.com';

const VideoChat = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const wsRef = useRef(null);

  const [error, setError] = useState('');
  const [isConnectedToServer, setIsConnectedToServer] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [iceCandidatesQueue, setIceCandidatesQueue] = useState([]);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true); // Nuevo estado
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);   // Nuevo estado

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // console.log('Enviando mensaje:', message); // Log menos verboso, opcional
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket no está abierto. No se puede enviar mensaje:', message);
      setError('Error: No se pudo conectar al servidor de señalización.');
    }
  };

  const processPendingIceCandidates = async () => {
    if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription && iceCandidatesQueue.length > 0) {
      console.log(`Procesando ${iceCandidatesQueue.length} candidatos ICE pendientes.`);
      const candidatesToProcess = [...iceCandidatesQueue];
      setIceCandidatesQueue([]);
      for (const candidate of candidatesToProcess) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error al añadir candidato ICE pendiente:', e.message);
        }
      }
    }
  };

  useEffect(() => {
    wsRef.current = new WebSocket(SIGNALING_SERVER_URL);

    wsRef.current.onopen = () => {
      console.log('Conectado al servidor de señalización WebSocket.');
      setIsConnectedToServer(true);
      setError('');
    };

    wsRef.current.onmessage = async (event) => {
      let dataToParse;
      if (event.data instanceof Blob) {
        try {
          dataToParse = await event.data.text();
        } catch (e) {
          console.error("Error al leer datos del Blob:", e);
          setError("Error: No se pudo leer el mensaje del servidor.");
          return;
        }
      } else {
        dataToParse = event.data;
      }

      try {
        const message = JSON.parse(dataToParse);
        console.log('Mensaje recibido:', message.type, message);

        switch (message.type) {
          case 'connection-success':
            break;
          case 'offer': // Callee
            if (!peerConnectionRef.current) {
              console.warn("PeerConnection no listo para oferta, inicializando...");
              await startMediaAndCreatePeerConnection(false);
            }
            if (peerConnectionRef.current) {
              try {
                const currentSignalingState = peerConnectionRef.current.signalingState;
                console.log('Callee: Estado actual antes de procesar oferta:', currentSignalingState);

                if (currentSignalingState === 'stable' || currentSignalingState === 'have-remote-offer' /* re-offer on stable */ || currentSignalingState === 'default' /* Firefox initial state */) {
                  await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.offer));
                  console.log('Callee: Oferta remota establecida.');
                  await processPendingIceCandidates();
                } else if (currentSignalingState === 'have-local-offer') {
                  console.error(`Callee: Conflicto de señalización (glare). Estado: ${currentSignalingState}. No se puede establecer oferta remota.`);
                  setError(`Error: Conflicto de señalización. Intente de nuevo.`);
                  return; 
                } else {
                  console.error(`Callee: Estado inesperado (${currentSignalingState}) al recibir oferta.`);
                  setError(`Error: Estado inesperado (${currentSignalingState}) al procesar oferta.`);
                  return;
                }
            
                const answer = await peerConnectionRef.current.createAnswer();
                // Verificar el estado ANTES de setLocalDescription(answer)
                if (peerConnectionRef.current.signalingState === 'have-remote-offer') {
                  await peerConnectionRef.current.setLocalDescription(answer);
                  console.log('Callee: Respuesta local establecida y enviada.');
                  sendMessage({ type: 'answer', answer: answer });
                  setIsCallInProgress(true);
                } else {
                  // Esto puede pasar si ICE se completa muy rápido y el estado ya es 'stable'
                  console.warn(`Callee: No se pudo establecer descripción local de respuesta. Estado: '${peerConnectionRef.current.signalingState}'. La llamada podría funcionar si ICE ya conectó.`);
                  // Si la llamada funciona, no es un error crítico para el usuario.
                  // Considerar enviar la respuesta de todas formas si 'answer' se creó,
                  // ya que el 'caller' la espera y tiene lógica para ignorarla si ya está 'stable'.
                  if (answer) {
                    console.log("Callee: Enviando respuesta aunque el estado local no era 'have-remote-offer'.");
                    sendMessage({ type: 'answer', answer: answer });
                    setIsCallInProgress(true); // Asegurar que la UI refleje la llamada
                  }
                }
              } catch (e) {
                console.error("Error al procesar la oferta:", e);
                setError("Error al procesar la oferta del peer: " + e.message);
              }
            } else {
               console.error("Fallo al inicializar PeerConnection para manejar la oferta.");
               setError("Error crítico: No se pudo preparar la conexión para la oferta.");
            }
            break;
          case 'answer': // Caller
            if (peerConnectionRef.current) {
              const currentSignalingState = peerConnectionRef.current.signalingState;
              console.log('Caller: Estado actual antes de procesar respuesta:', currentSignalingState, message.answer);
              
              if (currentSignalingState === 'have-local-offer') {
                try {
                  await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.answer));
                  console.log('Caller: Respuesta remota establecida.');
                  await processPendingIceCandidates();
                } catch (e) {
                  console.error("Error al procesar la respuesta (setRemoteDescription):", e);
                  setError("Error al procesar la respuesta del peer: " + e.message);
                }
              } else if (currentSignalingState === 'stable') {
                console.warn('Caller: Se recibió respuesta, pero el estado ya es estable. Ignorando.');
              } else {
                console.warn(`Caller: Se recibió respuesta, pero el estado es '${currentSignalingState}'. No se puede procesar.`);
              }
            }
            break;
          case 'candidate':
            if (peerConnectionRef.current && message.candidate) {
              try {
                if (peerConnectionRef.current.remoteDescription && peerConnectionRef.current.remoteDescription.type) {
                  await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.candidate));
                } else {
                  console.log('Almacenando candidato ICE para procesamiento posterior.');
                  setIceCandidatesQueue(prevQueue => [...prevQueue, message.candidate]);
                }
              } catch (e) {
                console.warn('Error al añadir candidato ICE:', e.message);
              }
            }
            break;
          default:
            console.log('Mensaje desconocido recibido:', message);
        }
      } catch (e) {
        console.error('Error al parsear mensaje del servidor:', e);
        setError("Error: Mensaje corrupto recibido del servidor.");
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

    startMediaAndCreatePeerConnection();

    return () => {
      console.log('Limpiando VideoChat...');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startMediaAndCreatePeerConnection = async (isInitiator = false) => {
    try {
      if (peerConnectionRef.current) return;
      console.log("Iniciando medios y PeerConnection...");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      localStreamRef.current = stream;

      peerConnectionRef.current = new RTCPeerConnection(stunServers);
      console.log('RTCPeerConnection creado.');

      stream.getTracks().forEach(track => {
        if (peerConnectionRef.current && localStreamRef.current) {
          peerConnectionRef.current.addTrack(track, localStreamRef.current);
        }
      });

      peerConnectionRef.current.onicecandidate = event => {
        if (event.candidate) {
          // console.log('Nuevo candidato ICE local:', event.candidate); // Log menos verboso
          sendMessage({ type: 'candidate', candidate: event.candidate });
        }
      };

      peerConnectionRef.current.ontrack = event => {
        console.log('Track remoto recibido.');
        if (remoteVideoRef.current && event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsCallInProgress(true);
        }
      };
      setError('');
    } catch (err) {
      console.error('Error en startMediaAndCreatePeerConnection:', err);
      setError(`Error al iniciar medios/peer: ${err.name}.`);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    }
  };

  const createOffer = async () => {
    if (!peerConnectionRef.current) {
        console.warn("PeerConnection no inicializado para crear oferta, intentando inicializar...");
        await startMediaAndCreatePeerConnection(true); 
        if (!peerConnectionRef.current) {
            setError("No se pudo crear la oferta: PeerConnection no está listo.");
            return;
        }
    }
    if (isCallInProgress) {
        console.log("Llamada ya en progreso, no se crea nueva oferta.");
        return;
    }
    try {
      console.log('Creando oferta...');
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('Caller: Oferta local establecida y enviada.');
      sendMessage({ type: 'offer', offer: offer });
    } catch (err) {
      console.error('Error al crear oferta:', err);
      setError('Error al crear la oferta: ' + err.message);
    }
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

    return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px' }}>
      <h2>Video Chat</h2>
      <p>Estado del servidor: {isConnectedToServer ? 'Conectado' : 'Desconectado'}</p>
      
      {!isCallInProgress && isConnectedToServer && (
        <button onClick={createOffer} style={{ margin: '10px', padding: '10px 20px' }}>
          Iniciar Llamada
        </button>
      )}

      {isCallInProgress && (
        <div style={{ margin: '10px' }}>
          <button onClick={toggleCamera} style={{ marginRight: '10px' }}>
            {isCameraEnabled ? 'Apagar Cámara' : 'Encender Cámara'}
          </button>
          <button onClick={toggleAudio}>
            {isAudioEnabled ? 'Silenciar Mic' : 'Activar Mic'}
          </button>
        </div>
      )}
      
      {isCallInProgress && <p style={{ color: 'green' }}>Llamada en curso...</p>}

      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '700px', marginTop: '20px' }}>
        <div>
          <h3>Mi Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted // Siempre muteado para evitar eco local
            style={{ border: '1px solid black', width: '320px', height: '240px', backgroundColor: '#333' }}
          />
        </div>
        <div>
          <h3>Video Remoto</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ border: '1px solid black', width: '320px', height: '240px', backgroundColor: '#333' }}
          />
        </div>
      </div>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default VideoChat;