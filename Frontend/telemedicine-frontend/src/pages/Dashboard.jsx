/* filepath: c:\Users\sinca\OneDrive\Documents\Telemedicine\Frontend\telemedicine-frontend\src\pages\Dashboard.jsx */
import { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Avatar, 
  Typography, 
  Button, 
  Row, 
  Col, 
  Statistic, 
  Calendar,
  List,
  Badge,
  Dropdown,
  message
} from 'antd';
import {
  UserOutlined,
  MedicineBoxOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  SettingOutlined,
  LogoutOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  HeartOutlined,
  FileTextOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/components/Dashboard.module.css';
import ResumenCitas from '../components/ResumenCitas';
import userProfileService from '../services/userProfileService';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [userRole, setUserRole] = useState('patient'); // Se obtendría del token
  const navigate = useNavigate();

  useEffect(() => {
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    try {
      const userInfo = await userProfileService.obtenerInfoBasica();
      setUserInfo(userInfo);
      setUserRole(userInfo.role);
      
      // Verificar si el usuario está aprobado
      if (!userInfo.aprobado && userInfo.estado_aprobacion !== 'desconocido') {
        message.warning(`Tu cuenta está ${userInfo.estado_aprobacion}. Algunas funcionalidades pueden estar limitadas.`);
      }
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      
      // Fallback al método anterior
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        try {
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          setUserInfo({
            name: decoded.name || 'Usuario',
            email: decoded.email || 'usuario@email.com',
            role: decoded.realm_access?.roles?.includes('doctor') ? 'doctor' : 'patient'
          });
          setUserRole(decoded.realm_access?.roles?.includes('doctor') ? 'doctor' : 'patient');
        } catch (error) {
          console.error('Error decodificando token:', error);
        }
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    message.success('Sesión cerrada exitosamente');
    navigate('/');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mi Perfil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configuración',
    },
    ...(userRole === 'admin' ? [{
      key: 'admin-solicitudes',
      icon: <TeamOutlined />,
      label: 'Gestión de Roles',
      onClick: () => navigate('/admin/solicitudes-rol'),
    }] : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: handleLogout,
    },
  ];

  const startVideoCall = () => {
    navigate('/video');
  };

  const irAGestionCitas = () => {
    navigate('/citas');
  };

  const upcomingAppointments = [
    {
      id: 1,
      patient: 'María García',
      time: '10:00 AM',
      type: 'Consulta General',
      status: 'confirmada'
    },
    {
      id: 2,
      patient: 'Juan Pérez',
      time: '2:30 PM',
      type: 'Seguimiento',
      status: 'pendiente'
    },
    {
      id: 3,
      patient: 'Ana López',
      time: '4:00 PM',
      type: 'Consulta Especializada',
      status: 'confirmada'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Consulta completada',
      patient: 'Carlos Ruiz',
      time: 'Hace 2 horas'
    },
    {
      id: 2,
      action: 'Prescripción enviada',
      patient: 'Laura Martín',
      time: 'Hace 4 horas'
    },
    {
      id: 3,
      action: 'Cita programada',
      patient: 'Roberto Silva',
      time: 'Hace 1 día'
    }
  ];

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <MedicineBoxOutlined className={styles.logo} />
            <Title level={3} className={styles.headerTitle}>
              Telemedicine
            </Title>
          </div>
          
          <div className={styles.headerRight}>
            <Button 
              type="text" 
              icon={<BellOutlined />} 
              className={styles.iconButton}
            />
            
            <Dropdown 
              menu={{ items: userMenuItems }} 
              placement="bottomRight"
              trigger={['click']}
            >
              <div className={styles.userProfile}>
                <Avatar 
                  size="large" 
                  icon={<UserOutlined />} 
                  className={styles.avatar}
                />
                <div className={styles.userInfo}>
                  <Text className={styles.userName}>
                    {userInfo?.name || 'Usuario'}
                  </Text>
                  <Text className={styles.userRole}>
                    {userRole === 'doctor' ? 'Doctor' : 'Paciente'}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
      </Header>

      <Content className={styles.content}>
        <div className={styles.container}>
          {/* Header de bienvenida */}
          <div className={styles.welcomeSection}>
            <Title level={2} className={styles.welcomeTitle}>
              ¡Bienvenido de vuelta, {userInfo?.name?.split(' ')[0] || 'Usuario'}!
            </Title>
            <Text className={styles.welcomeSubtitle}>
              {userRole === 'doctor' 
                ? 'Aquí tienes un resumen de tus consultas de hoy'
                : 'Gestiona tus citas y consultas médicas'
              }
            </Text>
          </div>

          {/* Estadísticas rápidas */}
          <Row gutter={[24, 24]} className={styles.statsRow}>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title="Consultas Hoy"
                  value={userRole === 'doctor' ? 8 : 2}
                  prefix={<CalendarOutlined className={styles.statIcon} />}
                  valueStyle={{ color: '#667eea' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title={userRole === 'doctor' ? 'Pacientes' : 'Doctores'}
                  value={userRole === 'doctor' ? 24 : 3}
                  prefix={<TeamOutlined className={styles.statIcon} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title="Pendientes"
                  value={3}
                  prefix={<ClockCircleOutlined className={styles.statIcon} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title="Completadas"
                  value={15}
                  prefix={<HeartOutlined className={styles.statIcon} />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Contenido principal */}
          <Row gutter={[24, 24]} className={styles.mainContent}>
            {/* Panel izquierdo */}
            <Col xs={24} lg={16}>
              {/* Acciones rápidas */}
              <Card 
                title="Acciones Rápidas" 
                className={styles.actionCard}
                extra={<Button type="link" icon={<SettingOutlined />} />}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={8}>
                    <Button 
                      type="primary" 
                      icon={<VideoCameraOutlined />}
                      block
                      size="large"
                      className={styles.actionButton}
                      onClick={startVideoCall}
                    >
                      Nueva Consulta
                    </Button>
                  </Col>
                  <Col xs={12} sm={8}>
                    <Button 
                      icon={<PlusOutlined />}
                      block
                      size="large"
                      className={styles.actionButton}
                      onClick={irAGestionCitas}
                    >
                      {userRole === 'doctor' ? 'Mis Consultas' : 'Gestionar Citas'}
                    </Button>
                  </Col>
                  <Col xs={12} sm={8}>
                    <Button 
                      icon={<FileTextOutlined />}
                      block
                      size="large"
                      className={styles.actionButton}
                    >
                      Historial
                    </Button>
                  </Col>
                  {userRole === 'admin' && (
                    <Col xs={12} sm={8}>
                      <Button 
                        icon={<TeamOutlined />}
                        block
                        size="large"
                        className={styles.actionButton}
                        onClick={() => navigate('/admin/solicitudes-rol')}
                        style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                        type="primary"
                      >
                        Gestión Roles
                      </Button>
                    </Col>
                  )}
                </Row>
              </Card>

              {/* Próximas citas */}
              <ResumenCitas
                userRole={userRole}
                userId={userInfo?.id || null}
              />
            </Col>

            {/* Panel derecho */}
            <Col xs={24} lg={8}>
              {/* Calendario */}
              <Card 
                title="Calendario" 
                className={styles.calendarCard}
                size="small"
              >
                <Calendar 
                  fullscreen={false} 
                  className={styles.miniCalendar}
                />
              </Card>

              {/* Actividad reciente */}
              <Card 
                title="Actividad Reciente" 
                className={styles.activityCard}
              >
                <List
                  dataSource={recentActivity}
                  renderItem={(item) => (
                    <List.Item className={styles.activityItem}>
                      <List.Item.Meta
                        title={<Text strong>{item.action}</Text>}
                        description={
                          <div>
                            <Text>{item.patient}</Text>
                            <br />
                            <Text type="secondary" className={styles.activityTime}>
                              {item.time}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
}

export default Dashboard;