import { useState, useEffect } from 'react';
import {
  Card,
  List,
  Avatar,
  Tag,
  Button,
  Space,
  Typography,
  Modal,
  message,
  Spin,
  Empty,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  VideoCameraOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import citaService from '../services/citaService';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

// Función utilitaria para combinar fecha y hora
const combinarFechaHora = (fecha, horaInicio) => {
  return `${fecha} ${horaInicio}:00`;
};

// Función para formatear fecha y hora para mostrar
const formatearFechaHora = (fecha, horaInicio) => {
  const fechaCompleta = combinarFechaHora(fecha, horaInicio);
  const fechaObj = dayjs(fechaCompleta);
  return {
    fecha: fechaObj.format('DD/MM/YYYY'),
    hora: fechaObj.format('HH:mm'),
    fechaCompleta: fechaCompleta
  };
};

function MisCitas({ userRole = 'patient', userId = 1, refreshTrigger = 0 }) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelando, setCancelando] = useState(null);

  useEffect(() => {
    if (userId) {
      cargarCitas();
    }
  }, [refreshTrigger, userId]);

  const cargarCitas = async () => {
    if (!userId) {
      console.log('No hay userId disponible, saltando carga de citas');
      return;
    }

    setLoading(true);
    try {
      let citasData = [];
      
      if (userRole === 'doctor') {
        citasData = await citaService.obtenerCitasMedico(userId);
      } else {
        citasData = await citaService.obtenerCitasPaciente(userId);
      }
      
      // Ordenar por fecha más cercana primero
      citasData.sort((a, b) => {
        const fechaA = new Date(combinarFechaHora(a.fecha, a.hora_inicio));
        const fechaB = new Date(combinarFechaHora(b.fecha, b.hora_inicio));
        return fechaA - fechaB;
      });
      setCitas(citasData);
    } catch (error) {
      message.error('Error cargando citas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelarCita = async (citaId) => {
    setCancelando(citaId);
    try {
      await citaService.cancelarCita(citaId, 'Cancelada por el usuario');
      message.success('Cita cancelada exitosamente');
      cargarCitas(); // Recargar la lista
    } catch (error) {
      message.error('Error cancelando cita: ' + error.message);
    } finally {
      setCancelando(null);
    }
  };

  const obtenerColorEstado = (estadoId) => {
    const colores = {
      1: 'blue',     // Programada
      2: 'green',    // Confirmada
      3: 'orange',   // En Curso
      4: 'red',      // Cancelada
      5: 'default',  // No Asistió
      6: 'cyan'      // Completada
    };
    return colores[estadoId] || 'default';
  };

  const obtenerIconoEstado = (estadoId) => {
    const iconos = {
      1: <ClockCircleOutlined />,      // Programada
      2: <CheckCircleOutlined />,      // Confirmada
      3: <SyncOutlined spin />,        // En Curso
      4: <CloseCircleOutlined />,      // Cancelada
      5: <ExclamationCircleOutlined />,// No Asistió
      6: <CheckCircleOutlined />       // Completada
    };
    return iconos[estadoId] || <ClockCircleOutlined />;
  };

  const puedeIniciarConsulta = (cita) => {
    const fechaCita = dayjs(combinarFechaHora(cita.fecha, cita.hora_inicio));
    const ahora = dayjs();
    const diferencia = fechaCita.diff(ahora, 'minutes');
    
    // Puede iniciar 15 minutos antes de la hora programada
    return diferencia <= 15 && diferencia >= -30 && cita.estado_cita_id === 2;
  };

  const puedeCancelar = (cita) => {
    const fechaCita = dayjs(combinarFechaHora(cita.fecha, cita.hora_inicio));
    const ahora = dayjs();
    
    // Puede cancelar si faltan más de 2 horas y no está cancelada o completada
    return fechaCita.diff(ahora, 'hours') > 2 && 
           ![4, 5, 6].includes(cita.estado_cita_id);
  };

  const formatearFechaHoraCompleta = (fecha, horaInicio) => {
    const fechaCompleta = dayjs(combinarFechaHora(fecha, horaInicio));
    return {
      fecha: fechaCompleta.format('DD/MM/YYYY'),
      hora: fechaCompleta.format('HH:mm'),
      fechaCompleta: fechaCompleta.format('dddd, DD [de] MMMM [de] YYYY [a las] HH:mm')
    };
  };

  const iniciarConsulta = (cita) => {
    // Aquí redirigiríamos a la página de video consulta
    message.info('Iniciando consulta...');
    // navigate(`/video?citaId=${cita.idCita}`);
  };

  const citasProximas = citas.filter(cita => {
    const fechaCita = dayjs(combinarFechaHora(cita.fecha, cita.hora_inicio));
    return fechaCita.isAfter(dayjs()) && ![4, 5, 6].includes(cita.estado_cita_id);
  });

  const citasAnteriores = citas.filter(cita => {
    const fechaCita = dayjs(combinarFechaHora(cita.fecha, cita.hora_inicio));
    return fechaCita.isBefore(dayjs()) || [4, 5, 6].includes(cita.estado_cita_id);
  });

  const renderCita = (cita) => {
    const { fecha, hora, fechaCompleta } = formatearFechaHora(cita.fecha, cita.hora_inicio);
    const personaInfo = userRole === 'doctor' 
      ? cita.paciente?.persona 
      : cita.personal_medico?.persona;
    
    const nombrePersona = personaInfo ? `${personaInfo.nombres} ${personaInfo.apellidos}` : 'Sin nombre';
    const especialidad = cita.personal_medico?.especialidad?.nombre;

    return (
      <List.Item
        key={cita.idCita}
        actions={[
          puedeIniciarConsulta(cita) && (
            <Button
              type="primary"
              icon={<VideoCameraOutlined />}
              onClick={() => iniciarConsulta(cita)}
            >
              Iniciar Consulta
            </Button>
          ),
          puedeCancelar(cita) && (
            <Popconfirm
              title="¿Estás seguro de cancelar esta cita?"
              description="Esta acción no se puede deshacer"
              onConfirm={() => cancelarCita(cita.idCita)}
              okText="Sí, cancelar"
              cancelText="No"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={cancelando === cita.idCita}
              >
                Cancelar
              </Button>
            </Popconfirm>
          )
        ].filter(Boolean)}
      >
        <List.Item.Meta
          avatar={
            <Avatar 
              size="large" 
              icon={<UserOutlined />}
              style={{ backgroundColor: obtenerColorEstado(cita.estado_cita_id) }}
            />
          }
          title={
            <Space direction="vertical" size="small">
              <Space>
                <Text strong>{nombrePersona}</Text>
                <Tag 
                  color={obtenerColorEstado(cita.estado_cita_id)}
                  icon={obtenerIconoEstado(cita.estado_cita_id)}
                >
                  {cita.estado_citum?.nombre || 'Estado desconocido'}
                </Tag>
              </Space>
              
              <Space wrap>
                <Space size="small">
                  <CalendarOutlined />
                  <Text>{fecha}</Text>
                </Space>
                <Space size="small">
                  <ClockCircleOutlined />
                  <Text>{hora}</Text>
                </Space>
                {especialidad && (
                  <Space size="small">
                    <MedicineBoxOutlined />
                    <Text>{especialidad}</Text>
                  </Space>
                )}
              </Space>
            </Space>
          }
          description={
            <Space direction="vertical" size="small">
              <Text type="secondary">
                {cita.tipo_citum?.nombre || 'Tipo de cita desconocido'}
                {cita.tipo_citum?.duracion_minutos && (
                  <Tag size="small" style={{ marginLeft: 8 }}>
                    {cita.tipo_citum.duracion_minutos} min
                  </Tag>
                )}
              </Text>
              
              {cita.motivo_consulta && (
                <Text italic>"{cita.motivo_consulta}"</Text>
              )}
              
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Cita Nº: {cita.numero_cita}
              </Text>
            </Space>
          }
        />
      </List.Item>
    );
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Cargando citas...</Text>
          </div>
        </div>
      </Card>
    );
  }

  // Si no hay userId, mostrar mensaje
  if (!userId) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No se pudo cargar la información del usuario. Por favor, inicia sesión nuevamente."
        />
      </Card>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Próximas Citas */}
      <Card
        title={
          <Space>
            <CalendarOutlined />
            Próximas Citas ({citasProximas.length})
          </Space>
        }
      >
        {citasProximas.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={citasProximas}
            renderItem={renderCita}
          />
        ) : (
          <Empty
            description="No tienes citas programadas"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {/* Citas Anteriores */}
      {citasAnteriores.length > 0 && (
        <Card
          title={
            <Space>
              <ClockCircleOutlined />
              Historial de Citas ({citasAnteriores.length})
            </Space>
          }
        >
          <List
            itemLayout="horizontal"
            dataSource={citasAnteriores.slice(0, 5)} // Mostrar solo las últimas 5
            renderItem={renderCita}
          />
          {citasAnteriores.length > 5 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button type="link">
                Ver todas las citas anteriores ({citasAnteriores.length - 5} más)
              </Button>
            </div>
          )}
        </Card>
      )}
    </Space>
  );
}

export default MisCitas;
