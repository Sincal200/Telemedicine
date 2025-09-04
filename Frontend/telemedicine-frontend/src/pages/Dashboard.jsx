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
  BellOutlined,
  DashboardOutlined
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
  const [userRole, setUserRole] = useState('patient'); // Rol principal
  const [userRoles, setUserRoles] = useState([]); // Todos los roles del usuario
  const [currentView, setCurrentView] = useState('user'); // 'user' o 'admin'
  const navigate = useNavigate();

  useEffect(() => {
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    try {
      const userInfo = await userProfileService.obtenerInfoBasica();
      setUserInfo(userInfo);
      
      // Extraer roles del token para tener información completa
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        const roles = decoded.realm_access?.roles || [];
        
        setUserRoles(roles);
        
        // Determinar rol principal
        if (roles.includes('admin')) {
          setUserRole('admin');
          setCurrentView('admin'); // Iniciar en vista administrativa
        } else if (roles.includes('doctor')) {
          setUserRole('doctor');
        } else {
          setUserRole('patient');
        }
      } else {
        setUserRole(userInfo.role);
      }
      
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
          const roles = decoded.realm_access?.roles || [];
          
          setUserRoles(roles);
          setUserInfo({
            name: decoded.name || 'Usuario',
            email: decoded.email || 'usuario@email.com',
            role: decoded.realm_access?.roles?.includes('doctor') ? 'doctor' : 'patient'
          });
          
          // Determinar rol principal para fallback
          if (roles.includes('admin')) {
            setUserRole('admin');
            setCurrentView('admin'); // Iniciar en vista administrativa
          } else if (roles.includes('doctor')) {
            setUserRole('doctor');
          } else {
            setUserRole('patient');
          }
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

  const toggleView = () => {
    setCurrentView(currentView === 'user' ? 'admin' : 'user');
    message.info(`Cambiando a vista ${currentView === 'user' ? 'administrativa' : 'de usuario'}`);
  };

  // Determinar qué rol mostrar según la vista actual y los roles del usuario
  const getDisplayRole = () => {
    // Si está en vista admin y tiene rol admin, mostrar como admin
    if (currentView === 'admin' && userRoles.includes('admin')) {
      return 'admin';
    }
    
    // Si está en vista usuario, determinar el rol más apropiado
    if (currentView === 'user') {
      // Prioridad: doctor > patient
      if (userRoles.includes('doctor')) {
        return 'doctor';
      }
      if (userRoles.includes('patient')) {
        return 'patient';
      }
    }
    
    // Fallback: usar el rol principal detectado
    return userRole;
  };

  const displayRole = getDisplayRole();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mi Perfil',
      onClick: () => navigate('/perfil'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configuración',
      onClick: () => navigate('/configuracion-horario'),
    },
    // Botón para cambiar vista si es admin
    ...(userRoles.includes('admin') ? [
      {
        key: 'toggle-view',
        icon: currentView === 'user' ? <DashboardOutlined /> : <UserOutlined />,
        label: currentView === 'user' 
          ? `🔄 Cambiar a Vista Admin` 
          : `🔄 Cambiar a Vista ${userRoles.includes('doctor') ? 'Doctor' : 'Usuario'}`,
        onClick: toggleView,
      },
      {
        type: 'divider',
      },
    ] : []),
    // Enlaces administrativos
    ...(userRoles.includes('admin') ? [
      {
        key: 'admin-dashboard',
        icon: <DashboardOutlined />,
        label: 'Panel Administrativo',
        onClick: () => navigate('/admin'),
      },
      {
        key: 'admin-solicitudes',
        icon: <TeamOutlined />,
        label: 'Gestión de Roles',
        onClick: () => navigate('/admin/solicitudes-rol'),
      }
    ] : []),
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

  const adminActivity = [
    {
      id: 1,
      action: 'Nuevo usuario registrado',
      patient: 'Dr. Ana García',
      time: 'Hace 30 minutos'
    },
    {
      id: 2,
      action: 'Solicitud de rol aprobada',
      patient: 'Dr. Luis Martínez',
      time: 'Hace 1 hora'
    },
    {
      id: 3,
      action: 'Sistema actualizado',
      patient: 'Versión 2.1.0',
      time: 'Hace 2 horas'
    }
  ];

  // Seleccionar datos según el rol mostrado
  const currentActivity = displayRole === 'admin' ? adminActivity : recentActivity;

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
                    {displayRole === 'admin' ? 'Administrador' : 
                     displayRole === 'doctor' ? 'Doctor' : 'Paciente'}
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
              {displayRole === 'admin' 
                ? 'Panel de control y administración del sistema'
                : displayRole === 'doctor' 
                  ? 'Aquí tienes un resumen de tus consultas de hoy'
                  : 'Gestiona tus citas y consultas médicas'
              }
            </Text>
            {/* Indicador de vista y roles para usuarios con múltiples roles */}
            {userRoles.includes('admin') && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ 
                  padding: '8px 16px', 
                  background: currentView === 'admin' ? '#e6f7ff' : '#f6ffed',
                  border: `1px solid ${currentView === 'admin' ? '#91d5ff' : '#b7eb8f'}`,
                  borderRadius: '6px',
                  display: 'inline-block',
                  marginBottom: '8px'
                }}>
                  <Text style={{ 
                    color: currentView === 'admin' ? '#1890ff' : '#52c41a',
                    fontWeight: '500',
                    fontSize: '12px'
                  }}>
                    {currentView === 'admin' ? '👑 Vista Administrativa' : '👤 Vista Usuario'}
                  </Text>
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginLeft: '4px' }}>
                  Roles disponibles: {userRoles.join(' • ')}
                </div>
              </div>
            )}
          </div>
          {/* Estadísticas rápidas */}
          <Row gutter={[24, 24]} className={styles.statsRow}>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title={displayRole === 'admin' ? 'Usuarios Sistema' : 'Consultas Hoy'}
                  value={displayRole === 'admin' ? 156 : displayRole === 'doctor' ? 8 : 2}
                  prefix={<CalendarOutlined className={styles.statIcon} />}
                  valueStyle={{ color: '#667eea' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title={displayRole === 'admin' ? 'Consultas Sistema' : displayRole === 'doctor' ? 'Pacientes' : 'Doctores'}
                  value={displayRole === 'admin' ? 89 : displayRole === 'doctor' ? 24 : 3}
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
                      {displayRole === 'admin' ? 'Gestión Sistema' : 
                       displayRole === 'doctor' ? 'Mis Consultas' : 'Gestionar Citas'}
                    </Button>
                  </Col>
                  <Col xs={12} sm={8}>
                    <Button 
                      icon={<FileTextOutlined />}
                      block
                      size="large"
                      className={styles.actionButton}
                    >
                      {displayRole === 'admin' ? 'Reportes' : 'Historial'}
                    </Button>
                  </Col>
                  {displayRole === 'admin' && (
                    <Col xs={12} sm={8}>
                      <Button 
                        icon={<SettingOutlined />}
                        block
                        size="large"
                        className={styles.actionButton}
                        onClick={() => navigate('/admin')}
                      >
                        Panel Admin
                      </Button>
                    </Col>
                  )}
                  {userRoles.includes('admin') && displayRole !== 'admin' && (
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
              {/* Próximas citas - Solo mostrar si no está en vista admin */}
              {displayRole !== 'admin' && (
                <ResumenCitas
                  userRole={displayRole}
                  userId={userInfo?.id || null}
                />
              )}
              {/* Panel administrativo especial */}
              {displayRole === 'admin' && (
                <Card title="Actividad del Sistema" className={styles.actionCard}>
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <SettingOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                    <Title level={4} style={{ color: '#666' }}>Panel Administrativo</Title>
                    <Text style={{ color: '#999', display: 'block', marginBottom: '20px' }}>
                      Utiliza el Panel Administrativo para gestionar usuarios, consultar estadísticas y configurar el sistema.
                    </Text>
                    <Button type="primary" size="large" onClick={() => navigate('/admin')}>
                      Ir al Panel Administrativo
                    </Button>
                  </div>
                </Card>
              )}
            </Col>
            {/* Panel derecho */}
            <Col xs={24} lg={8}>
              {/* Calendario - Solo mostrar si no está en vista admin */}
              {displayRole !== 'admin' && (
                <>
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
                  <Button
                    type="default"
                    icon={<SettingOutlined />}
                    onClick={() => navigate('/configuracion-horario')}
                    style={{ margin: '16px 0', width: '100%' }}
                  >
                    Configurar Horario Médico
                  </Button>
                </>
              )}
              
              {/* Actividad reciente adaptada al rol */}
              <Card 
                title={displayRole === 'admin' ? 'Actividad del Sistema' : 'Actividad Reciente'} 
                className={styles.activityCard}
              >
                <List
                  dataSource={currentActivity}
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
