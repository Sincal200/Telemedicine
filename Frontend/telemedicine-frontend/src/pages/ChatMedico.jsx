import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Card, Spin, Typography, Avatar, Space, Layout, message, Select, Divider } from 'antd';
import { 
  SendOutlined, 
  UserOutlined, 
  RobotOutlined, 
  ArrowLeftOutlined,
  MedicineBoxOutlined,
  SearchOutlined,
  FileTextOutlined,
  BookOutlined
} from '@ant-design/icons';
import { 
  consultaMedicaProfesional, 
  buscarInformacionEnfermedad, 
  analizarCasoClinico 
} from '../services/consultaMedicaService';
import { useNavigate } from 'react-router-dom';
import '../styles/ChatMedico.css';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Header, Content } = Layout;
const { Option } = Select;

export default function ChatMedico() {
  const [mensajes, setMensajes] = useState([
    {
      id: 1,
      tipo: 'bot',
      contenido: '👨‍⚕️ ¡Bienvenido al Asistente Médico Profesional! Soy tu colega virtual especializado en consultas médicas avanzadas.\n\n🔬 Puedo ayudarte con:\n• Consultas médicas generales\n• Información sobre enfermedades específicas\n• Análisis de casos clínicos\n• Diagnósticos diferenciales\n• Protocolos de tratamiento\n• Referencias a guías clínicas\n\n¿En qué puedo asistirte hoy?',
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [tipoConsulta, setTipoConsulta] = useState('consulta-general');
  const [contextoAdicional, setContextoAdicional] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const handleEnviar = async () => {
    if (!inputValue.trim()) return;

    const nuevoMensaje = {
      id: mensajes.length + 1,
      tipo: 'usuario',
      contenido: inputValue,
      timestamp: new Date(),
      tipoConsulta: tipoConsulta
    };

    setMensajes(prev => [...prev, nuevoMensaje]);
    setInputValue('');
    setLoading(true);

    try {
      let response;
      
      switch (tipoConsulta) {
        case 'consulta-general':
          response = await consultaMedicaProfesional(inputValue, contextoAdicional);
          break;
        case 'informacion-enfermedad':
          response = await buscarInformacionEnfermedad(inputValue, contextoAdicional);
          break;
        case 'analisis-caso':
          response = await analizarCasoClinico(inputValue, contextoAdicional);
          break;
        default:
          response = await consultaMedicaProfesional(inputValue, contextoAdicional);
      }

      if (response.success) {
        console.log('Respuesta completa recibida:', response.respuesta);
        console.log('Longitud de respuesta:', response.respuesta.length);
        
        const respuestaBot = {
          id: mensajes.length + 2,
          tipo: 'bot',
          contenido: response.respuesta,
          timestamp: new Date(),
          tipoRespuesta: response.tipo
        };
        setMensajes(prev => [...prev, respuestaBot]);
      } else {
        console.error('Error en respuesta:', response);
        message.error('Error al obtener respuesta médica');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Error al consultar el asistente médico');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const getTipoConsultaLabel = (tipo) => {
    switch (tipo) {
      case 'consulta-general': return '🩺 Consulta General';
      case 'informacion-enfermedad': return '📚 Info. Enfermedad';
      case 'analisis-caso': return '🔍 Análisis de Caso';
      default: return '🩺 Consulta General';
    }
  };

  const getTipoConsultaIcon = (tipo) => {
    switch (tipo) {
      case 'consulta-general': return <MedicineBoxOutlined />;
      case 'informacion-enfermedad': return <BookOutlined />;
      case 'analisis-caso': return <FileTextOutlined />;
      default: return <MedicineBoxOutlined />;
    }
  };

  return (
    <Layout className="chat-medico-container">
      {/* Header */}
      <Header className="chat-medico-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/dashboard')}
            style={{ flexShrink: 0 }}
          >
            Volver
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <Avatar 
              icon={<MedicineBoxOutlined />} 
              style={{ backgroundColor: '#722ed1', flexShrink: 0 }}
              size="large"
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <Title level={4} style={{ 
                margin: 0, 
                color: '#722ed1',
                fontSize: '16px',
                lineHeight: '20px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Asistente Médico Profesional
              </Title>
              <Text type="secondary" style={{ 
                fontSize: '11px',
                lineHeight: '14px',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Consultas médicas avanzadas con IA
              </Text>
            </div>
          </div>
        </div>
        <div className="status-indicator-medico" style={{ flexShrink: 0 }}>
          <div className="status-dot-medico"></div>
          <Text style={{ fontSize: '12px', color: '#722ed1' }}>Especialista</Text>
        </div>
      </Header>

      <Content style={{ 
        padding: '0',
        background: 'linear-gradient(135deg, #f6f9fc 0%, #e9ecef 100%)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Selector de tipo de consulta */}
        <Card style={{ 
          margin: '8px 16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text strong style={{ color: '#722ed1' }}>Tipo de consulta:</Text>
            <Select
              value={tipoConsulta}
              onChange={setTipoConsulta}
              style={{ minWidth: '200px' }}
              size="small"
            >
              <Option value="consulta-general">
                <Space>
                  <MedicineBoxOutlined />
                  Consulta General
                </Space>
              </Option>
              <Option value="informacion-enfermedad">
                <Space>
                  <BookOutlined />
                  Información de Enfermedad
                </Space>
              </Option>
              <Option value="analisis-caso">
                <Space>
                  <FileTextOutlined />
                  Análisis de Caso Clínico
                </Space>
              </Option>
            </Select>
            <Input
              placeholder="Contexto adicional (opcional)"
              value={contextoAdicional}
              onChange={(e) => setContextoAdicional(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
              size="small"
            />
          </div>
        </Card>

        {/* Área de mensajes */}
        <Card 
          style={{ 
            flex: 1, 
            margin: '0 16px 16px 16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '16px',
            padding: 0,
            overflow: 'hidden'
          }}
          bodyStyle={{ 
            padding: 0, 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div className="chat-medico-messages" style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '16px',
            background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
            minHeight: '400px',
            maxHeight: 'calc(100vh - 280px)',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {mensajes.map((mensaje) => (
              <div
                key={mensaje.id}
                style={{
                  display: 'flex',
                  justifyContent: mensaje.tipo === 'usuario' ? 'flex-end' : 'flex-start',
                  marginBottom: '16px',
                  alignItems: 'flex-start'
                }}
              >
                {mensaje.tipo === 'bot' && (
                  <Avatar 
                    icon={<MedicineBoxOutlined />} 
                    style={{ 
                      backgroundColor: '#722ed1', 
                      marginRight: '8px',
                      flexShrink: 0
                    }}
                  />
                )}
                
                <div style={{ 
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: mensaje.tipo === 'usuario' ? 'flex-end' : 'flex-start',
                  minHeight: 'auto'
                }}>
                  {mensaje.tipo === 'usuario' && mensaje.tipoConsulta && (
                    <div style={{
                      fontSize: '10px',
                      color: '#999',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {getTipoConsultaIcon(mensaje.tipoConsulta)}
                      {getTipoConsultaLabel(mensaje.tipoConsulta)}
                    </div>
                  )}
                  
                  <div
                    className={`message-bubble-medico ${mensaje.tipo === 'usuario' ? 'user-message-medico' : 'bot-message-medico'}`}
                    style={{
                      background: mensaje.tipo === 'usuario' 
                        ? 'linear-gradient(135deg, #722ed1, #9254de)' 
                        : '#ffffff',
                      color: mensaje.tipo === 'usuario' ? '#fff' : '#000',
                      padding: '12px 16px',
                      borderRadius: '18px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: mensaje.tipo === 'bot' ? '1px solid #f0f0f0' : 'none',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 'none',
                      overflowY: 'visible',
                      lineHeight: '1.6',
                      minHeight: 'auto',
                      height: 'auto',
                      display: 'block',
                      overflow: 'visible'
                    }}
                  >
                    <div className="message-content-medico">
                      {mensaje.contenido}
                    </div>
                  </div>
                  
                  <Text 
                    style={{ 
                      fontSize: '11px', 
                      color: '#999', 
                      marginTop: '4px',
                      marginLeft: mensaje.tipo === 'usuario' ? '0' : '8px',
                      marginRight: mensaje.tipo === 'usuario' ? '8px' : '0'
                    }}
                  >
                    {formatTime(mensaje.timestamp)}
                  </Text>
                </div>

                {mensaje.tipo === 'usuario' && (
                  <Avatar 
                    icon={<UserOutlined />} 
                    style={{ 
                      backgroundColor: '#52c41a', 
                      marginLeft: '8px',
                      flexShrink: 0
                    }}
                  />
                )}
              </div>
            ))}
            
            {loading && (
              <div className="typing-indicator-container-medico">
                <Avatar 
                  icon={<MedicineBoxOutlined />} 
                  style={{ backgroundColor: '#722ed1', marginRight: '8px' }}
                />
                <div className="message-bubble-medico bot-message-medico">
                  <Space>
                    <Spin size="small" />
                    <Text style={{ color: '#666' }}>Analizando consulta médica...</Text>
                  </Space>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Input Area */}
        <Card className="chat-input-container-medico" style={{ 
          margin: '0 16px 16px 16px',
          borderRadius: '12px',
          padding: '8px' 
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                tipoConsulta === 'consulta-general' 
                  ? "Describe tu consulta médica... (Ej: protocolo para hipertensión en embarazo)" 
                  : tipoConsulta === 'informacion-enfermedad'
                  ? "¿Qué enfermedad quieres consultar? (Ej: diabetes mellitus tipo 2)"
                  : "Describe el caso clínico para análisis... (Ej: paciente de 45 años con dolor torácico)"
              }
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ 
                flex: 1,
                borderRadius: '20px',
                border: '1px solid #d9d9d9'
              }}
              disabled={loading}
            />
            <Button
              className="send-button-medico"
              type="primary"
              icon={<SendOutlined />}
              onClick={handleEnviar}
              loading={loading}
              disabled={!inputValue.trim() || loading}
              style={{ 
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #722ed1, #9254de)',
                borderColor: '#722ed1'
              }}
            />
          </div>
        </Card>
      </Content>
    </Layout>
  );
}
