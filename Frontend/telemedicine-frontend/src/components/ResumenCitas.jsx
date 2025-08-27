import { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import {
  Card,
  List,
  Typography,
  Button,
  Space,
  Tag,
  Avatar,
  Spin,
  Empty
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import citaService from '../services/citaService';
import dayjs from 'dayjs';

const { Text } = Typography;

// Función utilitaria para combinar fecha y hora
const combinarFechaHora = (fecha, horaInicio) => {
  return `${fecha} ${horaInicio}:00`;
};

// Funciones utilitarias para formatear fechas
const formatearFecha = (fecha) => {
  return dayjs(fecha).format('DD/MM/YYYY');
};

const formatearHora = (horaInicio) => {
  return horaInicio.substring(0, 5); // HH:MM
};

function ResumenCitas({ userRole = 'patient', userId = 1 }) {
  const [preCheckinVisible, setPreCheckinVisible] = useState(false);
  const [preCheckinCita, setPreCheckinCita] = useState(null);
  const [preCheckinLoading, setPreCheckinLoading] = useState(false);
  const [form] = Form.useForm();
  // Guardar pre-checkin en backend
  const guardarPreCheckin = async (values) => {
    setPreCheckinLoading(true);
    try {
      await citaService.actualizarCita(preCheckinCita.idCita, {
        motivo_consulta: values.motivo_consulta,
        sintomas: values.sintomas,
        notas_paciente: values.notas_paciente
      });
      message.success('Pre-check-in guardado correctamente');
      setPreCheckinVisible(false);
      setPreCheckinCita(null);
      form.resetFields();
    } catch (error) {
      message.error('Error guardando pre-check-in');
    } finally {
      setPreCheckinLoading(false);
    }
  };
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId && userRole) {
      cargarCitasProximas();
    }
  }, [userId, userRole]);

  const cargarCitasProximas = async () => {
    if (!userId || !userRole) return;
    setLoading(true);
    try {
      let citasData = [];
      if (userRole === 'doctor') {
        const hoy = dayjs().format('YYYY-MM-DD');
        citasData = await citaService.obtenerCitasMedico(userId, { fecha: hoy });
      } else {
        citasData = await citaService.obtenerCitasPaciente(userId);
      }
      // Filtrar solo las próximas citas (hoy o futuras) y que no estén canceladas
      let citasProximas = citasData
        .filter(cita => {
          const fechaCita = dayjs(combinarFechaHora(cita.fecha, cita.hora_inicio));
          return fechaCita.isAfter(dayjs().subtract(1, 'day')) && 
                 ![4, 5, 6].includes(cita.estado_cita_id);
        });
      // Priorizar las que tengan videollamada
      citasProximas = citasProximas.sort((a, b) => {
        if (a.room_id && !b.room_id) return -1;
        if (!a.room_id && b.room_id) return 1;
        const fechaA = new Date(combinarFechaHora(a.fecha, a.hora_inicio));
        const fechaB = new Date(combinarFechaHora(b.fecha, b.hora_inicio));
        return fechaA - fechaB;
      });
      // Limitar a las próximas 3
      citasProximas = citasProximas.slice(0, 3);
      setCitas(citasProximas);
    } catch (error) {
      console.error('Error cargando citas:', error);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  const obtenerColorEstado = (estadoId) => {
    const colores = {
      1: 'blue',     // Programada
      2: 'green',    // Confirmada
      3: 'orange',   // En Curso
    };
    return colores[estadoId] || 'default';
  };

  const formatearHora = (fechaHora) => {
    return dayjs(fechaHora).format('HH:mm');
  };

  const formatearFecha = (fechaHora) => {
    const fecha = dayjs(fechaHora);
    const hoy = dayjs();
    
    if (fecha.isSame(hoy, 'day')) {
      return 'Hoy';
    } else if (fecha.isSame(hoy.add(1, 'day'), 'day')) {
      return 'Mañana';
    } else {
      return fecha.format('DD/MM');
    }
  };

  const verTodasLasCitas = () => {
    navigate('/citas');
  };

  if (loading) {
    return (
      <Card 
        title={`Próximas ${userRole === 'doctor' ? 'Consultas' : 'Citas'}`}
        extra={<Button type="link" onClick={verTodasLasCitas}>Ver todas</Button>}
      >
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={`Próximas ${userRole === 'doctor' ? 'Consultas' : 'Citas'}`}
      extra={<Button type="link" icon={<EyeOutlined />} onClick={verTodasLasCitas}>Ver todas</Button>}
    >
      {citas.length > 0 ? (
        <List
          dataSource={citas}
          renderItem={(cita) => {
            const personaInfo = userRole === 'doctor' 
              ? cita.paciente?.persona 
              : cita.personal_medico?.persona;
            
            const nombrePersona = personaInfo 
              ? `${personaInfo.nombres} ${personaInfo.apellidos}` 
              : 'Sin nombre';

            return (
              <List.Item style={{ padding: '8px 0' }}>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={<UserOutlined />} 
                      style={{ backgroundColor: obtenerColorEstado(cita.estado_cita_id) }}
                    />
                  }
                  title={
                    <Space>
                      <Text strong style={{ fontSize: '14px' }}>{nombrePersona}</Text>
                      <Tag 
                        color={obtenerColorEstado(cita.estado_cita_id)}
                        size="small"
                      >
                        {cita.estado_citum?.nombre}
                      </Tag>
                    </Space>
                  }
                  description={
                    <>
                      <Space size="large">
                        <Space size="small">
                          <CalendarOutlined style={{ fontSize: '12px' }} />
                          <Text style={{ fontSize: '12px' }}>
                            {formatearFecha(combinarFechaHora(cita.fecha, cita.hora_inicio))}
                          </Text>
                        </Space>
                        <Space size="small">
                          <ClockCircleOutlined style={{ fontSize: '12px' }} />
                          <Text style={{ fontSize: '12px' }}>
                            {formatearHora(combinarFechaHora(cita.fecha, cita.hora_inicio))}
                          </Text>
                        </Space>
                        {/* Botón para videollamada si aplica */}
                        {cita.room_id && (
                          <Button
                            type="primary"
                            onClick={() => navigate(`/videollamada/${cita.room_id}`, {
                              state: {
                                userId,
                                userRole
                              }
                            })}
                          >
                            Unirse a videollamada
                          </Button>
                        )}
                        {/* Botón Pre-check-in solo para paciente y si la cita es futura */}
                        {userRole === 'patient' && dayjs(combinarFechaHora(cita.fecha, cita.hora_inicio)).isAfter(dayjs()) && (
                          <Button
                            style={{ marginLeft: 8 }}
                            onClick={() => {
                              setPreCheckinVisible(true);
                              setPreCheckinCita(cita);
                              form.setFieldsValue({
                                motivo_consulta: cita.motivo_consulta || '',
                                sintomas: cita.sintomas || '',
                                notas_paciente: cita.notas_paciente || ''
                              });
                            }}
                          >
                            Pre-check-in
                          </Button>
                        )}
                      </Space>
                      {/* Bloque informativo para doctor si existen datos de pre-check-in */}
                      {userRole === 'doctor' && (
                        (cita.motivo_consulta || cita.sintomas || cita.notas_paciente) && (
                          <div style={{ marginTop: 12, background: '#f6ffed', padding: 10, borderRadius: 6 }}>
                            <strong>Pre-check-in del paciente:</strong>
                            {cita.motivo_consulta && <div><b>Motivo:</b> {cita.motivo_consulta}</div>}
                            {cita.sintomas && <div><b>Síntomas:</b> {cita.sintomas}</div>}
                            {cita.notas_paciente && <div><b>Notas:</b> {cita.notas_paciente}</div>}
                          </div>
                        )
                      )}
                    </>
                  }
                />
              </List.Item>
            );
      {/* Modal de Pre-check-in */}
      <Modal
        title="Pre-check-in de cita"
        open={preCheckinVisible}
        onCancel={() => { setPreCheckinVisible(false); setPreCheckinCita(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={preCheckinLoading}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={guardarPreCheckin}
        >
          <Form.Item label="Motivo de consulta" name="motivo_consulta" rules={[{ required: true, message: 'Ingrese el motivo' }]}> 
            <Input.TextArea rows={2} placeholder="Motivo de consulta" />
          </Form.Item>
          <Form.Item label="Síntomas" name="sintomas"> 
            <Input.TextArea rows={2} placeholder="Síntomas" />
          </Form.Item>
          <Form.Item label="Notas adicionales" name="notas_paciente"> 
            <Input.TextArea rows={2} placeholder="Notas adicionales" />
          </Form.Item>
        </Form>
        {/* Mostrar datos existentes si ya hay pre-check-in guardado */}
        {preCheckinCita && (
          <div style={{ marginTop: 16, background: '#f6ffed', padding: 12, borderRadius: 6 }}>
            <strong>Datos guardados:</strong>
            <div><b>Motivo:</b> {preCheckinCita.motivo_consulta || <i>No registrado</i>}</div>
            <div><b>Síntomas:</b> {preCheckinCita.sintomas || <i>No registrado</i>}</div>
            <div><b>Notas:</b> {preCheckinCita.notas_paciente || <i>No registrado</i>}</div>
          </div>
        )}
      </Modal>
          }}
        />
      ) : (
        <Empty
          description={`No tienes ${userRole === 'doctor' ? 'consultas' : 'citas'} programadas`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '20px 0' }}
        >
          {userRole === 'patient' && (
            <Button type="primary" onClick={verTodasLasCitas}>
              Programar Cita
            </Button>
          )}
        </Empty>
      )}
      {/* Modal de Pre-check-in */}
      <Modal
        title="Pre-check-in de cita"
        open={preCheckinVisible}
        onCancel={() => { setPreCheckinVisible(false); setPreCheckinCita(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={preCheckinLoading}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={guardarPreCheckin}
        >
          <Form.Item label="Motivo de consulta" name="motivo_consulta" rules={[{ required: true, message: 'Ingrese el motivo' }]}> 
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Síntomas" name="sintomas"> 
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Notas adicionales" name="notas_paciente"> 
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default ResumenCitas;
