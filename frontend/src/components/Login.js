import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await authService.login(values);
      onLogin(response.utilisateur, response.access_token);
      message.success('Connexion réussie !');
    } catch (error) {
      message.error(error.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1f1f1f 0%, #2d2d2d 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#2d2d2d',
          border: '1px solid #404040',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1890ff',
            marginBottom: '8px'
          }}>
            Tech Info Plus
          </div>
          <div style={{
            fontSize: '16px',
            color: '#a0a0a0'
          }}>
            Système de Facturation
          </div>
        </div>

        <Form
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="nom_utilisateur"
            rules={[
              { required: true, message: 'Veuillez saisir votre nom d\'utilisateur !' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#a0a0a0' }} />}
              placeholder="Nom d'utilisateur"
              style={{
                background: '#1f1f1f',
                border: '1px solid #404040',
                color: '#ffffff'
              }}
            />
          </Form.Item>

          <Form.Item
            name="mot_de_passe"
            rules={[
              { required: true, message: 'Veuillez saisir votre mot de passe !' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#a0a0a0' }} />}
              placeholder="Mot de passe"
              style={{
                background: '#1f1f1f',
                border: '1px solid #404040',
                color: '#ffffff'
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<LoginOutlined />}
              style={{
                width: '100%',
                height: '45px',
                background: '#1890ff',
                borderColor: '#1890ff',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? <Spin size="small" /> : 'Se connecter'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '12px',
          color: '#a0a0a0'
        }}>
          © 2025 Tech Info Plus - Tous droits réservés
        </div>
      </Card>
    </div>
  );
};

export default Login;

