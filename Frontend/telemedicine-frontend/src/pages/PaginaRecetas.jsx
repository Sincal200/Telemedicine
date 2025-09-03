import { useEffect, useState } from 'react';
import RecetasPaciente from '../components/RecetasPaciente';
import userProfileService from '../services/userProfileService';
import { Spin, Alert } from 'antd';

function PaginaRecetas() {
  const [pacienteId, setPacienteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Obtener pacienteId usando el servicio de perfil (correcto)
    async function fetchPacienteId() {
      try {
        const id = await userProfileService.obtenerIdPaciente();
        if (!id) throw new Error('No se encontró el paciente asociado a tu usuario.');
        setPacienteId(id);
      } catch (err) {
        setError('No se pudo obtener el paciente.');
      } finally {
        setLoading(false);
      }
    }
    fetchPacienteId();
  }, []);

  if (loading) return <Spin style={{ display: 'block', margin: '2rem auto' }} />;
  if (error) return <Alert type="error" message={error} style={{ margin: '2rem auto', maxWidth: 400 }} />;
  if (!pacienteId) return <Alert type="warning" message="No se encontró el paciente asociado a tu usuario." style={{ margin: '2rem auto', maxWidth: 400 }} />;

  return <RecetasPaciente pacienteId={pacienteId} />;
}

export default PaginaRecetas;
