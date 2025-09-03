import { useEffect, useState } from 'react';
import { List, Button, Typography, Spin, Empty, Card, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import archivoService from '../services/archivoService';

const { Text, Title } = Typography;

function RecetasPaciente({ pacienteId }) {
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  useEffect(() => {
    if (pacienteId) {
      setLoading(true);
      archivoService.obtenerRecetasPorPacienteId(pacienteId)
        .then(setRecetas)
        .catch(() => setRecetas([]))
        .finally(() => setLoading(false));
    }
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
    <Card title={<Title level={4}>Mis Recetas Médicas</Title>} style={{ maxWidth: 600, margin: '2rem auto' }}>
      <List
        dataSource={recetas}
        renderItem={receta => (
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
            <Text>{receta.nombre_archivo}</Text>
          </List.Item>
        )}
      />
    </Card>
  );
}

export default RecetasPaciente;
