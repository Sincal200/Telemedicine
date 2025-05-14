import React, { useEffect, useRef, useState } from 'react';

const LocalVideo = () => {
  const videoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let streamInstance = null; // To keep track of the stream for cleanup

    const startMedia = async () => {
      try {
        // Solicitar acceso a la cámara y al micrófono
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('Stream obtenido en React:', stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setMediaStream(stream); // Guardar el stream para poder detenerlo luego
        streamInstance = stream; // Asignar a la variable local para cleanup
        setError(''); // Limpiar errores previos
      } catch (err) {
        console.error('Error al acceder a los medios en React:', err);
        setError(`Error: ${err.name} - ${err.message}. Asegúrate de permitir el acceso.`);
        if (streamInstance) { // Si hubo un error después de obtener el stream (poco probable aquí)
            streamInstance.getTracks().forEach(track => track.stop());
        }
      }
    };

    startMedia();

    // Función de limpieza para detener el stream cuando el componente se desmonte
    return () => {
      if (streamInstance) {
        console.log('Deteniendo stream local...');
        streamInstance.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // El array vacío asegura que useEffect se ejecute solo una vez (al montar)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px' }}>
      <h2>Mi Video Local (React)</h2>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ border: '1px solid black', width: '320px', height: '240px', backgroundColor: '#333' }}
      />
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default LocalVideo;