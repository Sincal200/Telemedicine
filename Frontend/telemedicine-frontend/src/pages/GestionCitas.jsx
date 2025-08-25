import { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Tabs,
  FloatButton
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ProgramarCita from '../components/ProgramarCita';
import MisCitas from '../components/MisCitas';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

function GestionCitas() {
  const navigate = useNavigate();
  const [modalProgramarVisible, setModalProgramarVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [userRole, setUserRole] = useState('patient');

  useEffect(() => {
    getUserInfo();
  }, []);

  const getUserInfo = () => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        setUserInfo({
          id: decoded.sub,
          name: decoded.name || 'Usuario',
          email: decoded.email || 'usuario@email.com',
          role: decoded.realm_access?.roles?.includes('doctor') ? 'doctor' : 'patient'
        });
        setUserRole(decoded.realm_access?.roles?.includes('doctor') ? 'doctor' : 'patient');
      } catch (error) {
        console.error('Error decodificando token:', error);
      }
    }
  };

  const handleProgramarSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const volver = () => {
    navigate('/dashboard');
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <Card style={{ marginBottom: 24 }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={volver}
                    type="text"
                  >
                    Volver al Dashboard
                  </Button>
                  <div>
                    <Title level={2} style={{ margin: 0 }}>
                      <CalendarOutlined /> Gestión de Citas
                    </Title>
                    <Text type="secondary">
                      {userRole === 'doctor' 
                        ? 'Administra las consultas médicas'
                        : 'Programa y gestiona tus citas médicas'
                      }
                    </Text>
                  </div>
                </Space>
              </Col>
              
              {userRole === 'patient' && (
                <Col>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => setModalProgramarVisible(true)}
                  >
                    Nueva Cita
                  </Button>
                </Col>
              )}
            </Row>
          </Card>

          {/* Contenido principal */}
          <Tabs
            defaultActiveKey="mis-citas"
            size="large"
            items={[
              {
                key: 'mis-citas',
                label: (
                  <Space>
                    <ClockCircleOutlined />
                    {userRole === 'doctor' ? 'Mis Consultas' : 'Mis Citas'}
                  </Space>
                ),
                children: (
                  <MisCitas
                    userRole={userRole}
                    userId={userInfo?.id || 1}
                    refreshTrigger={refreshTrigger}
                  />
                )
              },
              userRole === 'doctor' && {
                key: 'agenda',
                label: (
                  <Space>
                    <CalendarOutlined />
                    Mi Agenda
                  </Space>
                ),
                children: (
                  <Card>
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <CalendarOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      <Title level={4} type="secondary">
                        Vista de Agenda
                      </Title>
                      <Text type="secondary">
                        Próximamente: Vista de calendario para médicos
                      </Text>
                    </div>
                  </Card>
                )
              },
              userRole === 'doctor' && {
                key: 'pacientes',
                label: (
                  <Space>
                    <UserOutlined />
                    Mis Pacientes
                  </Space>
                ),
                children: (
                  <Card>
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <UserOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      <Title level={4} type="secondary">
                        Lista de Pacientes
                      </Title>
                      <Text type="secondary">
                        Próximamente: Gestión de pacientes
                      </Text>
                    </div>
                  </Card>
                )
              }
            ].filter(Boolean)}
          />
        </div>

        {/* Botón flotante para programar cita (solo pacientes) */}
        {userRole === 'patient' && (
          <FloatButton
            icon={<PlusOutlined />}
            type="primary"
            style={{ right: 24, bottom: 24 }}
            onClick={() => setModalProgramarVisible(true)}
            tooltip="Programar nueva cita"
          />
        )}

        {/* Modal para programar cita */}
        <ProgramarCita
          visible={modalProgramarVisible}
          onClose={() => setModalProgramarVisible(false)}
          onSuccess={handleProgramarSuccess}
        />
      </Content>
    </Layout>
  );
}

export default GestionCitas;
