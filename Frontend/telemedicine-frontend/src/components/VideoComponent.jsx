// filepath: Frontend/telemedicine-frontend/src/components/video/VideoChat.jsx
import React, { useEffect, useRef, useState } from 'react';

const stunServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// URL de tu servidor de señalización WebSocket
const SIGNALING_SERVER_URL = 'ws://192.168.1.175:3000';

const VideoChat = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const wsRef = useRef(null); // Ref para la conexión WebSocket

  const [error, setError] = useState('');
  const [isConnectedToServer, setIsConnectedToServer] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [iceCandidatesQueue, setIceCandidatesQueue] = useState([]);


  // Función para enviar mensajes al servidor de señalización
  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('Enviando mensaje:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket no está abierto. No se puede enviar mensaje:', message);
      setError('Error: No se pudo conectar al servidor de señalización para enviar el mensaje.');
    }
  };

  useEffect(() => {
    // Inicializar WebSocket
    wsRef.current = new WebSocket(SIGNALING_SERVER_URL);

    wsRef.current.onopen = () => {
      console.log('Conectado al servidor de señalización WebSocket.');
      setIsConnectedToServer(true);
      setError('');
    };
// ...existing code...


    const processPendingIceCandidates = async () => {
  if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription && iceCandidatesQueue.length > 0) {
    console.log(`Procesando cola de ${iceCandidatesQueue.length} candidatos ICE pendientes.`);
    
    const candidatesToProcess = [...iceCandidatesQueue]; // Crear una copia de la cola actual
    setIceCandidatesQueue([]); // Vaciar la cola
    
    for (const candidate of candidatesToProcess) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Candidato ICE pendiente añadido con éxito.');
      } catch (e) {
        console.error('Error al añadir candidato ICE pendiente:', e);
      }
    }
  }
};

        wsRef.current.onmessage = async (event) => {
          let dataToParse;
    
          if (event.data instanceof Blob) {
            console.log('Blob recibido del servidor, convirtiendo a texto...');
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
            console.log('Mensaje recibido del servidor:', message);
    
            if (!peerConnectionRef.current && message.type !== 'connection-success' && message.type !== 'offer') {
                console.warn('PeerConnection no inicializado, pero se recibió mensaje que podría requerirlo:', message);
            }
    
                        // ...existing code...
            
                        switch (message.type) {
                          case 'connection-success':
                            break;
                          case 'offer':
                            if (!peerConnectionRef.current) {
                              console.warn("PeerConnection no listo para manejar oferta, inicializando...");
                              await startMediaAndCreatePeerConnection(false); 
                            }
                            if (peerConnectionRef.current) {
                              console.log('Oferta recibida:', message.offer);
                              console.log('Callee: signalingState before setRemoteDescription(offer):', peerConnectionRef.current.signalingState);
                              try {
                                // Asegurarse de que no estamos ya en medio de una negociación o estables de una forma inesperada
                                if (peerConnectionRef.current.signalingState !== 'stable' && peerConnectionRef.current.signalingState !== 'have-local-offer') {
                                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.offer));
                                    console.log('Callee: signalingState after setRemoteDescription(offer):', peerConnectionRef.current.signalingState);
                                    await processPendingIceCandidates();
                                } else if (peerConnectionRef.current.signalingState === 'stable') {
                                    // Si está estable, podríamos estar recibiendo una re-oferta.
                                    // Para simplificar, si es estable y recibimos una oferta, la procesamos.
                                    // En un sistema más complejo, se manejaría la "glare condition".
                                    console.warn('Callee: signalingState is stable, but processing offer as a new negotiation attempt.');
                                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.offer));
                                    console.log('Callee: signalingState after setRemoteDescription(offer) on stable PC:', peerConnectionRef.current.signalingState);
                                    await processPendingIceCandidates();
                                } else {
                                    console.error(`Callee: Cannot set remote offer. signalingState is '${peerConnectionRef.current.signalingState}'.`);
                                    setError(`Error: Estado inesperado (${peerConnectionRef.current.signalingState}) al recibir oferta.`);
                                    return; // Salir si el estado no permite procesar la oferta
                                }
            
                                const answer = await peerConnectionRef.current.createAnswer();
                                console.log('Callee: signalingState after createAnswer():', peerConnectionRef.current.signalingState);
            
                                // Verificar el estado ANTES de setLocalDescription(answer)
                                if (peerConnectionRef.current.signalingState === 'have-remote-offer') {
                                  await peerConnectionRef.current.setLocalDescription(answer);
                                  console.log('Callee: signalingState after setLocalDescription(answer):', peerConnectionRef.current.signalingState);
                                  sendMessage({ type: 'answer', answer: answer });
                                  setIsCallInProgress(true);
                                } else {
                                  console.error(`Callee: No se pudo establecer la descripción local de la respuesta. Estado esperado 'have-remote-offer', pero se obtuvo '${peerConnectionRef.current.signalingState}'.`);
                                  setError(`Error al preparar respuesta: estado inesperado ${peerConnectionRef.current.signalingState}. La conexión podría estar ya activa o en un estado inconsistente.`);
                                  // Si el estado ya es 'stable', la conexión podría estar funcionando gracias a ICE.
                                  // Aún así, el otro peer espera una respuesta. Enviar la respuesta que creamos podría ser problemático
                                  // si setLocalDescription no se completó. Por ahora, no la enviamos si hay error aquí.
                                }
                              } catch (e) {

                              }
                            } else {
                               console.error("Fallo al inicializar PeerConnection para manejar la oferta.");
                               setError("Error crítico: No se pudo preparar la conexión para la oferta.");
                            }
                            break;
                          case 'answer':
            // ...existing code...
                if (peerConnectionRef.current) {
                  console.log('Respuesta recibida:', message.answer);
                  console.log('Caller: signalingState before setRemoteDescription(answer):', peerConnectionRef.current.signalingState);
                  
                  if (peerConnectionRef.current.signalingState === 'have-local-offer') {
                    try {
                      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.answer));
                      console.log('Caller: setRemoteDescription(answer) successful. New signalingState:', peerConnectionRef.current.signalingState);
                      // setIsCallInProgress(true); // Generalmente se maneja mejor con ontrack
                    } catch (e) {
                    }
                  } else if (peerConnectionRef.current.signalingState === 'stable') {
                    console.warn('Caller: Se recibió una respuesta, pero signalingState ya es estable. Ignorando respuesta probablemente redundante.');
                  } else {
                    console.warn(`Caller: Se recibió una respuesta, pero signalingState es '${peerConnectionRef.current.signalingState}'. No se puede procesar la respuesta en este estado.`);
                    // Podrías querer establecer un error aquí si este estado es inesperado y no recuperable.
                    // setError(`Error: Estado inesperado (${peerConnectionRef.current.signalingState}) al recibir respuesta.`);
                  }
                }
                break;
                            // ...existing code...
              
              // Luego modifica el case 'candidate' en tu manejador de mensajes
              case 'candidate':
                if (peerConnectionRef.current && message.candidate) {
                  try {
                    console.log('Candidato ICE recibido:', message.candidate);
                    
                    // Verificar si ya tenemos una descripción remota
                    if (peerConnectionRef.current.remoteDescription && peerConnectionRef.current.remoteDescription.type) {
                      // Si ya tenemos la descripción remota, añadimos el candidato inmediatamente
                      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.candidate));
                      console.log('Candidato ICE añadido con éxito.');
                    } else {
                      // Si no tenemos una descripción remota, almacenamos el candidato para procesarlo más tarde
                      console.log('Descripción remota aún no establecida. Almacenando candidato ICE para procesamiento posterior.');
                      setIceCandidatesQueue(prevQueue => [...prevQueue, message.candidate]);
                    }
                  } catch (e) {
                    console.error('Error al añadir candidato ICE recibido:', e);
                  }
                }
                break;
              
              // ...existing code...
              default:
                console.log('Mensaje desconocido recibido:', message);
            }
    
          } catch (e) {
            console.error('Error al parsear mensaje del servidor. Datos recibidos:', dataToParse, e);
            setError("Error: Mensaje corrupto recibido del servidor.");
          }
        };
    
    // ...existing code...



    wsRef.current.onerror = (err) => {
      console.error('Error en WebSocket:', err);
      setError('Error de conexión con el servidor de señalización. Intenta recargar.');
      setIsConnectedToServer(false);
    };

    wsRef.current.onclose = () => {
      console.log('Desconectado del servidor de señalización WebSocket.');
      setIsConnectedToServer(false);
      // Podrías intentar reconectar aquí si lo deseas
    };

    // Iniciar medios y PeerConnection
    // Pasamos `true` para indicar que este cliente podría iniciar la oferta
    // En una app real, esto sería condicional (ej. solo si eres el "llamante")
    startMediaAndCreatePeerConnection();


    // Función de limpieza
    return () => {
      console.log('Limpiando VideoChat y WebSocket...');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        console.log('Stream local detenido.');
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        console.log('RTCPeerConnection cerrado.');
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        console.log('WebSocket cerrado.');
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // El array vacío asegura que useEffect se ejecute solo una vez

  const startMediaAndCreatePeerConnection = async (isInitiator = false) => {
    try {
      if (peerConnectionRef.current) {
        console.log("PeerConnection ya existe o está siendo creado.");
        return;
      }
      console.log("Iniciando startMediaAndCreatePeerConnection, isInitiator:", isInitiator);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('Stream local obtenido:', stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      localStreamRef.current = stream;

      peerConnectionRef.current = new RTCPeerConnection(stunServers);
      console.log('RTCPeerConnection creado.');

      stream.getTracks().forEach(track => {
        if (peerConnectionRef.current && localStreamRef.current) {
          peerConnectionRef.current.addTrack(track, localStreamRef.current);
          console.log('Track local añadido:', track);
        }
      });

      peerConnectionRef.current.onicecandidate = event => {
        if (event.candidate) {
          console.log('Nuevo candidato ICE:', event.candidate);
          sendMessage({ type: 'candidate', candidate: event.candidate });
        }
      };

      peerConnectionRef.current.ontrack = event => {
        console.log('Track remoto recibido:', event.streams[0]);
        if (remoteVideoRef.current && event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsCallInProgress(true); // También puede indicar que la llamada está en curso
        }
      };
      
      // Si este peer es el iniciador, crea la oferta.
      // En una aplicación real, esto se activaría por una acción del usuario (ej. botón "Llamar")
      // Por ahora, lo comentamos para que no se ejecute automáticamente al cargar.
      // if (isInitiator) {
      //   await createOffer();
      // }

      setError('');
    } catch (err) {
      console.error('Error en startMediaAndCreatePeerConnection:', err);
      setError(`Error al iniciar medios/peer: ${err.name} - ${err.message}.`);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null; // Resetear para posible reintento
      }
    }
  };

  // ...existing code...
  const createOffer = async () => {
    if (!peerConnectionRef.current) {
        console.warn("PeerConnection no inicializado. Intentando inicializar...");
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
      console.log('Caller: signalingState after setLocalDescription(offer):', peerConnectionRef.current.signalingState); // <--- AÑADE ESTE LOG
      sendMessage({ type: 'offer', offer: offer });
    } catch (err) {
      console.error('Error al crear oferta:', err);
      setError('Error al crear la oferta: ' + err.message);
    }
  };
// ...existing code...

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px' }}>
      <h2>Video Chat (React + WebSockets)</h2>
      <p>Estado del servidor: {isConnectedToServer ? 'Conectado' : 'Desconectado'}</p>
      {!isCallInProgress && isConnectedToServer && (
        <button onClick={createOffer} style={{ margin: '10px', padding: '10px 20px' }}>
          Iniciar Llamada (Crear Oferta)
        </button>
      )}
      {isCallInProgress && <p style={{color: 'green'}}>Llamada en curso...</p>}

      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '700px', marginTop: '20px' }}>
        <div>
          <h3>Mi Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
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