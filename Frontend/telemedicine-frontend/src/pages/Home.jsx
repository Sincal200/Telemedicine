import { Link } from 'react-router-dom';
import { Button, Typography, Space } from 'antd';
import 'antd/dist/reset.css';

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: 60 }}>
      <Typography.Title level={2}>Welcome to the Telemedicine App</Typography.Title>
      <Typography.Paragraph>Your health, our priority.</Typography.Paragraph>
      <Space>
        <Link to="/about">
          <Button type="primary">Learn More About Us</Button>
        </Link>
      </Space>
    </div>
  );
}

export default Home;