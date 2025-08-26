import { useState } from 'react';
import { Form, Input, Button, Typography, Card, message, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, MedicineBoxOutlined, IdcardOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/components/Register.module.css';

const { Title, Text } = Typography;
const { Option } = Select;

function Register() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Configuración de roles 
  const ROLES_CONFIG = {
    doctor: {
      id: "11edbd0f-2eb9-4c04-a6b0-d76cb1bc6851", 
      name: "doctor",
      description: "",
      composite: false,
      clientRole: false,
      containerId: "8da3b139-a4a3-4ff9-b607-43658847a68"
    },
    patient: {
      id: "11267344-7e42-49bc-83e3-f35b34dc33a9", 
      name: "patient",
      description: "",
      composite: false,
      clientRole: false,
      containerId: "8da3b139-a4a3-4ff9-b607-43658847a683"
    }
  };

  const onFinish = async (values) => {
    setLoading(true);

    try {
      // 1. Preparar datos del usuario para Keycloak 
      const userData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        emailVerified: true,
        enabled: true,
        credentials: [
          {
            type: 'password',
            value: values.password,
            temporary: false
          }
        ]
      };

      // 2. Obtener un token de cliente para crear usuarios
      const tokenResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/client-credentials-token?tenant=${import.meta.env.VITE_TENANT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
          client_secret: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Error al obtener token de autenticación');
      }

      const tokenData = await tokenResponse.json();
      const adminToken = tokenData.access_token;
      sessionStorage.setItem('adminAccessToken', tokenData.accessToken || tokenData.access_token || '');

      // 3. Crear el usuario en Keycloak
      const createUserResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/create-user?tenant=telemedicine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(userData)
      });

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json();
        throw new Error(errorData.error || 'Error al crear usuario en Keycloak');
      }

      const createUserResult = await createUserResponse.json();
      const userId = createUserResult.userId;

      console.log('Usuario creado exitosamente en Keycloak con ID:', userId);

      // 4. Asignar roles en Keycloak
      if (userId && values.userType) {
        const selectedRole = ROLES_CONFIG[values.userType];

        const roleAssignmentData = {
          userId: userId,
          roles: [selectedRole]
        };

        try {
          const assignRolesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/assign-user-roles?tenant=telemedicine`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(roleAssignmentData)
          });

          if (assignRolesResponse.ok) {
            console.log('Roles asignados exitosamente en Keycloak');
          } else {
            const errorData = await assignRolesResponse.json();
            console.warn('No se pudieron asignar roles automáticamente:', errorData);
          }
        } catch (roleError) {
          console.warn('Error al asignar roles:', roleError);
          // No fallar el registro por esto
        }
      }

      // 5. NUEVO: Completar registro en base de datos
      const completarRegistroData = {
        keycloak_user_id: userId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        userType: values.userType,
        // Campos adicionales que podrían necesitarse después
        numero_documento: null,
        fecha_nacimiento: null,
        telefono: null,
        justificacion: `Registro automático como ${values.userType === 'doctor' ? 'médico' : 'paciente'}`
      };

      const completarResponse = await fetch(`${import.meta.env.VITE_API_URL_1 }/registro/completar?tenant=telemedicine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer 7RkzXMulw5fc8QyP5gxAutgWVQXoOPOY|${adminToken}`
        },
        body: JSON.stringify(completarRegistroData)
      });

      if (!completarResponse.ok) {
        const errorData = await completarResponse.json();
        console.error('Error completando registro en BD:', errorData);
        
        // Informar al usuario pero no fallar completamente
        message.warning('Usuario creado en Keycloak, pero hay un problema con el registro en la base de datos. Contacta al administrador.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
        return;
      }

      const registroResult = await completarResponse.json();
      console.log('Registro completado exitosamente:', registroResult);

      // 6. Mensaje de éxito basado en el tipo de usuario
      if (values.userType === 'patient') {
        message.success('¡Registro exitoso! Ya puedes iniciar sesión y usar el sistema.');
      } else {
        message.success('¡Registro exitoso! Tu solicitud está pendiente de aprobación por un administrador. Te notificaremos cuando esté lista.');
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