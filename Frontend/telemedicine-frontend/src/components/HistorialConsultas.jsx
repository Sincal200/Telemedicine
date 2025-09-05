import { useEffect, useState } from 'react';
import { List, Button, Typography, Spin, Empty, Card, message, Tag, Descriptions } from 'antd';
import { DownloadOutlined, CalendarOutlined, UserOutlined, MedicineBoxOutlined, FileTextOutlined } from '@ant-design/icons';
import citaService from '../services/citaService';
import archivoService from '../services/archivoService';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

function HistorialConsultas({ pacienteId }) {
  const [historialConsultas, setHistorialConsultas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  useEffect(() => {
    async function cargarHistorialConsultas() {
      if (!pacienteId) return;
      
      setLoading(true);
      try {
        const historial = await citaService.obtenerHistorialConsultas(pacienteId);
        setHistorialConsultas(historial);
      } catch (error) {
        console.error('Error cargando historial de consultas:', error);
        message.error('Error al cargar el historial de consultas');
        setHistorialConsultas([]);
      } finally {
        setLoading(false);
      }
    }
    
    cargarHistorialConsultas();
  }, [pacienteId]);

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
          description="No tienes consultas completadas aún"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card title={
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileTextOutlined />
        <span>Historial de Consultas ({historialConsultas.length})</span>
      </div>
    }>
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
                  <Tag color="green">
                    {item.estado_citum?.nombre || 'Completada'}
                  </Tag>
                </div>

                {/* Información del médico */}
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>
                    <UserOutlined /> Dr. {item.personal_medico?.persona?.nombre} {item.personal_medico?.persona?.apellido}
                  </Text>
                  <br />
                  <Text type="secondary">
                    {item.personal_medico?.especialidad?.nombre} - {item.tipo_citum?.nombre}
                  </Text>
                </div>

                {/* Información de la consulta */}
                {consulta && (
                  <Card 
                    size="small" 
                    style={{ marginBottom: '12px', backgroundColor: '#fafafa' }}
                    title="Información de la Consulta"
                  >
                    <Descriptions size="small" column={1}>
                      {consulta.diagnostico_principal && (
                        <Descriptions.Item label="Diagnóstico Principal">
                          {consulta.diagnostico_principal}
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
                    </Descriptions>
                  </Card>
                )}

                {/* Recetas disponibles */}
                {recetas && recetas.length > 0 && (
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                      <MedicineBoxOutlined /> Recetas disponibles:
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

                {/* Si no hay consulta registrada */}
                {!consulta && (
                  <Card size="small" style={{ backgroundColor: '#fff7e6', border: '1px solid #ffd591' }}>
                    <Text type="secondary">
                      No se encontró información detallada de la consulta.
                    </Text>
                  </Card>
                )}

                {/* Si no hay recetas */}
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

export default HistorialConsultas;
