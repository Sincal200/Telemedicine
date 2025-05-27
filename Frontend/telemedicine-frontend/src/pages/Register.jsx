/* filepath: c:\Users\sinca\OneDrive\Documents\Telemedicine\Frontend\telemedicine-frontend\src\pages\Register.jsx */
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

  // Configuración de roles (actualiza estos IDs con los reales de tu Keycloak)
  const ROLES_CONFIG = {
    doctor: {
      id: "716760e5-576b-4777-bb8e-05389cdefa44", // Reemplaza con el ID real del rol doctor
      name: "doctor",
      description: "",
      composite: false,
      clientRole: true,
      containerId: "a08c20f3-b6d6-472f-9101-89d48ad61895"
    },
    patient: {
      id: "2eec45da-b9c3-4656-90c9-51cb7ba3b313", // Tu ID actual del rol patient
      name: "patient",
      description: "",
      composite: false,
      clientRole: true,
      containerId: "a08c20f3-b6d6-472f-9101-89d48ad61895"
    }
  };

  const onFinish = async (values) => {
    setLoading(true);

    try {
      // Preparar datos del usuario para Keycloak (simplificado)
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

      // 1. Primero obtener un token de cliente para crear usuarios
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

      // 2. Crear el usuario
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
        throw new Error(errorData.error || 'Error al crear usuario');
      }

      // 3. Obtener la respuesta con el userId
      const createUserResult = await createUserResponse.json();
      const userId = createUserResult.userId;

      console.log('Usuario creado exitosamente con ID:', userId);

      // 4. Asignar roles por defecto si tenemos el userId
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
            console.log('Roles asignados exitosamente');
          } else {
            const errorData = await assignRolesResponse.json();
            console.warn('No se pudieron asignar roles automáticamente:', errorData);
          }
        } catch (roleError) {
          console.warn('Error al asignar roles:', roleError);
          // No fallar el registro por esto
        }
      }

      message.success('¡Registro exitoso! Puedes iniciar sesión ahora.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);

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