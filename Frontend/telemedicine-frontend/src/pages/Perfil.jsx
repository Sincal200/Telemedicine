import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Spin, DatePicker, Select, Row, Col, Avatar } from 'antd';
import { 
  UserOutlined, 
  MedicineBoxOutlined, 
  PhoneOutlined, 
  CalendarOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  ContactsOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import userProfileService from '../services/userProfileService';
import catalogoDireccionService from '../services/catalogoDireccionService';
import direccionService from '../services/direccionService';
import pacienteService from '../services/pacienteService';
import especialidadService from '../services/especialidadService';
import styles from '../styles/components/Perfil.module.css';

const { Title, Text } = Typography;

const Perfil = () => {
  // Estado para especialidad del doctor
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadId, setEspecialidadId] = useState(null);
  const [savingEspecialidad, setSavingEspecialidad] = useState(false);
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

  // Cargar especialidades si es médico
  useEffect(() => {
    if (perfil && (perfil.esMedico === true || perfil.esMedico === "true" || perfil.esMedico == 1) && perfil.idPersonalMedico) {
      especialidadService.getEspecialidades().then(setEspecialidades);
      especialidadService.getPersonalMedico(perfil.idPersonalMedico).then(medico => {
        setEspecialidadId(medico.especialidad_id);
      });
    }
  }, [perfil]);

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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text className={styles.loadingText}>Cargando perfil...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* Header del perfil */}
        <div className={styles.profileHeader}>
          <div className={styles.profileHeaderContent}>
            <div className={styles.avatarSection}>
              <UserOutlined />
            </div>
            <div className={styles.profileInfo}>
              <h1>{perfil?.persona?.nombres} {perfil?.persona?.apellidos}</h1>
              <p><strong>Email:</strong> {perfil?.persona?.email}</p>
              <p><strong>Teléfono:</strong> {perfil?.persona?.telefono || 'No especificado'}</p>
              <div className={styles.profileBadge}>
                {perfil?.esPaciente ? '👤 Paciente' : '👨‍⚕️ Personal Médico'}
              </div>
            </div>
          </div>
        </div>

        {/* Cards container */}
        <div className={styles.cardsContainer}>
          {/* Card de información personal */}
          <Card className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <Title level={3} className={styles.cardTitle}>
                <UserOutlined className={styles.cardIcon} />
                Información Personal
              </Title>
            </div>
            <div className={styles.cardContent}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                className={styles.modernForm}
              >
                <div className={styles.formSection}>
                  <div className={styles.sectionTitle}>Datos Básicos</div>
                  
                  <div className={styles.formGrid}>
                    <Form.Item label={<span className={styles.formLabel}>Nombres</span>} name="nombres">
                      <Input className={`${styles.modernInput} ${styles.disabledInput}`} disabled />
                    </Form.Item>
                    <Form.Item label={<span className={styles.formLabel}>Apellidos</span>} name="apellidos">
                      <Input className={`${styles.modernInput} ${styles.disabledInput}`} disabled />
                    </Form.Item>
                  </div>

                  <Form.Item label={<span className={styles.formLabel}>Correo electrónico</span>} name="email" className={styles.formGridFull}>
                    <Input 
                      className={`${styles.modernInput} ${styles.disabledInput}`} 
                      disabled 
                      prefix={<UserOutlined style={{ color: '#a0aec0' }} />}
                    />
                  </Form.Item>

                  <div className={styles.formGrid}>
                    <Form.Item 
                      label={<span className={styles.formLabel}>Teléfono</span>} 
                      name="telefono" 
                      rules={[{ required: true, message: 'Ingrese su teléfono' }]}
                    > 
                      <Input 
                        type="tel" 
                        maxLength={20} 
                        className={styles.modernInput}
                        prefix={<PhoneOutlined style={{ color: '#a0aec0' }} />}
                      />
                    </Form.Item>
                    <Form.Item 
                      label={<span className={styles.formLabel}>Teléfono de emergencia</span>} 
                      name="telefono_emergencia" 
                      rules={[{ required: true, message: 'Ingrese un teléfono de emergencia' }]}
                    > 
                      <Input 
                        type="tel" 
                        maxLength={20} 
                        className={styles.modernInput}
                        prefix={<PhoneOutlined style={{ color: '#a0aec0' }} />}
                      />
                    </Form.Item>
                  </div>

                  <Form.Item 
                    label={<span className={styles.formLabel}>Fecha de nacimiento</span>} 
                    name="fecha_nacimiento" 
                    rules={[{ required: true, message: 'Seleccione su fecha de nacimiento' }]}
                  > 
                    <DatePicker 
                      className={styles.modernDatePicker}
                      format="YYYY-MM-DD" 
                      disabledDate={current => current && current > dayjs().endOf('day')}
                      placeholder="Seleccione fecha"
                    />
                  </Form.Item>
                </div>

                <hr className={styles.divider} />

                <div className={styles.formSection}>
                  <div className={styles.sectionTitle}>
                    <EnvironmentOutlined /> Información de Ubicación
                  </div>
                  
                  <Form.Item 
                    label={<span className={styles.formLabel}>Departamento</span>} 
                    name="departamento_id" 
                    rules={[{ required: true, message: 'Seleccione un departamento' }]}
                  > 
                    <Select
                      placeholder="Seleccione un departamento"
                      onChange={handleDepartamentoChange}
                      onDropdownVisibleChange={handleDepartamentoDropdown}
                      options={departamentos.map(dep => ({ label: dep.nombre, value: dep.idDepartamento }))}
                      showSearch
                      optionFilterProp="label"
                      className={styles.modernSelect}
                    />
                  </Form.Item>

                  <div className={styles.formGrid}>
                    <Form.Item 
                      label={<span className={styles.formLabel}>Municipio</span>} 
                      name="municipio_id" 
                      rules={[{ required: true, message: 'Seleccione un municipio' }]}
                    > 
                      <Select
                        placeholder="Seleccione un municipio"
                        onChange={handleMunicipioChange}
                        options={municipios.map(mun => ({ label: mun.nombre, value: mun.idMunicipio }))}
                        showSearch
                        optionFilterProp="label"
                        disabled={!form.getFieldValue('departamento_id')}
                        className={styles.modernSelect}
                      />
                    </Form.Item>

                    <Form.Item label={<span className={styles.formLabel}>Aldea</span>} name="aldea_id"> 
                      <Select
                        placeholder="Seleccione una aldea"
                        options={aldeas.map(ald => ({ label: ald.nombre, value: ald.idAldea }))}
                        showSearch
                        optionFilterProp="label"
                        disabled={!form.getFieldValue('municipio_id')}
                        className={styles.modernSelect}
                      />
                    </Form.Item>
                  </div>

                  <Form.Item label={<span className={styles.formLabel}>Dirección completa</span>} name="direccion_completa">
                    <Input.TextArea rows={3} maxLength={255} className={styles.modernTextarea} />
                  </Form.Item>

                  <div className={styles.formGrid}>
                    <Form.Item label={<span className={styles.formLabel}>Zona</span>} name="zona">
                      <Input maxLength={50} className={styles.modernInput} />
                    </Form.Item>
                    <Form.Item label={<span className={styles.formLabel}>Referencia</span>} name="referencia">
                      <Input maxLength={100} className={styles.modernInput} />
                    </Form.Item>
                  </div>
                </div>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={saving} 
                    block
                    className={styles.primaryButton}
                  >
                    💾 Guardar Cambios
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </Card>

          {/* Card de especialidad solo si es médico y perfil cargado (acepta string o boolean) */}
          {perfil && (perfil.esMedico === true || perfil.esMedico === "true" || perfil.esMedico == 1) && (
            <Card className={styles.profileCard}>
              <div className={styles.cardHeader}>
                <Title level={3} className={styles.cardTitle}>
                  <MedicineBoxOutlined className={styles.cardIcon} />
                  Especialidad Médica
                </Title>
              </div>
              <div className={styles.cardContent}>
                {/* ...sin depuración visual... */}
                <Form
                  layout="vertical"
                  onFinish={async (values) => {
                    setSavingEspecialidad(true);
                    try {
                      await especialidadService.updateEspecialidad(perfil.idPersonalMedico, values.especialidad_id);
                      setEspecialidadId(values.especialidad_id);
                      message.success('Especialidad actualizada correctamente');
                    } catch (e) {
                      message.error('Error al actualizar especialidad');
                    } finally {
                      setSavingEspecialidad(false);
                    }
                  }}
                  initialValues={{ especialidad_id: especialidadId }}
                >
                  <Form.Item
                    label={<span className={styles.formLabel}>Especialidad</span>}
                    name="especialidad_id"
                    rules={[{ required: true, message: 'Seleccione una especialidad' }]}
                  >
                    <Select
                      placeholder={especialidades.length === 0 ? "No hay especialidades disponibles" : "Seleccione especialidad"}
                      options={especialidades.map(e => ({ label: e.nombre, value: e.idEspecialidad }))}
                      className={styles.modernSelect}
                      value={especialidadId}
                      onChange={setEspecialidadId}
                      disabled={especialidades.length === 0}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={savingEspecialidad} block className={styles.primaryButton} disabled={especialidades.length === 0}>
                      Guardar Especialidad
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </Card>
          )}

          {/* Card de información médica solo si es paciente */}
          {perfil?.esPaciente && (
            <Card className={styles.profileCard}>
              <div className={styles.cardHeader}>
                <Title level={3} className={styles.cardTitle}>
                  <MedicineBoxOutlined className={styles.cardIcon} />
                  Información Médica
                </Title>
              </div>
              <div className={styles.cardContent}>
                {loadingMedico ? (
                  <div className={styles.loadingContainer}>
                    <Spin />
                    <Text>Cargando información médica...</Text>
                  </div>
                ) : (
                  <Form
                    form={formMedico}
                    layout="vertical"
                    onFinish={async (values) => {
                      setSavingMedico(true);
                      try {
                        let payload = { ...values };
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
                    className={styles.modernForm}
                  >
                    <div className={styles.formSection}>
                      <div className={styles.sectionTitle}>
                        <HeartOutlined /> Información Clínica
                      </div>

                      <Form.Item label={<span className={styles.formLabel}>Número de expediente</span>} name="numero_expediente">
                        <Input 
                          maxLength={50} 
                          disabled 
                          placeholder="Se generará automáticamente al guardar" 
                          className={`${styles.modernInput} ${styles.disabledInput}`}
                        />
                      </Form.Item>

                      <Form.Item label={<span className={styles.formLabel}>Tipo de sangre</span>} name="tipo_sangre">
                        <Input 
                          maxLength={5} 
                          placeholder="Ej: O+, A-, B+, etc." 
                          className={styles.modernInput}
                        />
                      </Form.Item>

                      <Form.Item label={<span className={styles.formLabel}>Alergias</span>} name="alergias">
                        <Input.TextArea 
                          rows={3} 
                          maxLength={255} 
                          placeholder="Describa cualquier alergia conocida"
                          className={styles.modernTextarea}
                        />
                      </Form.Item>

                      <Form.Item label={<span className={styles.formLabel}>Enfermedades crónicas</span>} name="enfermedades_cronicas">
                        <Input.TextArea 
                          rows={3} 
                          maxLength={255} 
                          placeholder="Describa enfermedades crónicas o condiciones médicas"
                          className={styles.modernTextarea}
                        />
                      </Form.Item>

                      <Form.Item label={<span className={styles.formLabel}>Medicamentos actuales</span>} name="medicamentos_actuales">
                        <Input.TextArea 
                          rows={3} 
                          maxLength={255} 
                          placeholder="Liste los medicamentos que toma actualmente"
                          className={styles.modernTextarea}
                        />
                      </Form.Item>
                    </div>

                    <hr className={styles.divider} />

                    <div className={styles.formSection}>
                      <div className={styles.sectionTitle}>
                        <ContactsOutlined /> Contacto de Emergencia
                      </div>

                      <Form.Item label={<span className={styles.formLabel}>Nombre completo</span>} name="contacto_emergencia_nombre">
                        <Input 
                          maxLength={100} 
                          className={styles.modernInput}
                          placeholder="Nombre del contacto de emergencia"
                        />
                      </Form.Item>

                      <div className={styles.formGrid}>
                        <Form.Item label={<span className={styles.formLabel}>Teléfono</span>} name="contacto_emergencia_telefono">
                          <Input 
                            maxLength={20} 
                            className={styles.modernInput}
                            prefix={<PhoneOutlined style={{ color: '#a0aec0' }} />}
                          />
                        </Form.Item>

                        <Form.Item label={<span className={styles.formLabel}>Parentesco</span>} name="contacto_emergencia_parentesco">
                          <Input 
                            maxLength={50} 
                            className={styles.modernInput}
                            placeholder="Ej: Madre, Hermano, etc."
                          />
                        </Form.Item>
                      </div>
                    </div>

                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={savingMedico} 
                        block
                        className={styles.primaryButton}
                      >
                        🏥 Guardar Información Médica
                      </Button>
                    </Form.Item>
                  </Form>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
