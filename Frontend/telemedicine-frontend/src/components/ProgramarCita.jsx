import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Timeline,
  Modal,
  message,
  Spin,
  Typography,
  Tag,
  Space,
  Avatar,
  Divider,
  Input
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  SearchOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import citaService from '../services/citaService';
import userProfileService from '../services/userProfileService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

function ProgramarCita({ visible, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [programandoCita, setProgramandoCita] = useState(false);
  
  // Datos para los selects
  const [especialidades, setEspecialidades] = useState([]);
  const [tiposCita, setTiposCita] = useState([]);
  
  // Horarios disponibles
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  
  // Estado del modal de confirmación
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    if (visible) {
      cargarDatosIniciales();
    }
  }, [visible]);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      const [especialidadesData, tiposCitaData] = await Promise.all([
        citaService.obtenerEspecialidades(),
        citaService.obtenerTiposCita()
      ]);
      
      setEspecialidades(especialidadesData);
      setTiposCita(tiposCitaData);
    } catch (error) {
      message.error('Error cargando datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const buscarHorarios = async (values) => {
    setBuscandoHorarios(true);
    setHorariosDisponibles([]);
    setHorarioSeleccionado(null);

    try {
      const filtros = {
        especialidadId: values.especialidadId,
        fechaInicio: values.fechas[0].format('YYYY-MM-DD'),
        fechaFin: values.fechas[1].format('YYYY-MM-DD'),
        tipoCitaId: values.tipoCitaId
      };

      const horarios = await citaService.buscarHorariosDisponibles(filtros);
      setHorariosDisponibles(horarios);

      if (horarios.length === 0) {
        message.info('No se encontraron horarios disponibles para los criterios seleccionados');
      } else {
        message.success(`Se encontraron ${horarios.length} horarios disponibles`);
      }
    } catch (error) {
      message.error('Error buscando horarios: ' + error.message);
    } finally {
      setBuscandoHorarios(false);
    }
  };

  const seleccionarHorario = (horario) => {
    setHorarioSeleccionado(horario);
    setMostrarConfirmacion(true);
  };

  const confirmarCita = async (motivoCita) => {
    setProgramandoCita(true);
    
    try {
      // Obtener ID del paciente actual
      const idPaciente = await userProfileService.obtenerIdPaciente();
      
      if (!idPaciente) {
        throw new Error('No se pudo obtener la información del paciente. Asegúrate de estar registrado como paciente.');
      }

      // Extraer fecha y hora del horario seleccionado
      const [fecha, horaCompleta] = horarioSeleccionado.fechaHora.split(' ');
      const horaInicio = horaCompleta.substring(0, 5); // HH:MM

      const datosCita = {
        pacienteId: idPaciente,
        personalMedicoId: horarioSeleccionado.personalMedicoId,
        fecha: fecha,
        horaInicio: horaInicio,
        tipoCitaId: form.getFieldValue('tipoCitaId'),
        motivoConsulta: motivoCita,
        prioridadId: 1 // Normal por defecto
      };

      await citaService.programarCita(datosCita);
      
      message.success('¡Cita programada exitosamente!');
      setMostrarConfirmacion(false);
      form.resetFields();
      setHorariosDisponibles([]);
      setHorarioSeleccionado(null);
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      message.error('Error programando cita: ' + error.message);
    } finally {
      setProgramandoCita(false);
    }
  };

  const agruparHorariosPorFecha = (horarios) => {
    const grupos = {};
    horarios.forEach(horario => {
      const fecha = horario.fechaHora.split(' ')[0];
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(horario);
    });
    return grupos;
  };

  const formatearFecha = (fecha) => {
    return dayjs(fecha).format('dddd, DD [de] MMMM');
  };

  const formatearHora = (fechaHora) => {
    const hora = fechaHora.split(' ')[1];
    return hora.substring(0, 5); // HH:MM
  };

  const horariosPorFecha = agruparHorariosPorFecha(horariosDisponibles);

  return (
    <>
      <Modal
        title={
          <Space>
            <CalendarOutlined />
            Programar Nueva Cita
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={buscarHorarios}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="especialidadId"
                  label="Especialidad"
                  rules={[{ required: true, message: 'Selecciona una especialidad' }]}
                >
                  <Select
                    placeholder="Selecciona la especialidad"
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {especialidades.map(esp => (
                      <Option key={esp.idEspecialidad} value={esp.idEspecialidad}>
                        {esp.nombre}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="tipoCitaId"
                  label="Tipo de Cita"
                  rules={[{ required: true, message: 'Selecciona el tipo de cita' }]}
                >
                  <Select placeholder="Selecciona el tipo de cita">
                    {tiposCita.map(tipo => (
                      <Option key={tipo.idTipoCita} value={tipo.idTipoCita}>
                        <Space>
                          {tipo.nombre}
                          <Tag color="blue">{tipo.duracion_minutos} min</Tag>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="fechas"
              label="Rango de Fechas"
              rules={[{ required: true, message: 'Selecciona el rango de fechas' }]}
            >
              <RangePicker
                style={{ width: '100%' }}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                placeholder={['Fecha inicio', 'Fecha fin']}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={buscandoHorarios}
                icon={<SearchOutlined />}
                block
              >
                Buscar Horarios Disponibles
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          {/* Mostrar horarios disponibles */}
          {horariosDisponibles.length > 0 && (
            <div>
              <Title level={4}>
                <ClockCircleOutlined /> Horarios Disponibles ({horariosDisponibles.length})
              </Title>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {Object.entries(horariosPorFecha).map(([fecha, horarios]) => (
                  <Card key={fecha} size="small" style={{ marginBottom: 16 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>
                      {formatearFecha(fecha)}
                    </Title>
                    
                    <Row gutter={[8, 8]}>
                      {horarios.map((horario, index) => (
                        <Col xs={12} sm={8} md={6} key={index}>
                          <Card
                            hoverable
                            size="small"
                            onClick={() => seleccionarHorario(horario)}
                            style={{
                              textAlign: 'center',
                              cursor: 'pointer',
                              border: horarioSeleccionado === horario ? '2px solid #1890ff' : '1px solid #d9d9d9'
                            }}
                          >
                            <Space direction="vertical" size="small">
                              <Text strong>{formatearHora(horario.fechaHora)}</Text>
                              <Avatar 
                                size="small" 
                                icon={<UserOutlined />} 
                              />
                              <Text style={{ fontSize: '12px' }}>
                                {horario.medico.nombre}
                              </Text>
                              <Tag color="green" style={{ fontSize: '10px' }}>
                                {horario.duracionMinutos} min
                              </Tag>
                            </Space>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {buscandoHorarios && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text>Buscando horarios disponibles...</Text>
              </div>
            </div>
          )}
        </Spin>
      </Modal>

      {/* Modal de confirmación */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            Confirmar Cita
          </Space>
        }
        open={mostrarConfirmacion}
        onCancel={() => setMostrarConfirmacion(false)}
        footer={null}
        width={500}
      >
        {horarioSeleccionado && (
          <Form
            layout="vertical"
            onFinish={(values) => confirmarCita(values.motivo)}
          >
            <Card style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Detalles de la Cita:</Text>
                <Space>
                  <CalendarOutlined />
                  <Text>{formatearFecha(horarioSeleccionado.fechaHora.split(' ')[0])}</Text>
                </Space>
                <Space>
                  <ClockCircleOutlined />
                  <Text>{formatearHora(horarioSeleccionado.fechaHora)}</Text>
                </Space>
                <Space>
                  <UserOutlined />
                  <Text>{horarioSeleccionado.medico.nombre}</Text>
                </Space>
                <Space>
                  <MedicineBoxOutlined />
                  <Text>{horarioSeleccionado.medico.especialidad}</Text>
                </Space>
              </Space>
            </Card>

            <Form.Item
              name="motivo"
              label="Motivo de la Consulta"
              rules={[{ required: true, message: 'Describe el motivo de tu consulta' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Describe brevemente el motivo de tu consulta..."
              />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setMostrarConfirmacion(false)}>
                  Cancelar
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={programandoCita}
                  icon={<CheckCircleOutlined />}
                >
                  Confirmar Cita
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
}

export default ProgramarCita;
