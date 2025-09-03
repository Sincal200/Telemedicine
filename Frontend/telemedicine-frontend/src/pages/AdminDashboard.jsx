import { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tabs,
  Space,
  Button,
  Table,
  Tag,
  Avatar,
  Progress,
  Divider
} from 'antd';
import {
  UserOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  SettingOutlined,
  DashboardOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  BellOutlined
} from '@ant-design/icons';
import GestionSolicitudesRol from './GestionSolicitudesRol';
import styles from '../styles/components/AdminDashboard.module.css';
// import GestionUsuarios from '../components/admin/GestionUsuarios';
// import EstadisticasSistema from '../components/admin/EstadisticasSistema';
// import ConfiguracionSistema from '../components/admin/ConfiguracionSistema';

const { Content } = Layout;
const { Title, Text } = Typography;

function AdminDashboard() {
  const [estadisticasGenerales, setEstadisticasGenerales] = useState({
    totalUsuarios: 0,
    totalMedicos: 0,
    totalPacientes: 0,
    citasHoy: 0,
    consultasCompletadas: 0,
    recetasGeneradas: 0,
    solicitudesPendientes: 0,
    sistemaActivo: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarEstadisticasGenerales();
  }, []);

  const cargarEstadisticasGenerales = async () => {
    setLoading(true);
    try {
      // Aquí puedes hacer llamadas a diferentes servicios para obtener estadísticas
      // Por ahora usaremos datos simulados
      setEstadisticasGenerales({
        totalUsuarios: 156,
        totalMedicos: 23,
        totalPacientes: 133,
        citasHoy: 12,
        consultasCompletadas: 89,
        recetasGeneradas: 67,
        solicitudesPendientes: 5,
        sistemaActivo: true
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <Space>
          <DashboardOutlined />
          Vista General
        </Space>
      ),
      children: (
        <div className={styles.tabPane}>
          {/* Estadísticas principales */}
          <Row gutter={[16, 16]} className={styles.overviewGrid}>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title="Total Usuarios"
                  value={estadisticasGenerales.totalUsuarios}
                  prefix={<TeamOutlined className={styles.statIcon} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title="Médicos Activos"
                  value={estadisticasGenerales.totalMedicos}
                  prefix={<UserOutlined className={styles.statIcon} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title="Pacientes Registrados"
                  value={estadisticasGenerales.totalPacientes}
                  prefix={<MedicineBoxOutlined className={styles.statIcon} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.statCard}>
                <Statistic
                  title="Citas Hoy"
                  value={estadisticasGenerales.citasHoy}
                  prefix={<CalendarOutlined className={styles.statIcon} />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Segunda fila de estadísticas */}
          <Row gutter={[16, 16]} className={styles.chartContainer}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Consultas Completadas"
                  value={estadisticasGenerales.consultasCompletadas}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Recetas Generadas"
                  value={estadisticasGenerales.recetasGeneradas}
                  prefix={<MedicineBoxOutlined />}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Solicitudes Pendientes"
                  value={estadisticasGenerales.solicitudesPendientes}
                  prefix={<BellOutlined />}
                  valueStyle={{ color: '#fa541c' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text type="secondary">Estado del Sistema</Text>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: estadisticasGenerales.sistemaActivo ? '#52c41a' : '#ff4d4f' }}>
                      {estadisticasGenerales.sistemaActivo ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>
                  <SecurityScanOutlined style={{ fontSize: '24px', color: estadisticasGenerales.sistemaActivo ? '#52c41a' : '#ff4d4f' }} />
                </div>
              </Card>
            </Col>
          </Row>

          {/* Actividad reciente y alertas */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Actividad Reciente" extra={<Button size="small">Ver todo</Button>}>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">Gráfico de actividad reciente - Próximamente</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Alertas del Sistema" extra={<Button size="small">Configurar</Button>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>Uso de almacenamiento</Text>
                    <Progress percent={65} size="small" style={{ width: '150px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>Carga del servidor</Text>
                    <Progress percent={42} size="small" style={{ width: '150px' }} status="active" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>Conexiones activas</Text>
                    <Progress percent={78} size="small" style={{ width: '150px' }} />
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Sistema funcionando correctamente
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'solicitudes',
      label: (
        <Space>
          <UserOutlined />
          Solicitudes de Rol
        </Space>
      ),
      children: <GestionSolicitudesRol />
    },
    {
      key: 'usuarios',
      label: (
        <Space>
          <TeamOutlined />
          Gestión de Usuarios
        </Space>
      ),
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <TeamOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
            <Title level={4} type="secondary">Gestión de Usuarios</Title>
            <Text type="secondary">
              Panel para administrar usuarios, roles y permisos - Próximamente
            </Text>
          </div>
        </Card>
      )
    },
    {
      key: 'estadisticas',
      label: (
        <Space>
          <BarChartOutlined />
          Estadísticas
        </Space>
      ),
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <BarChartOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
            <Title level={4} type="secondary">Estadísticas Avanzadas</Title>
            <Text type="secondary">
              Reportes detallados, métricas y análisis del sistema - Próximamente
            </Text>
          </div>
        </Card>
      )
    },
    {
      key: 'configuracion',
      label: (
        <Space>
          <SettingOutlined />
          Configuración
        </Space>
      ),
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <SettingOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
            <Title level={4} type="secondary">Configuración del Sistema</Title>
            <Text type="secondary">
              Ajustes generales, configuración de seguridad y parámetros del sistema - Próximamente
            </Text>
          </div>
        </Card>
      )
    },
    {
      key: 'sistema',
      label: (
        <Space>
          <DatabaseOutlined />
          Mantenimiento
        </Space>
      ),
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <DatabaseOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
            <Title level={4} type="secondary">Mantenimiento del Sistema</Title>
            <Text type="secondary">
              Backup, logs, limpieza de datos y mantenimiento - Próximamente
            </Text>
          </div>
        </Card>
      )
    }
  ];

  return (
    <Layout className={styles.adminContainer}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div className={styles.headerSection}>
            <Title level={2} className={styles.headerTitle}>
              <DashboardOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Panel de Administración
            </Title>
            <Text type="secondary" className={styles.headerSubtitle}>
              Centro de control y gestión del sistema de telemedicina
            </Text>
          </div>

          {/* Tabs principales */}
          <div className={styles.contentSection}>
            <Tabs
              defaultActiveKey="overview"
              className={styles.tabsContainer}
            items={tabItems}
            size="large"
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '24px'
            }}
          />
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default AdminDashboard;
