import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/components/Video.module.css';
import consultaService from '../services/consultaService';
import expedienteService from '../services/expedienteService';

// ICE
const stunServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Señalización
export const SIGNALING_SERVER_URL =
  import.meta.env.VITE_SIGNALING_URL || 'wss://sincal.software/api/telemedicine/';

// Helpers ICE queue
const enqueueIceCandidate = (setQueue, senderId, candidate) => {
  setQueue(prev => ({
    ...prev,
    [senderId]: [...(prev[senderId] || []), candidate]
  }));
};

const processIceQueue = async (pc, queue) => {
  if (!queue || !pc) return;
  for (const candidate of queue) {
    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
    catch (err) { console.warn('Error añadiendo candidato ICE desde cola:', err); }
  }
};

const VideoChat = ({ roomId, userRole, userId, onLeaveRoom }) => {
  // ---------- Estado de cita/expediente/notas ----------
  const [cita, setCita] = useState(null);
  const [consulta, setConsulta] = useState(null);
  const [expediente, setExpediente] = useState(null);
  const [expedienteLoading, setExpedienteLoading] = useState(false);

  const [formMedico, setFormMedico] = useState({
    diagnostico_principal: '',
    diagnosticos_secundarios: '',
    tratamiento: '',
    observaciones: '',
    receta_medica: '',
    examenes_solicitados: '',
    proxima_cita_recomendada: '',
    requiere_seguimiento: false,
    fecha_seguimiento: ''
  });
  const [medicoLoading, setMedicoLoading] = useState(false);

  // Tabs del rail
  const [tab, setTab] = useState('pre'); // 'pre' | 'exp' | 'notas'
  const railRef = useRef(null);

  // ---------- WebRTC / WS ----------
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
  const [pacienteStream, setPacienteStream] = useState(null);

  const navigate = useNavigate();

  // ---------- Inicializar datos (cita/consulta/expediente) ----------
  useEffect(() => {
    const fetchCitaYConsultaYExpediente = async () => {
      try {
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
          // Consulta
          try {
            const consultaData = await consultaService.obtenerConsultaPorCitaId(citaData.idCita);
            if (consultaData) {
              setConsulta(consultaData);
              setFormMedico({
                diagnostico_principal: consultaData.diagnostico_principal || '',
                diagnosticos_secundarios: consultaData.diagnosticos_secundarios || '',
                tratamiento: consultaData.tratamiento || '',
                observaciones: consultaData.observaciones || '',
                receta_medica: consultaData.receta_medica || '',
                examenes_solicitados: consultaData.examenes_solicitados || '',
                proxima_cita_recomendada: consultaData.proxima_cita_recomendada || '',
                requiere_seguimiento: consultaData.requiere_seguimiento || false,
                fecha_seguimiento: consultaData.fecha_seguimiento || ''
              });
            } else {
              setConsulta(null);
              setFormMedico({
                diagnostico_principal: '',
                diagnosticos_secundarios: '',
                tratamiento: '',
                observaciones: '',
                receta_medica: '',
                examenes_solicitados: '',
                proxima_cita_recomendada: '',
                requiere_seguimiento: false,
                fecha_seguimiento: ''
              });
            }
          } catch {
            setConsulta(null);
            setFormMedico({
              diagnostico_principal: '',
              diagnosticos_secundarios: '',
              tratamiento: '',
              observaciones: '',
              receta_medica: '',
              examenes_solicitados: '',
              proxima_cita_recomendada: '',
              requiere_seguimiento: false,
              fecha_seguimiento: ''
            });
          }

          // Expediente
          if (citaData.paciente_id) {
            setExpedienteLoading(true);
            try {
              const expedienteData = await expedienteService.obtenerExpedientePorPacienteId(citaData.paciente_id);
              setExpediente(expedienteData);
            } catch { setExpediente(null); }
            finally { setExpedienteLoading(false); }
          }
        }
      } catch {
        setCita(null); setConsulta(null); setExpediente(null);
      }
    };
    fetchCitaYConsultaYExpediente();
  }, [roomId, userId, userRole]);

  // ---------- Guardar información médica ----------
  const guardarInfoMedica = async () => {
    if (!cita) return;
    setMedicoLoading(true);
    try {
      const normalizeDate = (val) => (!val || val === 'Invalid date') ? null : val;
      const payload = {
        diagnostico_principal: formMedico.diagnostico_principal,
        diagnosticos_secundarios: formMedico.diagnosticos_secundarios,
        tratamiento: formMedico.tratamiento,
        observaciones: formMedico.observaciones,
        receta_medica: formMedico.receta_medica,
        examenes_solicitados: formMedico.examenes_solicitados,
        proxima_cita_recomendada: normalizeDate(formMedico.proxima_cita_recomendada),
        requiere_seguimiento: formMedico.requiere_seguimiento,
        fecha_seguimiento: normalizeDate(formMedico.fecha_seguimiento)
      };

      let consultaGuardada = null;
      if (consulta?.idConsulta) {
        consultaGuardada = await consultaService.actualizarConsulta(consulta.idConsulta, payload);
      } else {
        consultaGuardada = await consultaService.crearConsulta({ cita_id: cita.idCita, ...payload });
      }
      setConsulta(consultaGuardada);
      alert('Información médica guardada');
    } catch {
      alert('Error guardando información médica');
    } finally {
      setMedicoLoading(false);
    }
  };

  // ---------- WS helpers ----------
  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ ...message, senderId: userId, senderRole: userRole }));
    } else {
      console.error('WebSocket cerrado.');
      setError('Error: No se pudo conectar al servidor de señalización.');
    }
  };

  const createPeerConnection = (remoteUserId) => {
    if (peerConnectionsRef.current[remoteUserId]) {
      peerConnectionsRef.current[remoteUserId].close();
      delete peerConnectionsRef.current[remoteUserId];
    }
    const pc = new RTCPeerConnection(stunServers);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({ type: 'candidate', candidate: event.candidate, targetUserId: remoteUserId });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const statusIndicator =
        document.querySelector(`#remote-video-${remoteUserId}`)?.parentElement?.querySelector(`.${styles.statusIndicator}`);
      if (statusIndicator) {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          statusIndicator.classList.remove(styles.disconnected);
        } else {
          statusIndicator.classList.add(styles.disconnected);
        }
      }
    };

    pc.ontrack = (event) => {
      if (!remoteVideosRef.current[remoteUserId]) {
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.id = `remote-video-${remoteUserId}`;

        const remoteVideosContainer = document.getElementById('remote-videos-container');
        if (remoteVideosContainer) {
          const videoContainer = document.createElement('div');
          videoContainer.className = styles.remoteVideoWrapper;

          const roleLabel = document.createElement('div');
          roleLabel.className = styles.roleLabel;
          const participant = participants.find(p => p.userId === remoteUserId);
          roleLabel.textContent = participant ? (participant.userRole === 'doctor' ? 'Doctor' : 'Paciente') : 'Usuario';

          const statusIndicator = document.createElement('div');
          statusIndicator.className = `${styles.statusIndicator} ${styles.disconnected}`;

          videoContainer.appendChild(videoElement);
          videoContainer.appendChild(roleLabel);
          videoContainer.appendChild(statusIndicator);
          remoteVideosContainer.appendChild(videoContainer);

          remoteVideosRef.current[remoteUserId] = videoElement;
        }
      }

      if (remoteVideosRef.current[remoteUserId]) {
        remoteVideosRef.current[remoteUserId].srcObject = event.streams[0];
        setIsCallInProgress(true);
        setIsLoading(false);
      }

      const paciente = participants.find(p => p.userId === remoteUserId && p.userRole !== 'doctor');
      if (paciente) setPacienteStream(event.streams[0]);
    };

    peerConnectionsRef.current[remoteUserId] = pc;
    return pc;
  };

  const handleOffer = async (offer, senderId) => {
    try {
      let pc = peerConnectionsRef.current[senderId] || createPeerConnection(senderId);

      if (pc.signalingState === 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        if (iceCandidatesQueue[senderId]) {
          for (const c of iceCandidatesQueue[senderId]) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          setIceCandidatesQueue(prev => { const n = { ...prev }; delete n[senderId]; return n; });
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendMessage({ type: 'answer', answer, targetUserId: senderId });
      } else if (pc.signalingState === 'have-local-offer') {
        return;
      } else {
        pc.close(); delete peerConnectionsRef.current[senderId];
        pc = createPeerConnection(senderId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendMessage({ type: 'answer', answer, targetUserId: senderId });
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
      const pc = peerConnectionsRef.current[senderId];
      if (!pc) return;
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        if (iceCandidatesQueue[senderId]) {
          for (const c of iceCandidatesQueue[senderId]) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          setIceCandidatesQueue(prev => { const n = { ...prev }; delete n[senderId]; return n; });
        }
      }
    } catch (error) {
      console.error('Error manejando answer:', error);
      setError(`Error al procesar respuesta: ${error.message}`);
      if (peerConnectionsRef.current[senderId]) {
        peerConnectionsRef.current[senderId].close();
        delete peerConnectionsRef.current[senderId];
      }
    }
  };

  const handleIceCandidate = async (candidate, senderId) => {
    try {
      const pc = peerConnectionsRef.current[senderId];
      if (!pc) { enqueueIceCandidate(setIceCandidatesQueue, senderId, candidate); return; }

      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        if (iceCandidatesQueue[senderId]?.length) {
          await processIceQueue(pc, iceCandidatesQueue[senderId]);
          setIceCandidatesQueue(prev => { const n = { ...prev }; delete n[senderId]; return n; });
        }
      } else {
        enqueueIceCandidate(setIceCandidatesQueue, senderId, candidate);
      }
    } catch (error) { console.error('Error manejando candidato ICE:', error); }
  };

  const handleUserJoined = async (newUserId, newUserRole) => {
    setParticipants(prev => [...prev.filter(p => p.userId !== newUserId), { userId: newUserId, userRole: newUserRole }]);

    if (userRole === 'doctor' || userId < newUserId) {
      const pc = createPeerConnection(newUserId);
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        sendMessage({ type: 'offer', offer, targetUserId: newUserId });
      } catch (error) {
        console.error('Error creando offer:', error);
        setError(`Error iniciando llamada: ${error.message}`);
      }
    }
  };

  const handleUserLeft = (leftUserId) => {
    if (peerConnectionsRef.current[leftUserId]) {
      peerConnectionsRef.current[leftUserId].close();
      delete peerConnectionsRef.current[leftUserId];
    }
    if (remoteVideosRef.current[leftUserId]) {
      const el = remoteVideosRef.current[leftUserId];
      el.parentElement?.remove();
      delete remoteVideosRef.current[leftUserId];
    }
    setParticipants(prev => prev.filter(p => p.userId !== leftUserId));
    setIceCandidatesQueue(prev => { const n = { ...prev }; delete n[leftUserId]; return n; });
  };

  const startMediaAndJoinRoom = async () => {
    try {
      setIsLoading(true); setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      localStreamRef.current = stream;

      wsRef.current = new WebSocket(SIGNALING_SERVER_URL);

      wsRef.current.onopen = () => {
        setIsConnectedToServer(true); setIsLoading(false);
        sendMessage({ type: 'join-room', roomId, userId, userRole });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          switch (message.type) {
            case 'room-joined': setRoomInfo(message.roomInfo); break;
            case 'user-joined': handleUserJoined(message.userId, message.userRole); break;
            case 'user-left': handleUserLeft(message.userId); break;
            case 'offer': handleOffer(message.offer, message.senderId); break;
            case 'answer': handleAnswer(message.answer, message.senderId); break;
            case 'candidate': handleIceCandidate(message.candidate, message.senderId); break;
            case 'error': setError(message.error); break;
            default: break;
          }
        } catch (e) { console.error('Error procesando mensaje:', e); }
      };

      wsRef.current.onerror = () => { setError('Error de conexión al servidor.'); setIsLoading(false); };
      wsRef.current.onclose = () => { setIsConnectedToServer(false); };
    } catch (err) {
      console.error('Error en startMediaAndJoinRoom:', err);
      setError(`Error al acceder a cámara/micrófono: ${err.name}.`);
      setIsLoading(false);
    }
  };

  const leaveRoom = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendMessage({ type: 'leave-room', roomId, userId });
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    Object.values(peerConnectionsRef.current).forEach(pc => pc?.close());
    peerConnectionsRef.current = {};

    Object.values(remoteVideosRef.current).forEach(video => video?.parentElement?.remove());
    remoteVideosRef.current = {};

    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }

    setIsConnectedToServer(false);
    setIsCallInProgress(false);
    setParticipants([]);
    setIceCandidatesQueue({});
    setError('');

    if (onLeaveRoom) onLeaveRoom();
    navigate('/dashboard');
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraEnabled(videoTrack.enabled);
    if (localVideoRef.current) {
      const box = localVideoRef.current.parentElement;
      box?.classList.toggle(styles.cameraOff, !videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (!localStreamRef.current) { setError('No se detectó micrófono.'); setIsAudioEnabled(false); return; }
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) { setError('No se detectó micrófono o permisos.'); setIsAudioEnabled(false); return; }
    audioTrack.enabled = !audioTrack.enabled;
    setIsAudioEnabled(audioTrack.enabled);
    if (localVideoRef.current) {
      const box = localVideoRef.current.parentElement;
      box?.classList.toggle(styles.micOff, !audioTrack.enabled);
    }
  };

  useEffect(() => {
    startMediaAndJoinRoom();
    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      Object.values(peerConnectionsRef.current).forEach(pc => pc?.close());
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
    };
  }, [roomId, userId, userRole]);

  // ---------- Finalizar sesión ----------
  const [finalizando, setFinalizando] = useState(false);
  const [horaInicioLlamada, setHoraInicioLlamada] = useState(null);

  useEffect(() => {
    if (userRole === 'doctor' && isConnectedToServer && !horaInicioLlamada) {
      setHoraInicioLlamada(Date.now());
    }
  }, [userRole, isConnectedToServer, horaInicioLlamada]);

  const finalizarSesion = async () => {
    if (!cita) return;
    setFinalizando(true);
    try {
      const horaFin = Date.now();
      const duracion_minutos = horaInicioLlamada
        ? Math.max(1, Math.round((horaFin - horaInicioLlamada) / 60000))
        : null;

      await (await import('../services/citaService')).default
        .actualizarCitaAdmin(cita.idCita, { estado_cita_id: 6 });

      if (consulta?.idConsulta && duracion_minutos) {
        await consultaService.actualizarConsulta(consulta.idConsulta, { duracion_minutos });
      }
      alert('La sesión ha sido finalizada y la cita marcada como COMPLETADA.');
      leaveRoom();
    } catch {
      alert('Error al finalizar la sesión.');
    } finally { setFinalizando(false); }
  };

  // ---------- UI: modo compacto del dock / móvil ----------
  const [compactControls, setCompactControls] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mqCompact = window.matchMedia('(max-width: 640px)');
    const mqNarrow = window.matchMedia('(max-width: 1024px)');
    const update = () => { setCompactControls(mqCompact.matches); setIsNarrow(mqNarrow.matches); };
    update();
    mqCompact.addEventListener('change', update);
    mqNarrow.addEventListener('change', update);
    return () => { mqCompact.removeEventListener('change', update); mqNarrow.removeEventListener('change', update); };
  }, []);

  const scrollToRail = () => {
    if (railRef.current) railRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.videoContainer}>
      <h2>Sala de Consulta: {roomId}</h2>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {isLoading && <div className={styles.loadingMessage}>Conectando a la sala...</div>}

      <div className={userRole === 'doctor' ? styles.mainLayout : ''}>
        {/* STAGE (videos) */}
        <section className={styles.videoGrid}>
          <div
            className={`${styles.localVideo} ${!isCameraEnabled ? styles.cameraOff : ''} ${!isAudioEnabled ? styles.micOff : ''}`}
          >
            <video ref={localVideoRef} autoPlay muted playsInline />
            <div className={styles.roleLabel}>{userRole === 'doctor' ? 'Doctor' : 'Paciente'} (Tú)</div>
            <div className={`${styles.statusIndicator} ${isConnectedToServer ? '' : styles.disconnected}`} />
          </div>

          <div id="remote-videos-container" className={styles.remoteVideosContainer} />
        </section>

        {/* RAIL (sólo doctor) */}
        {userRole === 'doctor' && (
          <aside className={styles.sidePanel} ref={railRef}>
            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${tab === 'pre' ? styles.tabActive : ''}`}
                onClick={() => setTab('pre')}
              >
                Pre-check-in
              </button>
              <button
                className={`${styles.tab} ${tab === 'exp' ? styles.tabActive : ''}`}
                onClick={() => setTab('exp')}
              >
                Expediente
              </button>
              <button
                className={`${styles.tab} ${tab === 'notas' ? styles.tabActive : ''}`}
                onClick={() => setTab('notas')}
              >
                Notas / Registro
              </button>
            </div>

            {/* Panels */}
            {tab === 'pre' && cita && (cita.motivo_consulta || cita.sintomas || cita.notas_paciente) && (
              <div className={`${styles.infoCard} ${styles.preCheckinCard}`}>
                <div className={styles.infoCardTitle}>Pre-check-in del paciente</div>
                <div className={styles.infoCardContent}>
                  {cita.motivo_consulta && <div><b>Motivo:</b> {cita.motivo_consulta}</div>}
                  {cita.sintomas && <div><b>Síntomas:</b> {cita.sintomas}</div>}
                  {cita.notas_paciente && <div><b>Notas:</b> {cita.notas_paciente}</div>}
                </div>
              </div>
            )}

            {tab === 'exp' && (
              <div className={`${styles.infoCard}`}>
                <div className={styles.infoCardTitle}>Expediente Clínico</div>
                <div className={styles.infoCardContent}>
                  {expedienteLoading && <div>Cargando expediente...</div>}
                  {!expedienteLoading && expediente && (
                    <>
                      <div><b>Paciente:</b> {expediente.paciente?.persona?.nombres} {expediente.paciente?.persona?.apellidos}</div>
                      <div><b>Número de expediente:</b> {expediente.paciente?.numero_expediente}</div>
                      <div><b>Tipo de sangre:</b> {expediente.paciente?.tipo_sangre}</div>
                      <div><b>Alergias:</b> {expediente.paciente?.alergias}</div>
                      <div><b>Enfermedades crónicas:</b> {expediente.paciente?.enfermedades_cronicas}</div>
                      <div><b>Medicamentos actuales:</b> {expediente.paciente?.medicamentos_actuales}</div>

                      <div style={{ marginTop: 8 }}><b>Consultas previas:</b></div>
                      {expediente.citas?.length ? (
                        <ul style={{ maxHeight: '140px', overflowY: 'auto', fontSize: 13 }}>
                          {expediente.citas.map(c => (
                            <li key={c.idCita}>
                              <b>{c.fecha}</b> - {c.Consultum?.diagnostico_principal || 'Sin diagnóstico'}
                              {c.Consultum?.SignosVitales?.length > 0 && (
                                <>
                                  <br />
                                  <span style={{ fontSize: 12 }}>
                                    Signos: {c.Consultum.SignosVitales.map(sv =>
                                      `T: ${sv.temperatura}°C, FC: ${sv.frecuencia_cardiaca}, PA: ${sv.presion_sistolica}/${sv.presion_diastolica}`
                                    ).join(' | ')}
                                  </span>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : <div>No hay consultas previas.</div>}
                    </>
                  )}
                  {!expedienteLoading && !expediente && <div>No se pudo cargar el expediente.</div>}
                </div>
              </div>
            )}

            {tab === 'notas' && (
              <div className={`${styles.infoCard} ${styles.medicalFormCard}`}>
                <div className={styles.infoCardTitle}>Notas de evolución / Registro médico</div>

                {/* Acordeones compactos */}
                <form
                  className={styles.medicalForm}
                  onSubmit={(e) => { e.preventDefault(); guardarInfoMedica(); }}
                >
                  <details className={`${styles.collapseGroup} ${styles.fullRow}`} open>
                    <summary className={styles.collapseSummary}>Diagnóstico</summary>
                    <div className={styles.collapseBody}>
                      <label className={styles.formLabel}>Diagnóstico principal</label>
                      <textarea
                        className={styles.formTextarea}
                        rows={2}
                        value={formMedico.diagnostico_principal}
                        onChange={e => setFormMedico(f => ({ ...f, diagnostico_principal: e.target.value }))}
                        placeholder="Escribe el diagnóstico principal..."
                      />

                      <label className={styles.formLabel}>Diagnósticos secundarios</label>
                      <textarea
                        className={styles.formTextarea}
                        rows={2}
                        value={formMedico.diagnosticos_secundarios}
                        onChange={e => setFormMedico(f => ({ ...f, diagnosticos_secundarios: e.target.value }))}
                        placeholder="Diagnósticos adicionales..."
                      />
                    </div>
                  </details>

                  <details className={`${styles.collapseGroup} ${styles.fullRow}`}>
                    <summary className={styles.collapseSummary}>Plan de tratamiento</summary>
                    <div className={styles.collapseBody}>
                      <label className={styles.formLabel}>Tratamiento</label>
                      <textarea
                        className={styles.formTextarea}
                        rows={2}
                        value={formMedico.tratamiento}
                        onChange={e => setFormMedico(f => ({ ...f, tratamiento: e.target.value }))}
                        placeholder="Describe el tratamiento..."
                      />

                      <label className={styles.formLabel}>Receta médica</label>
                      <textarea
                        className={styles.formTextarea}
                        rows={2}
                        value={formMedico.receta_medica}
                        onChange={e => setFormMedico(f => ({ ...f, receta_medica: e.target.value }))}
                        placeholder="Medicamentos y dosis…"
                      />

                      <label className={styles.formLabel}>Observaciones</label>
                      <textarea
                        className={styles.formTextarea}
                        rows={2}
                        value={formMedico.observaciones}
                        onChange={e => setFormMedico(f => ({ ...f, observaciones: e.target.value }))}
                        placeholder="Observaciones adicionales..."
                      />
                    </div>
                  </details>

                  <details className={`${styles.collapseGroup} ${styles.fullRow}`}>
                    <summary className={styles.collapseSummary}>Estudios y seguimiento</summary>
                    <div className={styles.collapseBody}>
                      <label className={styles.formLabel}>Exámenes solicitados</label>
                      <textarea
                        className={styles.formTextarea}
                        rows={2}
                        value={formMedico.examenes_solicitados}
                        onChange={e => setFormMedico(f => ({ ...f, examenes_solicitados: e.target.value }))}
                        placeholder="Estudios de laboratorio o imagen…"
                      />

                      <label className={styles.formLabel}>Próxima cita recomendada</label>
                      <input
                        className={styles.formInput}
                        type="date"
                        value={formMedico.proxima_cita_recomendada}
                        onChange={e => setFormMedico(f => ({ ...f, proxima_cita_recomendada: e.target.value }))}
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
                    </div>
                  </details>

                  <button type="submit" className={`${styles.saveButton} ${styles.fullRow}`} disabled={medicoLoading}>
                    {medicoLoading ? 'Guardando...' : 'Guardar información'}
                  </button>
                </form>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* DOCK */}
      <div className={`${styles.callControls} ${compactControls ? styles.compact : ''}`}>
        {userRole === 'doctor' && (
          <button onClick={scrollToRail}>
            <span className={styles.btnIcon}>📋</span>
            <span className={styles.btnLabel}>Ver ficha</span>
          </button>
        )}

        <button onClick={toggleCamera}>
          <span className={styles.btnIcon}>📷</span>
          <span className={styles.btnLabel}>{isCameraEnabled ? 'Apagar Cámara' : 'Encender Cámara'}</span>
        </button>

        <button onClick={toggleAudio}>
          <span className={styles.btnIcon}>🎙</span>
          <span className={styles.btnLabel}>{isAudioEnabled ? 'Silenciar Mic' : 'Activar Mic'}</span>
        </button>

        <button onClick={leaveRoom} className={styles.leaveBtn}>
          <span className={styles.btnIcon}>📞</span>
          <span className={styles.btnLabel}>Salir de la Sala</span>
        </button>

        {userRole === 'doctor' && cita && (
          <button
            onClick={finalizarSesion}
            className={styles.saveButton}
            disabled={finalizando}
          >
            <span className={styles.btnIcon}>✅</span>
            <span className={styles.btnLabel}>{finalizando ? 'Finalizando…' : 'Finalizar sesión'}</span>
          </button>
        )}
      </div>

      {/* Mini-PiP del paciente cuando el doctor escribe en móviles */}
      {userRole === 'doctor' && isNarrow && tab === 'notas' && pacienteStream && (
        <div className={styles.miniVideoPiP}>
          <video
            className={styles.miniVideo}
            autoPlay
            muted
            playsInline
            ref={el => { if (el && pacienteStream) el.srcObject = pacienteStream; }}
          />
        </div>
      )}
    </div>
  );
};

export default VideoChat;
