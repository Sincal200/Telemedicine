import { useState } from 'react';
import { Form, Input, Button, Typography, Card, message } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import '@ant-design/v5-patch-for-react-19';
import { Link } from 'react-router-dom';
import styles from '../styles/components/Login.module.css';

const { Title, Text } = Typography;

function Login() {
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (values.email === 'user@telemed.com' && values.password === 'password123') {
        message.success('¡Inicio de sesión exitoso!');
      } else {
        message.error('Credenciales inválidas. Inténtalo de nuevo.');
      }
    }, 1200);
  };

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
            <Link to="/video">
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
            </Link>
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