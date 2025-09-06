import React, { useEffect, useRef, useState } from 'react';
import ProgramarCita from './ProgramarCita';
import { Drawer, Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/components/Video.module.css';
import consultaService from '../services/consultaService';
import signosVitalesService from '../services/signosVitalesService';
import expedienteService from '../services/expedienteService';
import pacienteService from '../services/pacienteService';

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
  // Estado para el menú Drawer en móvil
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  // ---------- Estado de cita/expediente/notas ----------
  const [cita, setCita] = useState(null);
  const [consulta, setConsulta] = useState(null);
  const [expediente, setExpediente] = useState(null);
  const [expedienteLoading, setExpedienteLoading] = useState(false);
  const [pacienteCompleto, setPacienteCompleto] = useState(null);
  const [pacienteLoading, setPacienteLoading] = useState(false);

  const [formMedico, setFormMedico] = useState({
    diagnostico_principal: '',
    diagnosticos_secundarios: '',
    tratamiento: '',
    observaciones: '',
    receta_medica: '',
    examenes_solicitados: '',
    presion_sistolica: '',
    presion_diastolica: '',
    frecuencia_cardiaca: '',
    temperatura: '',
    peso: '',
    altura: '',
    imc: '',
    oximetria: '',
    glucosa: '',
    frecuencia_respiratoria: '',
    circunferencia_abdominal: '',
    notas_signos: ''
  });
  const [medicoLoading, setMedicoLoading] = useState(false);

  // Tabs del rail
  const [tab, setTab] = useState('pre'); // 'pre' | 'exp' | 'notas'
  const railRef = useRef(null);

  // Modal para programar cita de seguimiento
  const [modalSeguimientoVisible, setModalSeguimientoVisible] = useState(false);


  // Drawer Receta
  const [drawerRecetaOpen, setDrawerRecetaOpen] = useState(false);
  const openDrawerReceta = () => setDrawerRecetaOpen(true);
  const closeDrawerReceta = () => setDrawerRecetaOpen(false);

  // Drawer Notas/Registro
  const [drawerNotasOpen, setDrawerNotasOpen] = useState(false);
  const openDrawerNotas = () => setDrawerNotasOpen(true);
  const closeDrawerNotas = () => setDrawerNotasOpen(false);

  // Drawer Signos Vitales
  const [drawerSignosOpen, setDrawerSignosOpen] = useState(false);
  const openDrawerSignos = () => {
    setDrawerSignosOpen(true);
    cargarSignosExistentes(); // Cargar datos existentes al abrir
  };
  const closeDrawerSignos = () => setDrawerSignosOpen(false);

  // Handler para guardar signos vitales desde Drawer
  const [signosLoading, setSignosLoading] = useState(false);
  const [signosExistentes, setSignosExistentes] = useState(null);
  
  const handleGuardarSignos = async () => {
    if (!consulta?.idConsulta) {
      alert('No hay consulta activa para asociar los signos vitales.');
      return;
    }
    setSignosLoading(true);
    try {
      const {
        presion_sistolica,
        presion_diastolica,
        frecuencia_cardiaca,
        temperatura,
        peso,
        altura,
        imc,
        oximetria,
        glucosa,
        frecuencia_respiratoria,
        circunferencia_abdominal,
        notas_signos
      } = formMedico;

      const signosPayload = {
        consulta_id: consulta.idConsulta,
        tomado_por: userId
      };

      // Solo agregar campos que no estén vacíos
      if (presion_sistolica && presion_sistolica !== '') signosPayload.presion_sistolica = parseInt(presion_sistolica);
      if (presion_diastolica && presion_diastolica !== '') signosPayload.presion_diastolica = parseInt(presion_diastolica);
      if (frecuencia_cardiaca && frecuencia_cardiaca !== '') signosPayload.frecuencia_cardiaca = parseInt(frecuencia_cardiaca);
      if (temperatura && temperatura !== '') signosPayload.temperatura = parseFloat(temperatura);
      if (peso && peso !== '') signosPayload.peso = parseFloat(peso);
      if (altura && altura !== '') signosPayload.altura = parseFloat(altura);
      if (imc && imc !== '') signosPayload.imc = parseFloat(imc);
      if (oximetria && oximetria !== '') signosPayload.oximetria = parseFloat(oximetria);
      if (glucosa && glucosa !== '') signosPayload.glucosa = parseInt(glucosa);
      if (frecuencia_respiratoria && frecuencia_respiratoria !== '') signosPayload.frecuencia_respiratoria = parseInt(frecuencia_respiratoria);
      if (circunferencia_abdominal && circunferencia_abdominal !== '') signosPayload.circunferencia_abdominal = parseFloat(circunferencia_abdominal);
      if (notas_signos && notas_signos !== '') signosPayload.notas = notas_signos;

      // Solo guardar si al menos un campo está lleno (excluyendo consulta_id y tomado_por)
      const camposDatos = Object.keys(signosPayload).filter(key => key !== 'consulta_id' && key !== 'tomado_por');
      if (camposDatos.length === 0) {
        alert('Por favor, ingresa al menos un signo vital.');
        return;
      }

      // Verificar si ya existen signos vitales para esta consulta
      let signosGuardados;
      if (signosExistentes && signosExistentes.length > 0) {
        // Actualizar el registro existente
        const signoExistente = signosExistentes[0];
        signosGuardados = await signosVitalesService.actualizarSignosVitales(signoExistente.idSignosVitales, signosPayload);
        alert('Signos vitales actualizados correctamente');
      } else {
        // Crear nuevo registro
        signosGuardados = await signosVitalesService.crearSignosVitales(signosPayload);
        alert('Signos vitales guardados correctamente');
      }
      
      closeDrawerSignos();
    } catch (error) {
      console.error('Error guardando signos vitales:', error);
      alert('Error guardando signos vitales');
    } finally {
      setSignosLoading(false);
    }
  };

  // Cargar signos vitales existentes al abrir el drawer
  const cargarSignosExistentes = async () => {
    if (!consulta?.idConsulta) return;
    try {
      const signos = await signosVitalesService.obtenerPorConsulta(consulta.idConsulta);
      setSignosExistentes(signos);
      
      // Si hay signos existentes, llenar el formulario con esos datos
      if (signos && signos.length > 0) {
        const signo = signos[0]; // Tomar el primer registro
        setFormMedico(prev => ({
          ...prev,
          presion_sistolica: signo.presion_sistolica || '',
          presion_diastolica: signo.presion_diastolica || '',
          frecuencia_cardiaca: signo.frecuencia_cardiaca || '',
          temperatura: signo.temperatura || '',
          peso: signo.peso || '',
          altura: signo.altura || '',
          imc: signo.imc || '',
          oximetria: signo.oximetria || '',
          glucosa: signo.glucosa || '',
          frecuencia_respiratoria: signo.frecuencia_respiratoria || '',
          circunferencia_abdominal: signo.circunferencia_abdominal || '',
          notas_signos: signo.notas || ''
        }));
      }
    } catch (error) {
      console.error('Error cargando signos vitales:', error);
      setSignosExistentes(null);
    }
  };

  // Handler para guardar receta desde Drawer
  const [recetaDraft, setRecetaDraft] = useState('');
  const handleRecetaChange = e => setRecetaDraft(e.target.value);
  // Guardar solo receta médica
  const handleGuardarReceta = async () => {
    if (!consulta?.idConsulta) {
      alert('No hay consulta activa para asociar la receta.');
      return;
    }
    try {
      // 1. Guardar la receta como texto en la consulta
      await consultaService.actualizarConsulta(consulta.idConsulta, { receta_medica: recetaDraft });
      setFormMedico(prev => ({ ...prev, receta_medica: recetaDraft }));
      setConsulta(prev => ({ ...prev, receta_medica: recetaDraft }));
      
      // 2. Generar el PDF de la receta
      try {
        const response = await fetch(`http://localhost:8081/api/telemedicine/consultas/${consulta.idConsulta}/generar-receta?tenant=telemedicine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || 'secret'}|${sessionStorage.getItem('accessToken')}`
          }
        });
        
        if (response.ok) {
          const pdfData = await response.json();
          console.log('PDF generado exitosamente:', pdfData);
          alert('Receta guardada y PDF generado correctamente');
        } else {
          console.error('Error generando PDF:', response.status);
          alert('Receta guardada como texto, pero hubo un error generando el PDF');
        }
      } catch (pdfError) {
        console.error('Error generando PDF:', pdfError);
        alert('Receta guardada como texto, pero hubo un error generando el PDF');
      }
      
      closeDrawerReceta();
    } catch {
      alert('Error guardando la receta');
    }
  };

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
        
        console.log('🔍 Buscando cita para:', { roomId, userId, userRole });
        
        if (userRole === 'doctor') {
          const citas = await citaService.obtenerCitasMedico(userId);
          console.log('📋 Citas del médico:', citas);
          citaData = citas.find(c => c.room_id === roomId);
        } else {
          const citas = await citaService.obtenerCitasPaciente(userId);
          console.log('📋 Citas del paciente:', citas);
          citaData = citas.find(c => c.room_id === roomId);
        }
        
        console.log('🎯 Cita encontrada:', citaData);
        setCita(citaData || null);

        if (citaData) {
          console.log('👤 ID del paciente en la cita:', citaData.paciente_id);
          
          // Consulta
          try {
            const consultaData = await consultaService.obtenerConsultaPorCitaId(citaData.idCita);
            console.log('📝 Consulta encontrada:', consultaData);
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
          } catch (error) {
            console.error('❌ Error cargando consulta:', error);
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

          // Expediente y datos completos del paciente
          if (citaData.paciente_id) {
            setExpedienteLoading(true);
            setPacienteLoading(true);
            try {
              console.log('📊 Cargando expediente para paciente ID:', citaData.paciente_id);
              
              // Cargar expediente (ya incluye algunos datos de persona)
              const expedienteData = await expedienteService.obtenerExpedientePorPacienteId(citaData.paciente_id);
              console.log('📊 Expediente cargado:', expedienteData);
              setExpediente(expedienteData);
              
              // Cargar datos completos del paciente (datos médicos)
              console.log('👤 Cargando datos completos del paciente ID:', citaData.paciente_id);
              const pacienteData = await pacienteService.getPaciente(citaData.paciente_id);
              console.log('👤 Datos del paciente cargados:', pacienteData);
              setPacienteCompleto(pacienteData);

              // Los datos de persona deberían estar en el expediente (expedienteData.paciente?.persona)
              // Pero también están disponibles en pacienteData.persona si el backend los incluye
              console.log('🔍 Datos de persona en expediente:', expedienteData?.paciente?.persona);
              console.log('🔍 Datos de persona en paciente:', pacienteData?.persona);
              
            } catch (error) { 
              console.error('❌ Error cargando datos del paciente:', error);
              setExpediente(null); 
              setPacienteCompleto(null);
            }
            finally { 
              setExpedienteLoading(false); 
              setPacienteLoading(false);
            }
          } else {
            console.warn('⚠️ No se encontró paciente_id en la cita');
          }
        } else {
          console.warn('⚠️ No se encontró cita para esta sala');
        }
      } catch (error) {
        console.error('❌ Error general cargando datos:', error);
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
      // Solo enviar los campos relevantes, sin seguimiento
      // Guardar información médica
      const {
        diagnostico_principal,
        diagnosticos_secundarios,
        tratamiento,
        observaciones,
        examenes_solicitados,
        presion_sistolica,
        presion_diastolica,
        frecuencia_cardiaca,
        temperatura,
        peso,
        altura,
        imc,
        oximetria,
        glucosa,
        frecuencia_respiratoria,
        circunferencia_abdominal,
        notas_signos
      } = formMedico;
      const payload = {
        diagnostico_principal,
        diagnosticos_secundarios,
        tratamiento,
        observaciones,
        examenes_solicitados
      };

      let consultaGuardada = null;
      if (consulta?.idConsulta) {
        consultaGuardada = await consultaService.actualizarConsulta(consulta.idConsulta, payload);
      } else {
        consultaGuardada = await consultaService.crearConsulta({ cita_id: cita.idCita, ...payload });
      }
      setConsulta(consultaGuardada);

      // Guardar signos vitales si hay datos
      const signosPayload = {
        consulta_id: consultaGuardada.idConsulta,
        presion_sistolica,
        presion_diastolica,
        frecuencia_cardiaca,
        temperatura,
        peso,
        altura,
        imc,
        oximetria,
        glucosa,
        frecuencia_respiratoria,
        circunferencia_abdominal,
        notas: notas_signos,
        tomado_por: userId
      };
      // Solo guardar si al menos un campo está lleno
      const tieneSignos = Object.values(signosPayload).some(v => v && v !== '' && v !== null && v !== undefined);
      if (tieneSignos) {
        await signosVitalesService.crearSignosVitales(signosPayload);
      }
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

      {/* Botones flotantes o menú para abrir Drawers (solo doctor) */}
      {userRole === 'doctor' && (
        <>
          {/* Pantallas grandes: dos botones flotantes */}
          {!compactControls && (
            <>
              <Button
                type="primary"
                shape="circle"
                icon={<span role="img" aria-label="Notas">📝</span>}
                size="large"
                style={{
                  position: 'fixed',
                  bottom: 100,
                  right: 32,
                  zIndex: 1001
                }}
                onClick={openDrawerNotas}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<span role="img" aria-label="Receta">💊</span>}
                size="large"
                style={{
                  position: 'fixed',
                  bottom: 32,
                  right: 32,
                  zIndex: 1001
                }}
                onClick={openDrawerReceta}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<span role="img" aria-label="Signos">🩺</span>}
                size="large"
                style={{
                  position: 'fixed',
                  bottom: 100,
                  right: 100,
                  zIndex: 1001
                }}
                onClick={openDrawerSignos}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<span role="img" aria-label="Seguimiento">📅</span>}
                size="large"
                style={{
                  position: 'fixed',
                  bottom: 168,
                  right: 32,
                  zIndex: 1001
                }}
                onClick={() => setModalSeguimientoVisible(true)}
              />
              <ProgramarCita
                visible={modalSeguimientoVisible}
                onClose={() => setModalSeguimientoVisible(false)}
                tipoCitaPreseleccionado={3}
                pacienteId={cita?.paciente_id}
                consultaId={consulta?.idConsulta}
              />
            </>
          )}
          {/* Pantallas pequeñas: un botón menú flotante */}
          {compactControls && (
            <>
              <Button
                type="primary"
                shape="circle"
                icon={<span role="img" aria-label="Menú">☰</span>}
                size="large"
                style={{
                  position: 'fixed',
                  bottom: 32,
                  right: 32,
                  zIndex: 1001
                }}
                onClick={() => setMenuDrawerOpen(true)}
              />
              <Drawer
                title="Opciones"
                placement="bottom"
                onClose={() => setMenuDrawerOpen(false)}
                open={menuDrawerOpen}
                height={180}
                bodyStyle={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
                style={{ borderRadius: '16px 16px 0 0' }}
                closable={true}
                maskClosable={true}
              >
                <Button
                  type="default"
                  icon={<span role="img" aria-label="Notas">📝</span>}
                  block
                  size="large"
                  style={{ marginBottom: 12 }}
                  onClick={() => {
                    setMenuDrawerOpen(false);
                    openDrawerNotas();
                  }}
                >Notas / Registro</Button>
                <Button
                  type="default"
                  icon={<span role="img" aria-label="Receta">💊</span>}
                  block
                  size="large"
                  onClick={() => {
                    setMenuDrawerOpen(false);
                    openDrawerReceta();
                  }}
                >Receta Médica</Button>
                <Button
                  type="default"
                  icon={<span role="img" aria-label="Signos">🩺</span>}
                  block
                  size="large"
                  onClick={() => {
                    setMenuDrawerOpen(false);
                    openDrawerSignos();
                  }}
                >Signos Vitales</Button>
              </Drawer>
            </>
          )}
        </>
      )}

      {/* Drawer de Notas/Registro */}
      <Drawer
        title="Notas de evolución / Registro médico"
        placement="right"
        onClose={closeDrawerNotas}
        open={drawerNotasOpen}
        width={window.innerWidth < 600 ? '100%' : 420}
        bodyStyle={{ paddingBottom: 80 }}
      >
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
            <summary className={styles.collapseSummary}>Estudios</summary>
            <div className={styles.collapseBody}>
              <label className={styles.formLabel}>Exámenes solicitados</label>
              <textarea
                className={styles.formTextarea}
                rows={2}
                value={formMedico.examenes_solicitados}
                onChange={e => setFormMedico(f => ({ ...f, examenes_solicitados: e.target.value }))}
                placeholder="Estudios de laboratorio o imagen…"
              />
            </div>
          </details>
          <Button type="primary" htmlType="submit" className={styles.saveButton} block disabled={medicoLoading} style={{marginTop: 16}}>
            {medicoLoading ? 'Guardando...' : 'Guardar información'}
          </Button>
        </form>
      </Drawer>

      {/* Drawer de receta */}
      <Drawer
        title="Receta Médica"
        placement="right"
        onClose={closeDrawerReceta}
        open={drawerRecetaOpen}
        width={window.innerWidth < 600 ? '100%' : 400}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical">
          <Form.Item label="Receta médica (medicamentos, dosis, indicaciones)">
            <Input.TextArea
              rows={8}
              value={recetaDraft}
              onChange={handleRecetaChange}
              placeholder="Ej: Paracetamol 500mg cada 8h por 5 días..."
            />
          </Form.Item>
          <Button type="primary" onClick={handleGuardarReceta} block>
            Guardar receta
          </Button>
        </Form>
      </Drawer>

      {/* Drawer de signos vitales */}
      <Drawer
        title="Signos Vitales"
        placement="right"
        onClose={closeDrawerSignos}
        open={drawerSignosOpen}
        width={window.innerWidth < 600 ? '100%' : 500}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="Presión Sistólica (mmHg)">
              <Input 
                type="number" 
                placeholder="120" 
                value={formMedico.presion_sistolica} 
                onChange={e => setFormMedico(f => ({ ...f, presion_sistolica: e.target.value }))} 
              />
            </Form.Item>
            <Form.Item label="Presión Diastólica (mmHg)">
              <Input 
                type="number" 
                placeholder="80" 
                value={formMedico.presion_diastolica} 
                onChange={e => setFormMedico(f => ({ ...f, presion_diastolica: e.target.value }))} 
              />
            </Form.Item>
            <Form.Item label="Frecuencia Cardíaca (lpm)">
              <Input 
                type="number" 
                placeholder="72" 
                value={formMedico.frecuencia_cardiaca} 
                onChange={e => setFormMedico(f => ({ ...f, frecuencia_cardiaca: e.target.value }))} 
              />
            </Form.Item>
            <Form.Item label="Temperatura (°C)">
              <Input 
                type="number" 
                step="0.1" 
                placeholder="36.5" 
                value={formMedico.temperatura} 
                onChange={e => setFormMedico(f => ({ ...f, temperatura: e.target.value }))} 
              />
            </Form.Item>
            <Form.Item label="Peso (kg)">
              <Input 
                type="number" 
                step="0.1" 
                placeholder="70.0" 
                value={formMedico.peso} 
                onChange={e => setFormMedico(f => ({ ...f, peso: e.target.value }))} 
              />
            </Form.Item>
            <Form.Item label="Altura (cm)">
              <Input 
                type="number" 
                step="0.1" 
                placeholder="170.0" 
                value={formMedico.altura} 
                onChange={e => setFormMedico(f => ({ ...f, altura: e.target.value }))} 
              />
            </Form.Item>
            <Form.Item label="IMC">
              <Input 
                type="number" 
                step="0.1" 
                placeholder="24.2" 
                value={formMedico.imc} 
                onChange={e => setFormMedico(f => ({ ...f, imc: e.target.value }))} 
              />
            </Form.Item>
            <Form.Item label="Oximetría (%)">
              <Input 
                type="number" 
                step="0.1" 
                placeholder="98.0" 
                value={formMedico.oximetria} 
                onChange={e => setFormMedico(f => ({ ...f, oximetria: e.target.value }))} 
              />
            </Form.Item>
            <Form.Item label="Glucosa (mg/dL)">
              <Input 
                type="number" 
                placeholder="100" 
                value={formMedico.glucosa} 
                onChange={e => setFormMedico(f => ({ ...f, glucosa: e.target.value }))} 
              />
            </Form.Item>
            <Form.Item label="Frecuencia Respiratoria (rpm)">
              <Input 
                type="number" 
                placeholder="16" 
                value={formMedico.frecuencia_respiratoria} 
                onChange={e => setFormMedico(f => ({ ...f, frecuencia_respiratoria: e.target.value }))} 
              />
            </Form.Item>
          </div>
          <Form.Item label="Circunferencia Abdominal (cm)">
            <Input 
              type="number" 
              step="0.1" 
              placeholder="85.0" 
              value={formMedico.circunferencia_abdominal} 
              onChange={e => setFormMedico(f => ({ ...f, circunferencia_abdominal: e.target.value }))} 
            />
          </Form.Item>
          <Form.Item label="Notas">
            <Input.TextArea
              rows={3}
              placeholder="Observaciones sobre los signos vitales..."
              value={formMedico.notas_signos}
              onChange={e => setFormMedico(f => ({ ...f, notas_signos: e.target.value }))}
            />
          </Form.Item>
          <Button type="primary" onClick={handleGuardarSignos} block loading={signosLoading}>
            {signosLoading ? 'Guardando...' : 'Guardar signos vitales'}
          </Button>
        </Form>
      </Drawer>
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
              {/* El tab de Notas/Registro solo está en el Drawer flotante */}
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
                  {(expedienteLoading || pacienteLoading) && <div>Cargando expediente...</div>}
                  
                  {!expedienteLoading && !pacienteLoading && (expediente || pacienteCompleto) && (
                    <>
                      {/* Información Personal */}
                      <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#1890ff' }}>📋 Información Personal</div>
                        {(() => {
                          // Priorizar datos de persona del expediente, luego del paciente completo
                          const persona = expediente?.paciente?.persona || pacienteCompleto?.persona;
                          const pacienteInfo = expediente?.paciente || pacienteCompleto;
                          
                          console.log('🔍 Persona seleccionada para mostrar:', persona);
                          console.log('🔍 Paciente info seleccionada:', pacienteInfo);
                          
                          if (!persona && !pacienteInfo) {
                            return (
                              <div style={{ color: '#ff7875', fontStyle: 'italic' }}>
                                ❌ No se pudieron cargar los datos personales
                              </div>
                            );
                          }
                          
                          return (
                            <>
                              {persona && (
                                <>
                                  <div><b>Nombre completo:</b> {persona.nombres || 'No registrado'} {persona.apellidos || ''}</div>
                                  <div><b>Número de documento:</b> {persona.numero_documento || 'No registrado'}</div>
                                  <div><b>Fecha de nacimiento:</b> {persona.fecha_nacimiento ? new Date(persona.fecha_nacimiento).toLocaleDateString('es-ES') : 'No registrada'}</div>
                                  <div><b>Edad:</b> {persona.fecha_nacimiento ? 
                                    Math.floor((new Date() - new Date(persona.fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : 'No calculada'} años</div>
                                  <div><b>Sexo:</b> {persona.Sexo?.descripcion || (persona.sexo_id === 1 ? 'Masculino' : persona.sexo_id === 2 ? 'Femenino' : 'No especificado')}</div>
                                  <div><b>Teléfono:</b> {persona.telefono || 'No registrado'}</div>
                                  <div><b>Email:</b> {persona.email || 'No registrado'}</div>
                                  {persona.Direccion && (
                                    <div><b>Dirección:</b> {persona.Direccion.direccion_completa || 'No registrada'}</div>
                                  )}
                                </>
                              )}
                              {pacienteInfo && (
                                <>
                                  <div><b>Número de expediente:</b> {pacienteInfo.numero_expediente || 'No asignado'}</div>
                                  <div><b>Contacto de emergencia:</b> {pacienteInfo.contacto_emergencia_nombre || 'No registrado'}</div>
                                  <div><b>Teléfono de emergencia:</b> {persona?.telefono_emergencia || pacienteInfo.contacto_emergencia_telefono || 'No registrado'}</div>
                                  <div><b>Parentesco:</b> {pacienteInfo.contacto_emergencia_parentesco || 'No registrado'}</div>
                                </>
                              )}
                              {!persona && pacienteInfo && (
                                <div style={{ color: '#fa8c16', fontStyle: 'italic', marginTop: 8 }}>
                                  ⚠️ Algunos datos personales no están disponibles. Solo se muestran datos médicos.
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Información Médica */}
                      <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#fff2e8', borderRadius: '6px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#fa8c16' }}>🩺 Información Médica</div>
                        {(() => {
                          // Priorizar datos médicos del expediente, luego del paciente completo
                          const datosMedicos = expediente?.paciente || pacienteCompleto;
                          
                          console.log('🏥 DEBUG - Datos médicos encontrados:', datosMedicos);
                          console.log('🩺 DEBUG - Expediente.paciente:', expediente?.paciente);
                          console.log('👤 DEBUG - PacienteCompleto:', pacienteCompleto);
                          
                          if (!datosMedicos) {
                            return (
                              <div style={{ color: '#ff7875', fontStyle: 'italic' }}>
                                ❌ No se pudieron cargar los datos médicos
                              </div>
                            );
                          }
                          
                          return (
                            <>
                              <div><b>Tipo de sangre:</b> {datosMedicos.tipo_sangre || 'No registrado'}</div>
                              <div><b>Alergias:</b> {datosMedicos.alergias || 'Ninguna registrada'}</div>
                              <div><b>Enfermedades crónicas:</b> {datosMedicos.enfermedades_cronicas || 'Ninguna registrada'}</div>
                              <div><b>Medicamentos actuales:</b> {datosMedicos.medicamentos_actuales || 'Ninguno registrado'}</div>
                              <div><b>Seguro médico:</b> {datosMedicos.seguro_medico || 'No registrado'}</div>
                              <div><b>Número de seguro:</b> {datosMedicos.numero_seguro || 'No registrado'}</div>
                              <div><b>Fecha primera consulta:</b> {datosMedicos.fecha_primera_consulta ? new Date(datosMedicos.fecha_primera_consulta).toLocaleDateString('es-ES') : 'No registrada'}</div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Historial de Consultas */}
                      <div style={{ marginBottom: 8, padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#52c41a' }}>📊 Consultas Previas</div>
                        {expediente?.citas?.length ? (
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {expediente.citas.slice(0, 5).map(c => (
                              <div key={c.idCita} style={{ 
                                marginBottom: '8px', 
                                padding: '8px', 
                                backgroundColor: 'white', 
                                borderRadius: '4px',
                                border: '1px solid #d9d9d9',
                                fontSize: '13px'
                              }}>
                                <div style={{ fontWeight: 'bold' }}>📅 {new Date(c.fecha).toLocaleDateString()}</div>
                                <div><b>Diagnóstico:</b> {c.Consultum?.diagnostico_principal || 'Sin diagnóstico'}</div>
                                {c.Consultum?.tratamiento && (
                                  <div><b>Tratamiento:</b> {c.Consultum.tratamiento}</div>
                                )}
                                {c.Consultum?.SignosVitales?.length > 0 && (
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    <b>Signos vitales:</b> {c.Consultum.SignosVitales.map(sv => {
                                      const signos = [];
                                      if (sv.temperatura) signos.push(`T: ${sv.temperatura}°C`);
                                      if (sv.frecuencia_cardiaca) signos.push(`FC: ${sv.frecuencia_cardiaca}`);
                                      if (sv.presion_sistolica && sv.presion_diastolica) signos.push(`PA: ${sv.presion_sistolica}/${sv.presion_diastolica}`);
                                      return signos.join(', ');
                                    }).join(' | ')}
                                  </div>
                                )}
                              </div>
                            ))}
                            {expediente.citas.length > 5 && (
                              <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                                ... y {expediente.citas.length - 5} consultas más
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ color: '#666', fontStyle: 'italic' }}>No hay consultas previas registradas.</div>
                        )}
                      </div>
                    </>
                  )}
                  
                  {!expedienteLoading && !pacienteLoading && !expediente && !pacienteCompleto && (
                    <div style={{ color: '#ff4d4f', textAlign: 'center', padding: '20px' }}>
                      ❌ No se pudo cargar la información del paciente
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* El formulario de notas/registro ahora está en el Drawer */}
          </aside>
        )}
      </div>

      {/* DOCK */}
      <div className={`${styles.callControls} ${compactControls ? styles.compact : ''}`}>
        

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
