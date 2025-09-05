import { useEffect, useState } from 'react';
import { Layout, Typography, Button, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import HistorialConsultasDoctor from '../components/HistorialConsultasDoctor';
import userProfileService from '../services/userProfileService';
import styles from '../styles/components/Perfil.module.css';

const { Content } = Layout;
const { Title } = Typography;

function PaginaHistorialConsultasDoctor() {
  const navigate = useNavigate();
  const [personalMedicoId, setPersonalMedicoId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerPersonalMedicoId = async () => {
      try {
        const token = sessionStorage.getItem('accessToken');
        if (!token) {
          message.error('No se encontró token de autenticación');
          navigate('/login');
          return;
        }

        // Usar el servicio establecido para obtener el ID del personal médico
        const idPersonalMedico = await userProfileService.obtenerIdPersonalMedico();
        
        if (idPersonalMedico) {
          setPersonalMedicoId(idPersonalMedico);
        } else {
          message.error('No se encontró información del personal médico. Verifica que tengas permisos de doctor.');
        }
      } catch (error) {
        console.error('Error obteniendo personal médico ID:', error);
        message.error('Error al obtener información del médico');
      } finally {
        setLoading(false);
      }
    };

    obtenerPersonalMedicoId();
  }, [navigate]);

  const handleVolver = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <Layout className={styles.layout}>
        <Content className={styles.content}>
          <div className={styles.loadingContainer}>
            <div>Cargando información del médico...</div>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className={styles.layout}>
      <Content className={styles.content}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={handleVolver}
              className={styles.backButton}
            >
              Volver al Dashboard
            </Button>
            <Title level={2} className={styles.title}>
              Mis Consultas Realizadas
            </Title>
          </div>

          {/* Content */}
          <div className={styles.contentWrapper}>
            {personalMedicoId ? (
              <HistorialConsultasDoctor personalMedicoId={personalMedicoId} />
            ) : (
              <div className={styles.errorContainer}>
                <div>No se pudo cargar la información del médico</div>
                <Button type="primary" onClick={handleVolver}>
                  Volver al Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default PaginaHistorialConsultasDoctor;
