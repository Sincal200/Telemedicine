import { useState } from 'react';
import { Form, Input, Button, Typography, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import '@ant-design/v5-patch-for-react-19';
import { Link } from 'react-router-dom';


const { Title } = Typography;

const cardStyle = {
  maxWidth: 350,
  margin: '80px auto',
  background: '#f9fafb',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
  border: '1px solid #e3e8ee',
};

function Login() {
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    // Simulación de autenticación
    setTimeout(() => {
      setLoading(false);
      if (values.email === 'user@telemed.com' && values.password === 'password123') {
        message.success('Login successful!');
        // Aquí puedes redirigir o guardar el token
      } else {
        message.error('Invalid credentials. Please try again.');
      }
    }, 1200);
  };

  return (
    <Card style={cardStyle}>
      <Title level={3} style={{ color: '#1e293b', textAlign: 'center', marginBottom: 24 }}>
        Telemedicine Login
      </Title>
      <Form
        name="login"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        initialValues={{ email: '', password: '' }}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Enter a valid email' },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
            placeholder="user@telemed.com"
            size="large"
            autoComplete="email"
            style={{ background: '#f1f5f9', borderRadius: 8 }}
          />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Password"
            size="large"
            autoComplete="current-password"
            style={{ background: '#f1f5f9', borderRadius: 8 }}
          />
        </Form.Item>
        <Form.Item>
          <Link to="/video">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block
            style={{
              background: '#38bdf8',
              borderColor: '#38bdf8',
              borderRadius: 8,
              fontWeight: 500,
            }}
          >
            Login
          </Button>
          </Link>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default Login;