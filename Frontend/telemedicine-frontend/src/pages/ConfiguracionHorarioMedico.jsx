import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userProfileService from '../services/userProfileService';
import { getDisponibilidadMedico, crearDisponibilidadMedico, actualizarDisponibilidadMedico, eliminarDisponibilidadMedico } from '../services/disponibilidadMedicoService';
import { 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  TimePicker, 
  Checkbox, 
  message, 
  Alert, 
  Spin,
  Layout,
  Card,
  Typography,
  Row,
  Col,
  Space,
  Tag,
  Avatar,
  Divider,
  Result,
  Popconfirm
} from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import './ConfiguracionHorarioMedico.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const diasSemana = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export default function ConfiguracionHorarioMedico() {
  const navigate = useNavigate();
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form] = Form.useForm();
  const [personalMedicoId, setPersonalMedicoId] = useState(null);
  const [isDoctor, setIsDoctor] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [diaPreseleccionado, setDiaPreseleccionado] = useState(null);

  const fetchDisponibilidad = async (id) => {
    setLoading(true);
    try {
      const data = await getDisponibilidadMedico(id);
      setDisponibilidad(data);
    } catch (err) {
      message.error('Error al cargar disponibilidad');
    }
    setLoading(false);
  };

  useEffect(() => {
    async function getIdAndFetch() {
      try {
        // Get user info first
        const userInfo = await userProfileService.obtenerPerfilCompleto();
        setUserInfo(userInfo);
        
        // Then get medical staff ID
        const id = await userProfileService.obtenerIdPersonalMedico();
        setPersonalMedicoId(id);
        setIsDoctor(!!id);
        
        if (id) {
          fetchDisponibilidad(id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error obteniendo información:', error);
        setIsDoctor(false);
        setLoading(false);
      }
    }
    getIdAndFetch();
  }, []);

  const handleAdd = (diaSeleccionado = null) => {
    setEditData(null);
    setDiaPreseleccionado(diaSeleccionado);
    form.setFieldsValue({
      dia_semana_id: diaSeleccionado,
      hora_inicio: null,
      hora_fin: null,
      duracion_consulta: undefined,
      activo: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditData(record);
    setDiaPreseleccionado(null); // Limpiar día preseleccionado al editar
    form.setFieldsValue({
      ...record,
      dia_semana_id: Number(record.dia_semana_id),
      hora_inicio: dayjs(record.hora_inicio, 'HH:mm:ss'),
      hora_fin: dayjs(record.hora_fin, 'HH:mm:ss'),
      duracion_consulta: Number(record.duracion_consulta),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await eliminarDisponibilidadMedico(id);
      message.success('Disponibilidad eliminada');
      if (personalMedicoId) fetchDisponibilidad(personalMedicoId);
    } catch {
      message.error('Error al eliminar');
    }
    setLoading(false);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    const payload = {
      ...values,
      personal_medico_id: personalMedicoId,
      dia_semana_id: Number(values.dia_semana_id),
      hora_inicio: values.hora_inicio && values.hora_inicio.format ? values.hora_inicio.format('HH:mm:ss') : '',
      hora_fin: values.hora_fin && values.hora_fin.format ? values.hora_fin.format('HH:mm:ss') : '',
      duracion_consulta: Number(values.duracion_consulta),
      activo: values.activo ? 1 : 0,
    };
    try {
      if (editData) {
        await actualizarDisponibilidadMedico(editData.idDisponibilidad, payload);
        message.success('Disponibilidad actualizada');
      } else {
        await crearDisponibilidadMedico(payload);
        message.success('Disponibilidad creada');
      }
      setModalVisible(false);
      setDiaPreseleccionado(null); // Limpiar día preseleccionado
      if (personalMedicoId) fetchDisponibilidad(personalMedicoId);
    } catch {
      message.error('Error al guardar');
    }
    setLoading(false);
  };

  const columns = [
    { title: 'Día', dataIndex: 'dia_semana_id', key: 'dia_semana_id', render: v => diasSemana.find(d => d.value === v)?.label },
    { title: 'Hora inicio', dataIndex: 'hora_inicio', key: 'hora_inicio' },
    { title: 'Hora fin', dataIndex: 'hora_fin', key: 'hora_fin' },
    { title: 'Duración', dataIndex: 'duracion_consulta', key: 'duracion_consulta', render: v => `${v} min` },
    { title: 'Activo', dataIndex: 'activo', key: 'activo', render: v => v ? 'Sí' : 'No' },
    { title: 'Acciones', key: 'acciones', render: (_, r) => (
      <>
        <Button type="link" onClick={() => handleEdit(r)}>Editar</Button>
        <Button type="link" danger onClick={() => handleDelete(r.idDisponibilidad)}>Eliminar</Button>
      </>
    ) },
  ];

  // Loading state
  if (loading) {
    return (
      <Layout>
        <Header className="header-container">
          <Title level={3} className="page-title">
            <ClockCircleOutlined className="page-icon" />
            Configuración de Horarios
          </Title>
        </Header>
        <Content className="content-container">
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Spin size="large" />
            <p style={{ marginTop: '1rem', fontSize: '16px' }}>Cargando configuración...</p>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header className="header-container">
        <div className="header-left">
          <Button 
            icon={<ArrowLeftOutlined />} 
            type="link" 
            onClick={() => navigate('/dashboard')}
            className="back-button"
          >
            Volver
          </Button>
          <Title level={3} className="page-title">
            <ClockCircleOutlined className="page-icon" />
            Configuración de Horarios
          </Title>
        </div>
        {userInfo && (
          <div className="header-right">
            <Space>
              <Avatar 
                icon={<UserOutlined />} 
                className="user-avatar"
              />
              <Text className="user-name">
                Dr. {userInfo.persona?.nombres} {userInfo.persona?.apellidos}
              </Text>
            </Space>
          </div>
        )}
      </Header>
      
      <Content className="content-container">
        {isDoctor === false ? (
          <Card className="error-card">
            <Result
              status="warning"
              title="Acceso Restringido"
              subTitle="Esta función está disponible únicamente para personal médico. Los pacientes no pueden acceder a la configuración de horarios."
              extra={
                <Button type="primary" onClick={() => navigate('/dashboard')}>
                  Volver al Dashboard
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="schedule-config-container">
            {/* Header Section */}
            <Card className="header-card">
              <div className="header-card-content">
                <div className="header-info">
                  <Title level={4}>
                    <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    Gestión de Disponibilidad Médica
                  </Title>
                  <Text type="secondary">
                    Configure sus horarios de atención para que los pacientes puedan programar citas
                  </Text>
                </div>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => handleAdd()}
                  size="large"
                  className="add-button"
                >
                  Agregar Horario
                </Button>
              </div>
            </Card>

            {/* Schedule Cards Grid */}
            <div className="schedule-grid">
              {diasSemana.map(dia => {
                const horariosDia = disponibilidad.filter(
                  d => Number(d.dia_semana_id) === dia.value
                );
                
                return (
                  <Card
                    key={dia.value}
                    title={
                      <Space>
                        <CalendarOutlined style={{ color: '#1890ff' }} />
                        {dia.label}
                      </Space>
                    }
                    className="day-card"
                    extra={
                      <Tag color={horariosDia.length > 0 ? 'green' : 'default'}>
                        {horariosDia.length} horario{horariosDia.length !== 1 ? 's' : ''}
                      </Tag>
                    }
                  >
                    {horariosDia.length > 0 ? (
                      <div className="schedule-list">
                        {horariosDia.map(horario => (
                          <Card
                            key={horario.idDisponibilidad}
                            size="small"
                            className="schedule-item"
                            actions={[
                              <EditOutlined 
                                key="edit" 
                                onClick={() => handleEdit(horario)}
                                className="action-icon"
                              />,
                              <Popconfirm
                                key="delete"
                                title="¿Eliminar este horario?"
                                onConfirm={() => handleDelete(horario.idDisponibilidad)}
                                okText="Sí"
                                cancelText="No"
                              >
                                <DeleteOutlined className="action-icon delete-icon" />
                              </Popconfirm>
                            ]}
                          >
                            <div className="schedule-details">
                              <div className="time-range">
                                <ClockCircleOutlined style={{ marginRight: 4 }} />
                                <Text strong>
                                  {horario.hora_inicio} - {horario.hora_fin}
                                </Text>
                              </div>
                              <div className="duration">
                                <Text type="secondary">
                                  Duración: {horario.duracion_consulta} min
                                </Text>
                              </div>
                              <div className="status">
                                <Tag color={horario.activo ? 'green' : 'red'}>
                                  {horario.activo ? 'Activo' : 'Inactivo'}
                                </Tag>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-day">
                        <Text type="secondary">
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          Sin horarios configurados
                        </Text>
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => handleAdd(dia.value)}
                          icon={<PlusOutlined />}
                        >
                          Agregar horario
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal for Add/Edit */}
        <Modal
          open={modalVisible}
          title={
            <Space>
              <ClockCircleOutlined />
              {editData 
                ? 'Editar Disponibilidad' 
                : diaPreseleccionado 
                  ? `Agregar Disponibilidad - ${diasSemana.find(d => d.value === diaPreseleccionado)?.label || ''}`
                  : 'Agregar Disponibilidad'
              }
            </Space>
          }
          onCancel={() => {
            setModalVisible(false);
            setDiaPreseleccionado(null);
          }}
          footer={null}
          width={600}
          className="schedule-modal"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="dia_semana_id" 
                  label="Día de la semana" 
                  rules={[{ required: true, type: 'number', message: 'Seleccione un día' }]}
                >
                  <Select 
                    options={diasSemana} 
                    placeholder="Seleccione un día" 
                    allowClear 
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="duracion_consulta" 
                  label="Duración de consulta (min)" 
                  rules={[{ required: true, type: 'number', message: 'Ingrese duración' }]}
                >
                  <Select
                    placeholder="Duración"
                    size="large"
                    options={[
                      { value: 15, label: '15 minutos' },
                      { value: 30, label: '30 minutos' },
                      { value: 45, label: '45 minutos' },
                      { value: 60, label: '60 minutos' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="hora_inicio" 
                  label="Hora inicio" 
                  rules={[{ required: true, message: 'Seleccione la hora de inicio' }]}
                >
                  <TimePicker 
                    format="HH:mm" 
                    placeholder="Seleccione hora" 
                    size="large"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="hora_fin" 
                  label="Hora fin" 
                  rules={[{ required: true, message: 'Seleccione la hora de fin' }]}
                >
                  <TimePicker 
                    format="HH:mm" 
                    placeholder="Seleccione hora" 
                    size="large"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item name="activo" valuePropName="checked">
              <Checkbox size="large">Horario activo</Checkbox>
            </Form.Item>

            <Divider />

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button 
                  onClick={() => setModalVisible(false)}
                  size="large"
                >
                  Cancelar
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size="large"
                >
                  {editData ? 'Actualizar' : 'Crear'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
