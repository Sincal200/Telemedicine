import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userProfileService from '../services/userProfileService';
import { getDisponibilidadMedico, crearDisponibilidadMedico, actualizarDisponibilidadMedico, eliminarDisponibilidadMedico } from '../services/disponibilidadMedicoService';
import { Button, Table, Modal, Form, Input, Select, TimePicker, Checkbox, message, Alert, Spin } from 'antd';
import dayjs from 'dayjs';

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
        const id = await userProfileService.obtenerIdPersonalMedico();
        setPersonalMedicoId(id);
        setIsDoctor(!!id);
        if (id) {
          fetchDisponibilidad(id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error obteniendo ID de personal médico:', error);
        setIsDoctor(false);
        setLoading(false);
      }
    }
    getIdAndFetch();
  }, []);

  const handleAdd = () => {
    setEditData(null);
    form.setFieldsValue({
      dia_semana_id: undefined,
      hora_inicio: null,
      hora_fin: null,
      duracion_consulta: undefined,
      activo: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditData(record);
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
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spin size="large" />
        <p style={{ marginTop: '1rem' }}>Cargando configuración...</p>
      </div>
    );
  }

  // Si no es doctor, mostrar mensaje de acceso restringido
  if (isDoctor === false) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <Alert
          message="Acceso Restringido"
          description="Esta función está disponible únicamente para personal médico. Los pacientes no pueden acceder a la configuración de horarios."
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/dashboard')}>
              Volver al Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <h2>Configuración de Horario</h2>
      <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>Agregar Disponibilidad</Button>
      <Table columns={columns} dataSource={disponibilidad} rowKey="idDisponibilidad" loading={loading} pagination={false} />
      <Modal
        open={modalVisible}
        title={editData ? 'Editar Disponibilidad' : 'Agregar Disponibilidad'}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Guardar"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="dia_semana_id" label="Día de la semana" rules={[{ required: true, type: 'number', message: 'Seleccione un día' }]}>
            <Select options={diasSemana} placeholder="Seleccione un día" allowClear />
          </Form.Item>
          <Form.Item name="hora_inicio" label="Hora inicio" rules={[{ required: true, message: 'Seleccione la hora de inicio' }]}
            getValueFromEvent={value => value}>
            <TimePicker format="HH:mm" placeholder="Seleccione hora" />
          </Form.Item>
          <Form.Item name="hora_fin" label="Hora fin" rules={[{ required: true, message: 'Seleccione la hora de fin' }]}
            getValueFromEvent={value => value}>
            <TimePicker format="HH:mm" placeholder="Seleccione hora" />
          </Form.Item>
          <Form.Item name="duracion_consulta" label="Duración de consulta (min)" rules={[{ required: true, type: 'number', message: 'Ingrese duración' }]}
            getValueFromEvent={e => Number(e.target.value)}>
            <Input type="number" min={5} max={180} placeholder="Duración en minutos" />
          </Form.Item>
          <Form.Item name="activo" valuePropName="checked" label="Activo">
            <Checkbox />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
