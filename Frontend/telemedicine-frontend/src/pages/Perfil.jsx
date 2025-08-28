import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Spin, DatePicker, Select, Row, Col, Divider } from 'antd';
import dayjs from 'dayjs';
import userProfileService from '../services/userProfileService';
import catalogoDireccionService from '../services/catalogoDireccionService';
import direccionService from '../services/direccionService';
import pacienteService from '../services/pacienteService';

const { Title } = Typography;

const Perfil = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [aldeas, setAldeas] = useState([]);
  const [direccionExtra, setDireccionExtra] = useState({ direccion_completa: '', zona: '', referencia: '' });
  // Estado para datos médicos
  const [formMedico] = Form.useForm();
  const [paciente, setPaciente] = useState(null);
  const [loadingMedico, setLoadingMedico] = useState(false);
  const [savingMedico, setSavingMedico] = useState(false);


  // Cargar departamentos solo al abrir el selector
  const handleDepartamentoDropdown = async (open) => {
    if (open && departamentos.length === 0) {
      try {
        const deps = await catalogoDireccionService.getDepartamentos();
        setDepartamentos(deps);
      } catch (e) { message.error('Error cargando departamentos'); }
    }
  };

  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      try {
        const data = await userProfileService.obtenerPerfilCompleto();
        setPerfil(data);
        // Si ya hay dirección, cargar departamentos automáticamente
        let deps = departamentos;
        if (data.persona?.direccion?.departamento_id && departamentos.length === 0) {
          deps = await catalogoDireccionService.getDepartamentos();
          setDepartamentos(deps);
        }
        // Cargar municipios y aldeas si hay valores
        if (data.persona?.direccion?.departamento_id) {
          const muns = await catalogoDireccionService.getMunicipios(data.persona.direccion.departamento_id);
          setMunicipios(muns);
        }
        if (data.persona?.direccion?.municipio_id) {
          const alds = await catalogoDireccionService.getAldeas(data.persona.direccion.municipio_id);
          setAldeas(alds);
        }
        // Cargar campos extra de dirección si existen
        setDireccionExtra({
          direccion_completa: data.persona?.direccion?.direccion_completa || '',
          zona: data.persona?.direccion?.zona || '',
          referencia: data.persona?.direccion?.referencia || ''
        });
        form.setFieldsValue({
          nombres: data.persona?.nombres || '',
          apellidos: data.persona?.apellidos || '',
          email: data.persona?.email || '',
          telefono: data.persona?.telefono || '',
          telefono_emergencia: data.persona?.telefono_emergencia || '',
          fecha_nacimiento: data.persona?.fecha_nacimiento ? dayjs(data.persona.fecha_nacimiento) : null,
          departamento_id: data.persona?.direccion?.departamento_id || undefined,
          municipio_id: data.persona?.direccion?.municipio_id || undefined,
          aldea_id: data.persona?.direccion?.aldea_id || undefined,
          direccion_completa: data.persona?.direccion?.direccion_completa || '',
          zona: data.persona?.direccion?.zona || '',
          referencia: data.persona?.direccion?.referencia || ''
        });
        // Si es paciente, cargar datos médicos
        if (data.esPaciente && data.idPaciente) {
          setLoadingMedico(true);
          try {
            const pacienteData = await pacienteService.getPaciente(data.idPaciente);
            setPaciente(pacienteData);
              formMedico.setFieldsValue({
                numero_expediente: pacienteData.numero_expediente || '',
                tipo_sangre: pacienteData.tipo_sangre || '',
                alergias: pacienteData.alergias || '',
                enfermedades_cronicas: pacienteData.enfermedades_cronicas || '',
                medicamentos_actuales: pacienteData.medicamentos_actuales || '',
                contacto_emergencia_nombre: pacienteData.contacto_emergencia_nombre || '',
                contacto_emergencia_telefono: pacienteData.contacto_emergencia_telefono || '',
                contacto_emergencia_parentesco: pacienteData.contacto_emergencia_parentesco || '',
              });
          } catch (e) {
            message.error('No se pudo cargar la información médica');
          } finally {
            setLoadingMedico(false);
          }
        }
      } catch (error) {
        message.error('No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
    // eslint-disable-next-line
  }, [form, formMedico]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      let direccionId = perfil.persona?.direccion?.idDireccion || null;
      // Buscar coincidencia exacta en la lista de aldeas cargadas
      if (
        values.departamento_id &&
        values.municipio_id &&
        (values.aldea_id || values.aldea_id === null)
      ) {
        const aldea = aldeas.find(a => a.idAldea === values.aldea_id);
        if (aldea && aldea.idDireccion) {
          direccionId = aldea.idDireccion;
        }
        if (!direccionId) {
          const municipio = municipios.find(m => m.idMunicipio === values.municipio_id);
          if (municipio && municipio.idDireccion) {
            direccionId = municipio.idDireccion;
          }
        }
        if (!direccionId) {
          const departamento = departamentos.find(d => d.idDepartamento === values.departamento_id);
          if (departamento && departamento.idDireccion) {
            direccionId = departamento.idDireccion;
          }
        }
        // Si no existe, crear la dirección
        if (!direccionId) {
          const nuevaDireccion = await direccionService.crearDireccion({
            departamento_id: values.departamento_id,
            municipio_id: values.municipio_id,
            aldea_id: values.aldea_id || null,
            direccion_completa: values.direccion_completa || '',
            zona: values.zona || '',
            referencia: values.referencia || ''
          });
          direccionId = nuevaDireccion.idDireccion;
        } else {
          // Si ya existe, actualizar los campos extra de dirección
          await direccionService.actualizarDireccion(direccionId, {
            direccion_completa: values.direccion_completa || '',
            zona: values.zona || '',
            referencia: values.referencia || ''
          });
        }
      }
      // Construir el payload solo con los campos editables
      const payload = {
        telefono: values.telefono,
        telefono_emergencia: values.telefono_emergencia,
        fecha_nacimiento: values.fecha_nacimiento ? values.fecha_nacimiento.format('YYYY-MM-DD') : null,
        direccion_id: direccionId
      };
      await userProfileService.actualizarPersona(perfil.persona.idPersona, payload);
      message.success('Perfil actualizado correctamente');
    } catch (error) {
      message.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleDepartamentoChange = async (departamento_id) => {
    form.setFieldsValue({ municipio_id: undefined, aldea_id: undefined });
    setAldeas([]);
    try {
      const muns = await catalogoDireccionService.getMunicipios(departamento_id);
      setMunicipios(muns);
    } catch {
      setMunicipios([]);
    }
  };
  const handleMunicipioChange = async (municipio_id) => {
    form.setFieldsValue({ aldea_id: undefined });
    try {
      const alds = await catalogoDireccionService.getAldeas(municipio_id);
      setAldeas(alds);
    } catch {
      setAldeas([]);
    }
  };

  if (loading) return <Spin tip="Cargando perfil..." />;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', marginTop: 32, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 350, maxWidth: 500 }}>
        <Card>
          <Title level={3}>Información Personal</Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={perfil}
          >
            {/* ...existing code... */}
            <Form.Item label="Nombres" name="nombres">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Apellidos" name="apellidos">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Correo electrónico" name="email">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Teléfono" name="telefono" rules={[{ required: true, message: 'Ingrese su teléfono' }]}> 
              <Input type="tel" maxLength={20} />
            </Form.Item>
            <Form.Item label="Teléfono de emergencia" name="telefono_emergencia" rules={[{ required: true, message: 'Ingrese un teléfono de emergencia' }]}> 
              <Input type="tel" maxLength={20} />
            </Form.Item>
            <Form.Item label="Fecha de nacimiento" name="fecha_nacimiento" rules={[{ required: true, message: 'Seleccione su fecha de nacimiento' }]}> 
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" disabledDate={current => current && current > dayjs().endOf('day')} />
            </Form.Item>
            <Row gutter={8}>
              <Col span={24}>
                <Form.Item label="Departamento" name="departamento_id" rules={[{ required: true, message: 'Seleccione un departamento' }]}> 
                  <Select
                    placeholder="Seleccione un departamento"
                    onChange={handleDepartamentoChange}
                    onDropdownVisibleChange={handleDepartamentoDropdown}
                    options={departamentos.map(dep => ({ label: dep.nombre, value: dep.idDepartamento }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Municipio" name="municipio_id" rules={[{ required: true, message: 'Seleccione un municipio' }]}> 
                  <Select
                    placeholder="Seleccione un municipio"
                    onChange={handleMunicipioChange}
                    options={municipios.map(mun => ({ label: mun.nombre, value: mun.idMunicipio }))}
                    showSearch
                    optionFilterProp="label"
                    disabled={!form.getFieldValue('departamento_id')}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Aldea" name="aldea_id"> 
                  <Select
                    placeholder="Seleccione una aldea"
                    options={aldeas.map(ald => ({ label: ald.nombre, value: ald.idAldea }))}
                    showSearch
                    optionFilterProp="label"
                    disabled={!form.getFieldValue('municipio_id')}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Dirección completa" name="direccion_completa">
              <Input.TextArea rows={2} maxLength={255} />
            </Form.Item>
            <Form.Item label="Zona" name="zona">
              <Input maxLength={50} />
            </Form.Item>
            <Form.Item label="Referencia" name="referencia">
              <Input.TextArea rows={2} maxLength={255} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={saving} block>
                Guardar Cambios
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
      {/* Apartado médico solo si es paciente */}
      {perfil?.esPaciente && (
        <div style={{ flex: 1, minWidth: 350, maxWidth: 500 }}>
          <Card>
            <Title level={3} style={{ color: '#1890ff' }}>Información Médica</Title>
            <Form
              form={formMedico}
              layout="vertical"
              onFinish={async (values) => {
                setSavingMedico(true);
                try {
                  let payload = { ...values };
                  // Siempre generar el número de expediente si está vacío o null
                  if (!payload.numero_expediente) {
                    const today = new Date();
                    const ymd = today.toISOString().slice(0,10).replace(/-/g, '');
                    payload.numero_expediente = `P-${ymd}-${perfil.idPaciente}`;
                  }
                  await pacienteService.updatePaciente(perfil.idPaciente, payload);
                  formMedico.setFieldsValue({ ...payload });
                  message.success('Datos médicos actualizados correctamente');
                } catch (e) {
                  if (e.message && e.message.includes('No encontrado')) {
                    message.error('El paciente no existe o fue eliminado.');
                  } else {
                    message.error(e.message || 'Error al actualizar datos médicos');
                  }
                } finally {
                  setSavingMedico(false);
                }
              }}
            >
                <Form.Item label="Número de expediente" name="numero_expediente">
                  <Input maxLength={50} disabled placeholder="Se generará automáticamente al guardar" value={formMedico.getFieldValue('numero_expediente') || ''} />
                </Form.Item>
                <Form.Item label="Tipo de sangre" name="tipo_sangre">
                  <Input maxLength={5} placeholder="Ej: O+, A-, etc." />
                </Form.Item>
                <Form.Item label="Alergias" name="alergias">
                  <Input.TextArea rows={2} maxLength={255} />
                </Form.Item>
                <Form.Item label="Enfermedades crónicas" name="enfermedades_cronicas">
                  <Input.TextArea rows={2} maxLength={255} />
                </Form.Item>
                <Form.Item label="Medicamentos actuales" name="medicamentos_actuales">
                  <Input.TextArea rows={2} maxLength={255} />
                </Form.Item>
                <Form.Item label="Nombre de contacto de emergencia" name="contacto_emergencia_nombre">
                  <Input maxLength={100} />
                </Form.Item>
                <Form.Item label="Teléfono de contacto de emergencia" name="contacto_emergencia_telefono">
                  <Input maxLength={20} />
                </Form.Item>
                <Form.Item label="Parentesco de contacto de emergencia" name="contacto_emergencia_parentesco">
                  <Input maxLength={50} />
                </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={savingMedico} block>
                  Guardar Información Médica
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Perfil;
