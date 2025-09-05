import { useState } from 'react';
import { Form, Input, Button, Typography, Card, message, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, MedicineBoxOutlined, IdcardOutlined, UserSwitchOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/components/Register.module.css';
import registerService from '../services/registerService';
import TipoDocumentoService from '../services/tipoDocumentoService';
import ROLES_CONFIG from '../config/rolesConfig';

const { Title, Text } = Typography;
const { Option } = Select;

function Register() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Opciones de sexo fijas basadas en la BD
  const opcionesSexo = [
    { id: 1, descripcion: 'Masculino' },
    { id: 2, descripcion: 'Femenino' },
    { id: 3, descripcion: 'Otro' }
  ];


  const onFinish = async (values) => {
    setLoading(true);

    try {
      // 1. Preparar datos del usuario para Keycloak
      const userData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        emailVerified: true,
        enabled: values.userType === 'doctor' ? false : true,
        credentials: [
          { type: 'password', value: values.password, temporary: false }
        ]
      };

      // 2. Obtener token admin (client-credentials) a través del service
      const tokenData = await registerService.getClientCredentialsToken({
        client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
        client_secret: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET
      });

      const adminToken = tokenData.access_token || tokenData.accessToken;
      // Guardar una copia simple para uso posterior si el flujo original lo requiere
      sessionStorage.setItem('adminAccessToken', tokenData.accessToken || tokenData.access_token || '');

      // 3. Crear usuario en Keycloak
      const createUserResult = await registerService.createKeycloakUser(adminToken, userData);
      const userId = createUserResult.userId || createUserResult.id || createUserResult.user?.id;

      // 4. Asignar roles (no bloqueante)
      if (userId && values.userType) {
        const selectedRole = ROLES_CONFIG[values.userType];
        try {
          await registerService.assignUserRoles(adminToken, userId, [selectedRole]);
        } catch (err) {
          console.warn('Error asignando roles (no crítico):', err);
        }
      }

      // 5. Completar registro en la API interna
      const completarRegistroData = {
        keycloak_user_id: userId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        userType: values.userType,
        tipo_documento_id: values.tipo_documento_id,
        numero_documento: values.numero_documento,
        sexo_id: values.sexo_id,
        fecha_nacimiento: null,
        telefono: null,
        justificacion: `Registro automático como ${values.userType === 'doctor' ? 'médico' : 'paciente'}`
      };

      // Construir header para completar registro: anteponer SECRET solo para esta llamada
      // Usa VITE_REGISTRATION_SECRET si está disponible, si no, intenta usar el adminAccessToken guardado
      const REG_SECRET = import.meta.env.VITE_REGISTRATION_SECRET || import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || '';
      const sessionAdminToken = sessionStorage.getItem('adminAccessToken') || '';

      let authHeader = '';
      if (REG_SECRET) {
        // Prepend secret then separator and token expected por backend
        authHeader = `Bearer ${REG_SECRET}|${adminToken}`;
      } else if (sessionAdminToken) {
        authHeader = `Bearer ${sessionAdminToken}|${adminToken}`;
      } else {
        authHeader = `Bearer ${adminToken}`;
      }

      try {
        await registerService.completarRegistro(authHeader, completarRegistroData);
      } catch (err) {
        console.error('Error completando registro en BD:', err);
        message.warning('Usuario creado en Keycloak, pero hay un problema con el registro en la base de datos. Contacta al administrador.');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      // 6. Mensaje de éxito basado en el tipo de usuario
      if (values.userType === 'patient') {
        message.success('¡Registro exitoso! Ya puedes iniciar sesión y usar el sistema.');
      } else {
        message.success('¡Registro exitoso! Tu cuenta será activada tras la aprobación de un administrador. Recibirás una notificación cuando esté lista.');
      }

      setTimeout(() => {
        navigate('/');
      }, 2500);

    } catch (error) {
      console.error('Error en registro:', error);
      message.error(error.message || 'Error al registrar usuario. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const validateConfirmPassword = (_, value) => {
    if (!value || form.getFieldValue('password') === value) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('Las contraseñas no coinciden'));
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <Card className={styles.card} variant={false}>
          <div className={styles.decorativeElements}>
            <div className={styles.decorativeCircle1}></div>
            <div className={styles.decorativeCircle2}></div>
            <div className={styles.decorativeCircle3}></div>
          </div>

          <div className={styles.header}>
            <MedicineBoxOutlined className={styles.logo} />
            <Title level={3} className={styles.title}>
              Crear Cuenta
            </Title>
            <Text className={styles.subtitle}>
              Únete a nuestra plataforma de telemedicina
            </Text>
          </div>

          <Form
            form={form}
            name="register"
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className={styles.form}
          >
            {/* Fila de nombres */}
            <div className={styles.formRow}>
              <Form.Item
                label="Nombre"
                name="firstName"
                className={styles.formItem}
                rules={[
                  { required: true, message: 'Requerido' },
                  { min: 2, message: 'Mínimo 2 caracteres' }
                ]}
              >
                <Input
                  prefix={<UserOutlined className={styles.inputIcon} />}
                  placeholder="Juan"
                  size="large"
                  className={styles.modernInput}
                />
              </Form.Item>

              <Form.Item
                label="Apellido"
                name="lastName"
                className={styles.formItem}
                rules={[
                  { required: true, message: 'Requerido' },
                  { min: 2, message: 'Mínimo 2 caracteres' }
                ]}
              >
                <Input
                  prefix={<UserOutlined className={styles.inputIcon} />}
                  placeholder="Pérez"
                  size="large"
                  className={styles.modernInput}
                />
              </Form.Item>
            </div>

            <Form.Item
              label="Correo Electrónico"
              name="email"
              className={styles.formItem}
              rules={[
                { required: true, message: 'Correo requerido' },
                { type: 'email', message: 'Correo inválido' }
              ]}
            >
              <Input
                prefix={<MailOutlined className={styles.inputIcon} />}
                placeholder="juan@ejemplo.com"
                size="large"
                autoComplete="email"
                className={styles.modernInput}
              />
            </Form.Item>

            <Form.Item
              label="Tipo de Usuario"
              name="userType"
              className={styles.formItem}
              rules={[{ required: true, message: 'Selecciona tipo' }]}
            >
              <Select
                placeholder="Selecciona tu tipo"
                size="large"
                className={styles.modernSelect}
                suffixIcon={<UserSwitchOutlined className={styles.inputIcon} />}
              >
                <Option value="patient">
                  <div className={styles.selectOption}>
                    <UserOutlined />
                    <span>Paciente</span>
                  </div>
                </Option>
                <Option value="doctor">
                  <div className={styles.selectOption}>
                    <MedicineBoxOutlined />
                    <span>Doctor</span>
                  </div>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Sexo"
              name="sexo_id"
              className={styles.formItem}
              rules={[{ required: true, message: 'Selecciona una opción' }]}
            >
              <Select
                placeholder="Selecciona una opción"
                size="large"
                className={styles.modernSelect}
                suffixIcon={<TeamOutlined className={styles.inputIcon} />}
              >
                {opcionesSexo.map(sexo => (
                  <Option key={sexo.id} value={sexo.id}>
                    {sexo.descripcion}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Tipo de Documento"
              name="tipo_documento_id"
              className={styles.formItem}
              rules={[{ required: true, message: 'Selecciona un tipo de documento' }]}
            >
              <Select
                placeholder="Selecciona tipo de documento"
                size="large"
                className={styles.modernSelect}
                suffixIcon={<IdcardOutlined className={styles.inputIcon} />}
              >
                {TipoDocumentoService.obtenerOpciones().map(tipo => (
                  <Option key={tipo.id} value={tipo.id}>
                    {tipo.codigo} - {tipo.descripcion}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Número de Documento"
              name="numero_documento"
              className={styles.formItem}
              rules={[
                { required: true, message: 'Ingrese su número de documento' },
                { min: 8, message: 'Mínimo 8 caracteres' },
                { max: 20, message: 'Máximo 20 caracteres' },
                { pattern: /^[A-Za-z0-9]+$/, message: 'Solo letras y números' }
              ]}
            >
              <Input
                placeholder="Ingrese número de documento"
                size="large"
                className={styles.modernInput}
                prefix={<IdcardOutlined className={styles.inputIcon} />}
                maxLength={20}
              />
            </Form.Item>

            {/* Fila de contraseñas */}
            <div className={styles.formRow}>
              <Form.Item
                label="Contraseña"
                name="password"
                className={styles.formItem}
                rules={[
                  { required: true, message: 'Requerida' },
                  { min: 8, message: 'Mínimo 8 caracteres' },
                  { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Debe contener A-Z, a-z, 0-9' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className={styles.inputIcon} />}
                  placeholder="••••••••"
                  size="large"
                  autoComplete="new-password"
                  className={styles.modernInput}
                />
              </Form.Item>

              <Form.Item
                label="Confirmar"
                name="confirmPassword"
                className={styles.formItem}
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Confirma contraseña' },
                  { validator: validateConfirmPassword }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className={styles.inputIcon} />}
                  placeholder="••••••••"
                  size="large"
                  autoComplete="new-password"
                  className={styles.modernInput}
                />
              </Form.Item>
            </div>

            <Form.Item className={styles.submitItem}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                className={styles.submitButton}
              >
                Crear Cuenta
              </Button>
            </Form.Item>

            <div className={styles.loginLink}>
              <Text>
                ¿Ya tienes cuenta?{' '}
                <Link to="/" className={styles.link}>
                  Inicia sesión
                </Link>
              </Text>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default Register;