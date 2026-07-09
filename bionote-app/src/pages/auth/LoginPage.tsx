import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/useAuthStore';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = () => {
    login();
    navigate('/');
  };

  return (
    <Card
      style={{ width: 400, border: '1px solid #d5dbe3', borderRadius: 8, boxShadow: '0 2px 8px rgba(20,30,40,0.07)' }}
      bodyStyle={{ padding: 32 }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div
          style={{
            width: 48,
            height: 48,
            display: 'inline-grid',
            placeItems: 'center',
            borderRadius: 6,
            background: '#1a8b6f',
            color: '#fff',
            fontWeight: 800,
            fontSize: 22,
            marginBottom: 12,
          }}
        >
          B
        </div>
        <Title level={3} style={{ margin: 0 }}>BioNote</Title>
        <Text type="secondary">生物实验记录助手</Text>
      </div>

      <Form onFinish={onFinish} size="large">
        <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
          <Input prefix={<UserOutlined />} placeholder="用户名" defaultValue="li@example.com" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="密码" defaultValue="password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form.Item>
      </Form>

      <Divider plain>
        <Text type="secondary" style={{ fontSize: 12 }}>演示账号</Text>
      </Divider>
      <div
        style={{
          padding: 14,
          borderRadius: 6,
          background: '#f8f9fb',
          border: '1px solid #e4e8ee',
          fontSize: 13,
          color: '#6b7885',
        }}
      >
        <div>用户名：li@example.com</div>
        <div>密码：password</div>
        <div style={{ marginTop: 4 }}>当前实验室：分子生物学教学实验室</div>
      </div>
    </Card>
  );
};

export default LoginPage;
