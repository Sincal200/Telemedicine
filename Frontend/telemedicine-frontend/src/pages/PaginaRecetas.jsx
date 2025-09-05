import React, { useEffect, useState } from 'react';
import { Spin, Alert, Typography, Card, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, FileTextOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import RecetasPaciente from '../components/RecetasPaciente';
import userProfileService from '../services/userProfileService';
import styles from '../styles/components/Perfil.module.css'; // Reutilizamos los estilos del perfil

const { Title, Text } = Typography;

function PaginaRecetas() {
  const navigate = useNavigate();
  const [pacienteId, setPacienteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Obtener pacienteId usando el servicio de perfil (correcto)
    async function fetchPacienteId() {
      try {
        const id = await userProfileService.obtenerIdPaciente();
        if (!id) throw new Error('No se encontró el paciente asociado a tu usuario.');
        setPacienteId(id);
      } catch (err) {
        setError('No se pudo obtener el paciente.');
      } finally {
        setLoading(false);
      }
    }
    fetchPacienteId();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <Spin 
            size="large" 
            tip="Cargando historial de consultas..."
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '400px' 
            }} 
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Botón de regresar */}
          <div style={{ marginBottom: '1rem' }}>
            <Button 
              type="default" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
              size="large"
              style={{ 
                borderColor: '#d9d9d9',
                color: '#595959',
                fontWeight: '500'
              }}
            >
              Regresar
            </Button>
          </div>

          <Card style={{ textAlign: 'center', padding: '2rem' }}>
            <Alert 
              type="error" 
              message="Error al cargar el historial"
              description={error}
              showIcon
              style={{ marginBottom: '1rem' }}
            />
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
            >
              Intentar de nuevo
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!pacienteId) {
    return (
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Botón de regresar */}
          <div style={{ marginBottom: '1rem' }}>
            <Button 
              type="default" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
              size="large"
              style={{ 
                borderColor: '#d9d9d9',
                color: '#595959',
                fontWeight: '500'
              }}
            >
              Regresar
            </Button>
          </div>

          <Card style={{ textAlign: 'center', padding: '2rem' }}>
            <Alert 
              type="warning" 
              message="Paciente no encontrado"
              description="No se encontró el paciente asociado a tu usuario."
              showIcon
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Spin spinning={false} tip="Cargando historial de consultas...">
        <div className={styles.contentWrapper}>
          {/* Botón de regresar */}
          <div style={{ marginBottom: '1rem' }}>
            <Button 
              type="default" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
              size="large"
              style={{ 
                borderColor: '#d9d9d9',
                color: '#595959',
                fontWeight: '500'
              }}
            >
              Regresar
            </Button>
          </div>

          {/* Header del historial */}
          <div className={styles.profileHeader}>
            <div className={styles.profileHeaderContent}>
              <div className={styles.avatarSection}>
                <FileTextOutlined style={{ fontSize: '2rem', color: '#1890ff' }} />
              </div>
              <div className={styles.profileInfo}>
                <Title level={2} style={{ margin: 0, color: '#2c3e50' }}>
                  Historial de Consultas
                </Title>
                <Text type="secondary" style={{ fontSize: '1rem' }}>
                  Consulta tus recetas médicas y prescripciones
                </Text>
              </div>
            </div>
            <div className={styles.headerActions}>
              <MedicineBoxOutlined style={{ fontSize: '1.5rem', color: '#52c41a' }} />
            </div>
          </div>

          {/* Contenido principal */}
          <div style={{ marginTop: '2rem' }}>
            <RecetasPaciente pacienteId={pacienteId} />
          </div>
        </div>
      </Spin>
    </div>
  );
}

export default PaginaRecetas;
