import { useEffect, useState } from 'react';
import { List, Button, Typography, Spin, Empty, Card, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import archivoService from '../services/archivoService';
import consultaDetalleService from '../services/consultaDetalleService';

const { Text, Title } = Typography;

function RecetasPaciente({ pacienteId }) {
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [detallesConsulta, setDetallesConsulta] = useState({});
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  useEffect(() => {
    async function cargarRecetas() {
      if (!pacienteId) return;
      
      setLoading(true);
      try {
        const recetasData = await archivoService.obtenerRecetasPorPacienteId(pacienteId);
        setRecetas(recetasData);
        
        // Obtener IDs únicos de consultas
        const consultaIds = [...new Set(recetasData.map(r => r.consulta_id).filter(Boolean))];
        
        if (consultaIds.length > 0) {
          setLoadingDetalles(true);
          try {
            const detalles = await consultaDetalleService.obtenerDetallesConsultas(consultaIds);
            setDetallesConsulta(detalles);
          } catch (error) {
            console.warn('Error cargando detalles de consultas:', error);
          } finally {
            setLoadingDetalles(false);
          }
        }
      } catch (error) {
        console.error('Error cargando recetas:', error);
        setRecetas([]);
      } finally {
        setLoading(false);
      }
    }
    
    cargarRecetas();
  }, [pacienteId]);

  const handleDescargar = async (receta) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(receta.idArchivo));
      await archivoService.descargarReceta(receta.idArchivo, receta.nombre_archivo);
      message.success('Archivo descargado correctamente');
    } catch (error) {
      console.error('Error descargando:', error);
      message.error(error.message || 'Error al descargar el archivo');
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(receta.idArchivo);
        return newSet;
      });
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '2rem auto' }} />;
  if (!recetas.length) return <Empty description="No hay recetas disponibles" style={{ marginTop: 40 }} />;

  return (
    <Card title={<Title level={4}>Mis Recetas Médicas</Title>} style={{ maxWidth: 800, margin: '2rem auto' }}>
      <List
        dataSource={recetas}
        renderItem={receta => {
          const consultaDetalle = detallesConsulta[receta.consulta_id];
          
          return (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  size="small"
                  icon={<DownloadOutlined />}
                  loading={downloadingIds.has(receta.idArchivo)}
                  onClick={() => handleDescargar(receta)}
                  key="descargar"
                >
                  Descargar
                </Button>
              ]}
            >
              <div style={{ width: '100%' }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{receta.nombre_archivo}</Text>
                  {receta.fecha_creacion && (
                    <Text type="secondary" style={{ marginLeft: 16 }}>
                      Fecha: {new Date(receta.fecha_creacion).toLocaleDateString()}
                    </Text>
                  )}
                </div>
                
                {loadingDetalles && (
                  <Spin size="small" style={{ marginRight: 8 }} />
                )}
                
                {consultaDetalle && (
                  <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginTop: 8 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Información de la Consulta:</Text>
                    
                    {consultaDetalle.consulta && (
                      <div style={{ marginBottom: 8 }}>
                        {consultaDetalle.consulta.diagnostico_principal && (
                          <div><Text>• Diagnóstico: {consultaDetalle.consulta.diagnostico_principal}</Text></div>
                        )}
                        {consultaDetalle.consulta.tratamiento && (
                          <div><Text>• Tratamiento: {consultaDetalle.consulta.tratamiento}</Text></div>
                        )}
                        {consultaDetalle.consulta.observaciones && (
                          <div><Text>• Observaciones: {consultaDetalle.consulta.observaciones}</Text></div>
                        )}
                      </div>
                    )}
                    
                    {consultaDetalle.signosVitales && (
                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Signos Vitales:</Text>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, fontSize: 12 }}>
                          {consultaDetalle.signosVitales.presion_sistolica && consultaDetalle.signosVitales.presion_diastolica && (
                            <Text>PA: {consultaDetalle.signosVitales.presion_sistolica}/{consultaDetalle.signosVitales.presion_diastolica} mmHg</Text>
                          )}
                          {consultaDetalle.signosVitales.frecuencia_cardiaca && (
                            <Text>FC: {consultaDetalle.signosVitales.frecuencia_cardiaca} lpm</Text>
                          )}
                          {consultaDetalle.signosVitales.temperatura && (
                            <Text>T: {consultaDetalle.signosVitales.temperatura}°C</Text>
                          )}
                          {consultaDetalle.signosVitales.peso && (
                            <Text>Peso: {consultaDetalle.signosVitales.peso} kg</Text>
                          )}
                          {consultaDetalle.signosVitales.altura && (
                            <Text>Altura: {consultaDetalle.signosVitales.altura} cm</Text>
                          )}
                          {consultaDetalle.signosVitales.oximetria && (
                            <Text>SpO2: {consultaDetalle.signosVitales.oximetria}%</Text>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {!consultaDetalle.consulta && !consultaDetalle.signosVitales && (
                      <Text type="secondary">No hay información adicional de la consulta</Text>
                    )}
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

export default RecetasPaciente;
