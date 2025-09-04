import React, { useState } from 'react';
import { Input, Button, Card, Spin, Typography } from 'antd';
import { consultarDiagnosticoOpenAI } from '../services/diagnosticoService';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

export default function ChatDiagnostico() {
  const [sintomas, setSintomas] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnviar = async () => {
    setLoading(true);
    setRespuesta('');
    try {
      const token = sessionStorage.getItem('accessToken');
      const data = await consultarDiagnosticoOpenAI(sintomas, token);
      if (data.success) {
        setRespuesta(data.diagnostico);
      } else {
        setRespuesta('Error: ' + (data.error || 'No se pudo obtener diagnóstico.'));
      }
    } catch (err) {
      setRespuesta('Error de conexión con el servidor.');
    }
    setLoading(false);
  };

  return (
    <Card style={{ maxWidth: 600, margin: '32px auto' }}>
      <Title level={3}>Chat Médico Virtual</Title>
      <Paragraph>Describe tus síntomas y recibe orientación médica automatizada.</Paragraph>
      <TextArea
        rows={4}
        value={sintomas}
        onChange={e => setSintomas(e.target.value)}
        placeholder="Ejemplo: fiebre, dolor de cabeza, tos seca"
        style={{ marginBottom: 16 }}
      />
      <Button type="primary" onClick={handleEnviar} loading={loading} disabled={!sintomas.trim()}>
        Consultar diagnóstico
      </Button>
      <div style={{ marginTop: 24 }}>
        {loading && <Spin />}
        {respuesta && <Card type="inner" style={{ marginTop: 16 }}><Paragraph>{respuesta}</Paragraph></Card>}
      </div>
    </Card>
  );
}
