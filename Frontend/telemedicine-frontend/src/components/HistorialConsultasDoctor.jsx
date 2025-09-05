import { useEffect, useState } from 'react';
import { List, Button, Typography, Spin, Empty, Card, message, Tag, Descriptions, Select, Row, Col } from 'antd';
import { DownloadOutlined, CalendarOutlined, UserOutlined, MedicineBoxOutlined, FileTextOutlined, FilterOutlined } from '@ant-design/icons';
import citaService from '../services/citaService';
import archivoService from '../services/archivoService';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

function HistorialConsultasDoctor({ personalMedicoId }) {
  const [historialConsultas, setHistorialConsultas] = useState([]);
  const [historialCompleto, setHistorialCompleto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipoCita, setFiltroTipoCita] = useState('todos');

  useEffect(() => {
    async function cargarHistorialConsultas() {
      if (!personalMedicoId) return;
      
      setLoading(true);
      try {
        const historial = await citaService.obtenerHistorialConsultasDoctor(personalMedicoId);
        setHistorialCompleto(historial);
        setHistorialConsultas(historial);
      } catch (error) {
        console.error('Error cargando historial de consultas del doctor:', error);
        message.error('Error al cargar el historial de consultas');
        setHistorialCompleto([]);
        setHistorialConsultas([]);
      } finally {
        setLoading(false);
      }
    }
    
    cargarHistorialConsultas();
  }, [personalMedicoId]);

  // Efecto para filtrar cuando cambie el filtro
  useEffect(() => {
    let consultasFiltradas = historialCompleto;

    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      consultasFiltradas = consultasFiltradas.filter(consulta => 
        consulta.estado_citum?.nombre?.toLowerCase() === filtroEstado.toLowerCase()
      );
    }

    // Filtrar por tipo de cita
    if (filtroTipoCita !== 'todos') {
      consultasFiltradas = consultasFiltradas.filter(consulta => 
        consulta.tipo_citum?.nombre?.toLowerCase().includes(filtroTipoCita.toLowerCase())
      );
    }

    setHistorialConsultas(consultasFiltradas);
  }, [filtroEstado, filtroTipoCita, historialCompleto]);

  const handleDescargar = async (receta) => {
    try {
      const recetaId = receta.idArchivo;
      setDownloadingIds(prev => new Set([...prev, recetaId]));
      
      await archivoService.descargarReceta(recetaId, receta.nombre_archivo);
      message.success('Receta descargada correctamente');
    } catch (error) {
      console.error('Error descargando receta:', error);
      message.error('Error al descargar la receta: ' + error.message);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(receta.idArchivo);
        return newSet;
      });
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Programada': 'blue',      // #007bff
      'Confirmada': 'green',     // #28a745
      'En Curso': 'gold',        // #ffc107
      'Cancelada': 'red',        // #dc3545
      'No Asistió': 'default',   // #6c757d
      'Completada': 'cyan'       // #20c997
    };
    return colores[estado] || 'default';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spin size="large" />
        <p style={{ marginTop: '1rem' }}>Cargando historial de consultas...</p>
      </div>
    );
  }

  if (!historialConsultas || historialConsultas.length === 0) {
    return (
      <Card>
        <Empty 
          description="No tienes consultas registradas aún"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card title={
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileTextOutlined />
        <span>Mis Consultas Realizadas ({historialConsultas.length})</span>
        {(filtroEstado !== 'todos' || filtroTipoCita !== 'todos') && (
          <Tag color="blue" style={{ marginLeft: '8px' }}>
            Filtros activos
          </Tag>
        )}
      </div>
    }>
      {/* Filtros */}
      <Row style={{ marginBottom: '16px' }} gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilterOutlined />
            <Select
              placeholder="Filtrar por estado"
              value={filtroEstado}
              onChange={setFiltroEstado}
              style={{ width: '100%' }}
              options={[
                { value: 'todos', label: 'Todos los estados' },
                { value: 'en curso', label: '🟡 En Curso' },
                { value: 'confirmada', label: '🟢 Confirmada' },
                { value: 'programada', label: '🔵 Programada' },
                { value: 'completada', label: '✅ Completada' },
                { value: 'cancelada', label: '❌ Cancelada' },
                { value: 'no asistió', label: '⚫ No Asistió' }
              ]}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Select
              placeholder="Filtrar por tipo"
              value={filtroTipoCita}
              onChange={setFiltroTipoCita}
              style={{ width: '100%' }}
              options={[
                { value: 'todos', label: 'Todos los tipos' },
                { value: 'emergencia', label: '🚨 Emergencia' },
                { value: 'telemedicina', label: '💻 Telemedicina' },
                { value: 'consulta general', label: '🩺 Consulta General' },
                { value: 'consulta especialidad', label: '👨‍⚕️ Consulta Especialidad' },
                { value: 'control', label: '📋 Control' },
                { value: 'seguimiento', label: '🔄 Seguimiento' },
                { value: 'psicologia', label: '🧠 Psicología' },
                { value: 'nutricion', label: '🥗 Nutrición' }
              ]}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#666',
            fontSize: '14px'
          }}>
            <span>Total: {historialCompleto.length} | Mostrando: {historialConsultas.length}</span>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Button 
            onClick={() => {
              setFiltroEstado('todos');
              setFiltroTipoCita('todos');
            }}
            style={{ width: '100%' }}
          >
            Limpiar Filtros
          </Button>
        </Col>
      </Row>
      
      <List
        dataSource={historialConsultas}
        renderItem={(item) => {
          const { consulta, recetas } = item;
          
          return (
            <List.Item style={{ padding: '16px 0' }}>
              <div style={{ width: '100%' }}>
                {/* Header de la cita */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                      <CalendarOutlined /> Cita #{item.numero_cita}
                    </Title>
                    <Text type="secondary">
                      {dayjs(item.fecha).format('DD/MM/YYYY')} - {item.hora_inicio}
                    </Text>
                  </div>
                  <Tag color={getEstadoColor(item.estado_citum?.nombre)}>
                    {item.estado_citum?.nombre || 'Sin Estado'}
                  </Tag>
                </div>

                {/* Información del paciente */}
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>
                    <UserOutlined /> Paciente: {item.paciente?.persona?.nombres} {item.paciente?.persona?.apellidos}
                  </Text>
                  <br />
                  <Text type="secondary">
                    {item.tipo_citum?.nombre} - {item.motivo_consulta && `Motivo: ${item.motivo_consulta}`}
                  </Text>
                </div>

                {/* Información de la consulta */}
                {consulta && (
                  <Card 
                    size="small" 
                    style={{ marginBottom: '12px', backgroundColor: '#f6ffed' }}
                    title="Información de la Consulta"
                  >
                    <Descriptions size="small" column={1}>
                      {consulta.diagnostico_principal && (
                        <Descriptions.Item label="Diagnóstico Principal">
                          {consulta.diagnostico_principal}
                        </Descriptions.Item>
                      )}
                      {consulta.diagnosticos_secundarios && (
                        <Descriptions.Item label="Diagnósticos Secundarios">
                          {consulta.diagnosticos_secundarios}
                        </Descriptions.Item>
                      )}
                      {consulta.tratamiento && (
                        <Descriptions.Item label="Tratamiento">
                          {consulta.tratamiento}
                        </Descriptions.Item>
                      )}
                      {consulta.observaciones && (
                        <Descriptions.Item label="Observaciones">
                          {consulta.observaciones}
                        </Descriptions.Item>
                      )}
                      {consulta.receta_medica && (
                        <Descriptions.Item label="Receta Médica">
                          {consulta.receta_medica}
                        </Descriptions.Item>
                      )}
                      {consulta.examenes_solicitados && (
                        <Descriptions.Item label="Exámenes Solicitados">
                          {consulta.examenes_solicitados}
                        </Descriptions.Item>
                      )}
                      {consulta.proxima_cita_recomendada && (
                        <Descriptions.Item label="Próxima Cita Recomendada">
                          {dayjs(consulta.proxima_cita_recomendada).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                      )}
                      {consulta.duracion_minutos && (
                        <Descriptions.Item label="Duración">
                          {consulta.duracion_minutos} minutos
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                )}

                {/* Recetas disponibles */}
                {recetas && recetas.length > 0 && (
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                      <MedicineBoxOutlined /> Recetas generadas:
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {recetas.map((receta) => (
                        <Button
                          key={receta.idArchivo}
                          type="primary"
                          size="small"
                          icon={<DownloadOutlined />}
                          loading={downloadingIds.has(receta.idArchivo)}
                          onClick={() => handleDescargar(receta)}
                          style={{ marginBottom: '4px' }}
                        >
                          {receta.nombre_archivo}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Si no hay consulta registrada pero la cita existe */}
                {!consulta && item.estado_citum?.nombre !== 'Cancelada' && (
                  <Card size="small" style={{ backgroundColor: '#fff7e6', border: '1px solid #ffd591' }}>
                    <Text type="secondary">
                      {item.estado_citum?.nombre === 'Completada' 
                        ? 'Consulta completada pero sin información detallada registrada.'
                        : 'Cita programada - aún no se ha realizado la consulta.'
                      }
                    </Text>
                  </Card>
                )}

                {/* Si la cita fue cancelada */}
                {item.estado_citum?.nombre === 'Cancelada' && (
                  <Card size="small" style={{ backgroundColor: '#fff1f0', border: '1px solid #ffccc7' }}>
                    <Text type="secondary">
                      Cita cancelada.
                      {item.motivo_cancelacion && ` Motivo: ${item.motivo_cancelacion}`}
                    </Text>
                  </Card>
                )}

                {/* Si no hay recetas en consulta completada */}
                {(!recetas || recetas.length === 0) && consulta && (
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary">
                      <MedicineBoxOutlined /> No se generaron recetas para esta consulta.
                    </Text>
                  </div>
                )}
              </div>
            </List.Item>
          );
        }}
      />
    </Card>
  );
}

export default HistorialConsultasDoctor;
