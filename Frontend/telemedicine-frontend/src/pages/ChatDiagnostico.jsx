import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Card, Spin, Typography, Avatar, Space, Layout, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { consultarDiagnosticoOpenAI } from '../services/diagnosticoService';
import { useNavigate } from 'react-router-dom';
import '../styles/ChatDiagnostico.css';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Header, Content } = Layout;

export default function ChatDiagnostico() {
  const [mensajes, setMensajes] = useState([
    {
      id: 1,
      tipo: 'bot',
      contenido: '¡Hola! Soy tu asistente médico virtual. Describe tus síntomas y te ayudaré con una orientación médica inicial. Recuerda que esto no reemplaza una consulta médica profesional.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const handleEnviar = async () => {
    if (!inputValue.trim()) return;

    const nuevoMensajeUsuario = {
      id: Date.now(),
      tipo: 'usuario',
      contenido: inputValue.trim(),
      timestamp: new Date()
    };

    setMensajes(prev => [...prev, nuevoMensajeUsuario]);
    setInputValue('');
    setLoading(true);

    try {
      const token = sessionStorage.getItem('accessToken');
      const data = await consultarDiagnosticoOpenAI(inputValue.trim(), token);
      
      const mensajeBot = {
        id: Date.now() + 1,
        tipo: 'bot',
        contenido: data.success ? data.diagnostico : 'Lo siento, no pude procesar tu consulta. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };

      setMensajes(prev => [...prev, mensajeBot]);
    } catch (error) {
      console.error('Error en chat diagnóstico:', error);
      const mensajeError = {
        id: Date.now() + 1,
        tipo: 'bot',
        contenido: 'Ha ocurrido un error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.',
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeError]);
      message.error('Error de conexión con el servidor');
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

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout className="chat-container" style={{ height: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <Header className="chat-header" style={{ 
        background: '#fff', 
        padding: '12px 16px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'auto',
        minHeight: '64px'
      }}>
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
              icon={<RobotOutlined />} 
              style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
              size="large"
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <Title level={4} style={{ 
                margin: 0, 
                color: '#1890ff',
                fontSize: '16px',
                lineHeight: '20px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Asistente Médico Virtual
              </Title>
              <Text type="secondary" style={{ 
                fontSize: '11px',
                lineHeight: '14px',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Orientación médica automatizada
              </Text>
            </div>
          </div>
        </div>
        <div className="status-indicator" style={{ flexShrink: 0 }}>
          <div className="status-dot"></div>
          <Text style={{ fontSize: '12px', color: '#52c41a' }}>En línea</Text>
        </div>
      </Header>

      {/* Chat Content */}
      <Content style={{ 
        padding: '16px', 
        display: 'flex', 
        flexDirection: 'column',
        height: 'calc(100vh - 64px)'
      }}>
        {/* Messages Container */}
        <Card 
          style={{ 
            flex: 1, 
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
          <div className="chat-messages" style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '16px',
            background: 'linear-gradient(to bottom, #f0f2f5, #ffffff)',
            minHeight: '400px',
            maxHeight: 'calc(100vh - 200px)'
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
                    icon={<RobotOutlined />} 
                    style={{ 
                      backgroundColor: '#1890ff', 
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
                  <div
                    className={`message-bubble ${mensaje.tipo === 'usuario' ? 'user-message' : 'bot-message'}`}
                    style={{
                      background: mensaje.tipo === 'usuario' ? '#1890ff' : '#ffffff',
                      color: mensaje.tipo === 'usuario' ? '#fff' : '#000',
                      padding: '12px 16px',
                      borderRadius: '18px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: mensaje.tipo === 'bot' ? '1px solid #f0f0f0' : 'none',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 'none',
                      overflowY: 'visible',
                      lineHeight: '1.5'
                    }}
                  >
                    <div className="message-content">
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
              <div className="typing-indicator-container">
                <Avatar 
                  icon={<RobotOutlined />} 
                  style={{ backgroundColor: '#1890ff', marginRight: '8px' }}
                />
                <div className="message-bubble bot-message">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Input Area */}
        <Card className="chat-input-container" style={{ padding: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe tus síntomas... (Ej: fiebre, dolor de cabeza, tos seca)"
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ 
                flex: 1,
                borderRadius: '20px',
                border: '1px solid #d9d9d9'
              }}
              disabled={loading}
            />
            <Button
              className="send-button"
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
                justifyContent: 'center'
              }}
            />
          </div>
          <div style={{ 
            marginTop: '8px', 
            textAlign: 'center' 
          }}>
            <Text style={{ fontSize: '11px', color: '#999' }}>
              💡 Presiona Enter para enviar, Shift+Enter para nueva línea
            </Text>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}
