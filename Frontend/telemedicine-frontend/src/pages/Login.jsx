import { useState } from 'react';
import { Form, Input, Button, Typography, Card, message } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import '@ant-design/v5-patch-for-react-19';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/components/Login.module.css';

const { Title, Text } = Typography;

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);

    try {
      // Preparar datos para el login
      const loginData = {
        username: values.email, 
        password: values.password,
        tenant: "telemedicine"
      };

      // Realizar petición de login
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`

        },
        body: JSON.stringify(loginData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al iniciar sesión');
      }

      const data = await response.json();
      
      // Guardar tokens en sessionStorage
      sessionStorage.setItem('accessToken', data.accessToken || data.access_token);
      sessionStorage.setItem('refreshToken', data.refreshToken || data.refresh_token);
      sessionStorage.setItem('tokenType', data.token_type || 'Bearer');
      sessionStorage.setItem('expiresIn', data.expires_in);
      sessionStorage.setItem('sessionState', data.session_state);
      
      if (data.userInfo) {
        sessionStorage.setItem('userInfo', JSON.stringify(data.userInfo));
      }

      console.log('Login exitoso, tokens guardados:', {
        accessToken: data.accessToken ? 'Guardado' : 'No encontrado',
        refreshToken: data.refreshToken ? 'Guardado' : 'No encontrado',
        expiresIn: data.expires_in
      });

      message.success('¡Inicio de sesión exitoso!');
      
 
      setTimeout(() => {
        navigate('/dashboard'); 
      }, 1000);

    } catch (error) {
      console.error('Error en login:', error);
      message.error(error.message || 'Credenciales inválidas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card} variant={false}>
        <div className={styles.decorativeCircle1}></div>
        <div className={styles.decorativeCircle2}></div>
        
        <div className={styles.header}>
          <MedicineBoxOutlined className={styles.logo} />
          <Title level={2} className={styles.title}>
            Telemedicine
          </Title>
          <Text className={styles.subtitle}>
            Accede a tu cuenta para continuar
          </Text>
        </div>

        <Form
          name="login"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={{ email: '', password: '' }}
          style={{ position: 'relative', zIndex: 2 }}
        >
          <Form.Item
            label={<span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Correo Electrónico</span>}
            name="email"
            rules={[
              { required: true, message: 'Por favor ingresa tu correo electrónico' },
              { type: 'email', message: 'Ingresa un correo válido' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="usuario@telemed.com"
              size="large"
              autoComplete="email"
              className={styles.modernInput}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Contraseña</span>}
            name="password"
            rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="••••••••"
              size="large"
              autoComplete="current-password"
              className={styles.modernInput}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Link to="http://localhost:8080/realms/telemedicine/login-actions/reset-credentials?client_id=bifrost&redirect_uri=http://localhost:5173/" className={styles.link}>
              ¿Olvidaste tu contraseña?
            </Link>
          </Form.Item>

          <Form.Item style={{ marginBottom: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              className={styles.modernButton}
            >
              Iniciar Sesión
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className={styles.registerLink}>
                Regístrate aquí
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Login;