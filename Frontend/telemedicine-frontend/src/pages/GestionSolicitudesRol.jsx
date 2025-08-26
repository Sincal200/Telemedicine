import { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  message,
  Descriptions,
  Statistic,
  Row,
  Col,
  Tabs,
  Avatar,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import solicitudRolService from '../services/solicitudRolService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function GestionSolicitudesRol() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filtros, setFiltros] = useState({
    estado: 'pendiente'
  });
  const [modalAprobacion, setModalAprobacion] = useState({
    visible: false,
    solicitud: null,
    tipo: null
  });
  const [form] = Form.useForm();

  useEffect(() => {
    cargarSolicitudes();
    cargarEstadisticas();
  }, [pagination.current, pagination.pageSize, filtros]);

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const filtrosConPaginacion = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filtros
      };

      const response = await solicitudRolService.obtenerSolicitudes(filtrosConPaginacion);
      
      console.log('Respuesta del API:', response);
      console.log('Datos de solicitudes:', response.data);
      
      setSolicitudes(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0
      }));
    } catch (error) {
      message.error('Error cargando solicitudes: ' + error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await solicitudRolService.obtenerEstadisticas();
      setEstadisticas(response.data || {
        total: 0,
        pendientes: 0,
        aprobadas: 0,
        rechazadas: 0
      });
    } catch (error) {
      message.error('Error cargando estadísticas: ' + error.message);
      console.error('Error:', error);
    }
  };

  const handleAprobarRechazar = async (values) => {
    try {
      const { solicitud, tipo } = modalAprobacion;
      
      if (tipo === 'aprobar') {
        await solicitudRolService.aprobarSolicitud(solicitud.idSolicitud);
        message.success('Solicitud aprobada exitosamente');
      } else {
        await solicitudRolService.rechazarSolicitud(solicitud.idSolicitud, values.motivo_rechazo);
        message.success('Solicitud rechazada');
      }

      cerrarModal();
      cargarSolicitudes();
      cargarEstadisticas();
    } catch (error) {
      message.error('Error procesando solicitud: ' + error.message);
      console.error('Error:', error);
    }
  };

  const handleMarcarEnRevision = async (solicitud) => {
    try {
      await solicitudRolService.marcarEnRevision(solicitud.idSolicitud);
      message.success('Solicitud marcada como en revisión');
      cargarSolicitudes();
      cargarEstadisticas();
    } catch (error) {
      message.error('Error marcando solicitud: ' + error.message);
      console.error('Error:', error);
    }
  };

  const abrirModal = (solicitud, tipo) => {
    console.log('Solicitud seleccionada:', solicitud);
    console.log('ID de solicitud:', solicitud.idSolicitud);
    
    setModalAprobacion({
      visible: true,
      solicitud,
      tipo
    });
    form.resetFields();
  };

  const cerrarModal = () => {
    setModalAprobacion({
      visible: false,
      solicitud: null,
      tipo: null
    });
    form.resetFields();
  };

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  };

  const handleTableChange = (paginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    }));
  };

  const getEstadoTag = (estado) => {
    const colores = {
      'pendiente': 'orange',
      'aprobado': 'green',
      'rechazado': 'red',
      'en_revision': 'blue'
    };

    const textos = {
      'pendiente': 'Pendiente',
      'aprobado': 'Aprobado',
      'rechazado': 'Rechazado',
      'en_revision': 'En Revisión'
    };

    return <Tag color={colores[estado]}>{textos[estado] || estado}</Tag>;
  };

  const getRolTag = (rol) => {
    const colores = {
      'paciente': 'blue',
      'personal_medico': 'green',
      'administrador': 'purple',
      'enfermero': 'cyan',
      'recepcionista': 'orange'
    };

    const textos = {
      'paciente': 'Paciente',
      'personal_medico': 'Personal Médico',
      'administrador': 'Administrador',
      'enfermero': 'Enfermero',
      'recepcionista': 'Recepcionista'
    };

    return <Tag color={colores[rol]}>{textos[rol] || rol}</Tag>;
  };

  const columns = [
    {
      title: 'Usuario',
      key: 'usuario',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div><strong>{record.usuario?.persona?.nombres} {record.usuario?.persona?.apellidos}</strong></div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {record.usuario?.persona?.email}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: 'Rol Solicitado',
      dataIndex: 'tipo_rol_solicitado',
      key: 'tipo_rol_solicitado',
      render: (rol) => getRolTag(rol)
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => getEstadoTag(estado)
    },
    {
      title: 'Fecha Solicitud',
      dataIndex: 'creado',
      key: 'creado',
      render: (fecha) => new Date(fecha).toLocaleDateString('es-ES')
    },
    {
      title: 'Motivo',
      dataIndex: 'justificacion',
      key: 'justificacion',
      ellipsis: true,
      render: (motivo) => (
        <Tooltip title={motivo}>
          <Text>{motivo}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          {record.estado === 'pendiente' && (
            <>
              <Tooltip title="Aprobar">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  size="small"
                  onClick={() => abrirModal(record, 'aprobar')}
                />
              </Tooltip>
              <Tooltip title="Rechazar">
                <Button
                  danger
                  icon={<CloseOutlined />}
                  size="small"
                  onClick={() => abrirModal(record, 'rechazar')}
                />
              </Tooltip>
              <Tooltip title="Marcar en revisión">
                <Button
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={() => handleMarcarEnRevision(record)}
                />
              </Tooltip>
            </>
          )}
          {record.estado !== 'pendiente' && (
            <Text type="secondary">No hay acciones disponibles</Text>
          )}
        </Space>
      )
    }
  ];

  const estadisticasItems = [
    {
      key: 'todas',
      tab: 'Estadísticas Generales',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Solicitudes"
                value={estadisticas.total}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pendientes"
                value={estadisticas.pendientes}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Aprobadas"
                value={estadisticas.aprobadas}
                prefix={<CheckOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Rechazadas"
                value={estadisticas.rechazadas}
                prefix={<CloseOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <Title level={2}>
              <MedicineBoxOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Gestión de Solicitudes de Rol
            </Title>
            <Text type="secondary">
              Administra las solicitudes de roles de usuarios en el sistema de telemedicina
            </Text>
          </div>

          {/* Estadísticas */}
          <Card style={{ marginBottom: '24px' }}>
            <Tabs items={estadisticasItems} />
          </Card>

          {/* Filtros y Controles */}
          <Card style={{ marginBottom: '24px' }}>
            <Row gutter={16} align="middle" justify="space-between">
              <Col>
                <Space>
                  <Text strong>Filtros:</Text>
                  <Select
                    value={filtros.estado}
                    onChange={(value) => handleFiltroChange('estado', value)}
                    style={{ width: 150 }}
                    placeholder="Estado"
                  >
                    <Option value="">Todas</Option>
                    <Option value="pendiente">Pendientes</Option>
                    <Option value="aprobado">Aprobadas</Option>
                    <Option value="rechazado">Rechazadas</Option>
                    <Option value="en_revision">En Revisión</Option>
                  </Select>
                </Space>
              </Col>
              <Col>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    cargarSolicitudes();
                    cargarEstadisticas();
                  }}
                  type="primary"
                  ghost
                >
                  Actualizar
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Tabla de solicitudes */}
          <Card 
            title={
              <Space>
                <TeamOutlined />
                <span>Solicitudes de Rol ({solicitudes.length})</span>
              </Space>
            }
            extra={
              <Text type="secondary">
                Total: {pagination.total} solicitudes
              </Text>
            }
          >
            <Table
              columns={columns}
              dataSource={solicitudes}
              rowKey="idSolicitud"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} de ${total} solicitudes`,
                pageSizeOptions: ['10', '20', '50']
              }}
              onChange={handleTableChange}
              scroll={{ x: 800 }}
              locale={{
                emptyText: 'No hay solicitudes disponibles'
              }}
            />
          </Card>
        </div>

        {/* Modal de aprobación/rechazo */}
        <Modal
          title={
            <Space>
              {modalAprobacion.tipo === 'aprobar' ? (
                <CheckOutlined style={{ color: '#52c41a' }} />
              ) : (
                <CloseOutlined style={{ color: '#f5222d' }} />
              )}
              {modalAprobacion.tipo === 'aprobar' 
                ? 'Aprobar Solicitud de Rol' 
                : 'Rechazar Solicitud de Rol'
              }
            </Space>
          }
          open={modalAprobacion.visible}
          onCancel={cerrarModal}
          footer={null}
          width={700}
          destroyOnClose
        >
          {modalAprobacion.solicitud && (
            <>
              {/* Información del usuario */}
              <Card 
                size="small" 
                style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}
              >
                <Descriptions
                  title="Información del Solicitante"
                  bordered
                  column={2}
                  size="small"
                >
                  <Descriptions.Item label="Nombre Completo" span={2}>
                    <Space>
                      <Avatar icon={<UserOutlined />} />
                      <strong>
                        {modalAprobacion.solicitud.usuario?.persona?.nombres} {modalAprobacion.solicitud.usuario?.persona?.apellidos}
                      </strong>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {modalAprobacion.solicitud.usuario?.persona?.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Rol Solicitado">
                    {getRolTag(modalAprobacion.solicitud.tipo_rol_solicitado)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Estado Actual">
                    {getEstadoTag(modalAprobacion.solicitud.estado)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Fecha de Solicitud">
                    {new Date(modalAprobacion.solicitud.creado).toLocaleString('es-ES')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Motivo de Solicitud" span={2}>
                    <Text>{modalAprobacion.solicitud.justificacion}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Formulario de acción */}
              <Form
                form={form}
                layout="vertical"
                onFinish={handleAprobarRechazar}
              >
                {modalAprobacion.tipo === 'aprobar' && (
                  <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
                    <Space>
                      <CheckOutlined style={{ color: '#52c41a' }} />
                      <Text strong style={{ color: '#52c41a' }}>
                        ¿Confirmas que deseas aprobar esta solicitud de rol?
                      </Text>
                    </Space>
                    <div style={{ marginTop: '8px' }}>
                      <Text type="secondary">
                        Al aprobar, se creará automáticamente el registro correspondiente y el usuario podrá acceder a las funcionalidades del rol solicitado.
                      </Text>
                    </div>
                  </div>
                )}

                {modalAprobacion.tipo === 'rechazar' && (
                  <>
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '6px' }}>
                      <Space>
                        <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
                        <Text strong style={{ color: '#f5222d' }}>
                          Motivo del rechazo
                        </Text>
                      </Space>
                      <div style={{ marginTop: '8px' }}>
                        <Text type="secondary">
                          Por favor, proporciona una explicación clara del motivo por el cual se rechaza esta solicitud.
                        </Text>
                      </div>
                    </div>
                    
                    <Form.Item
                      label="Motivo del Rechazo"
                      name="motivo_rechazo"
                      rules={[
                        { required: true, message: 'Por favor ingrese el motivo del rechazo' },
                        { min: 10, message: 'El motivo debe tener al menos 10 caracteres' },
                        { max: 500, message: 'El motivo no puede exceder 500 caracteres' }
                      ]}
                    >
                      <TextArea
                        rows={4}
                        placeholder="Ejemplo: La documentación proporcionada no cumple con los requisitos establecidos para el rol solicitado..."
                        showCount
                        maxLength={500}
                      />
                    </Form.Item>
                  </>
                )}

                <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: '24px' }}>
                  <Space size="middle">
                    <Button onClick={cerrarModal} size="large">
                      Cancelar
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      danger={modalAprobacion.tipo === 'rechazar'}
                      icon={modalAprobacion.tipo === 'aprobar' ? <CheckOutlined /> : <CloseOutlined />}
                      size="large"
                      style={{
                        backgroundColor: modalAprobacion.tipo === 'aprobar' ? '#52c41a' : undefined,
                        borderColor: modalAprobacion.tipo === 'aprobar' ? '#52c41a' : undefined
                      }}
                    >
                      {modalAprobacion.tipo === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}
        </Modal>
      </Content>
    </Layout>
  );
}

export default GestionSolicitudesRol;
