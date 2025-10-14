import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Table, Tag, Space, Spin } from 'antd';
import { 
  UserOutlined, 
  ShoppingCartOutlined, 
  FileTextOutlined, 
  DollarOutlined,
  ReloadOutlined,
  PlusOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  ShopOutlined,
  BarChartOutlined as ReportsOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Récupérer les statistiques
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery(
    'dashboard-stats',
    dashboardService.getStats,
    {
      refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    }
  );

  // Récupérer les données de ventes pour le graphique
  const { data: salesData, isLoading: salesLoading } = useQuery(
    'sales-data',
    dashboardService.getSalesData,
    {
      refetchInterval: 30000,
    }
  );

  // Récupérer l'activité récente
  const { data: recentActivity, isLoading: activityLoading } = useQuery(
    'recent-activity',
    dashboardService.getRecentActivity,
    {
      refetchInterval: 30000,
    }
  );

  const handleRefresh = () => {
    refetchStats();
    setLastUpdate(new Date());
    toast.success('Données actualisées');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'facture':
        navigate('/facturation');
        break;
      case 'devis':
        navigate('/devis');
        break;
      case 'comptoir':
        navigate('/comptoir');
        break;
      case 'rapports':
        navigate('/rapports');
        break;
      default:
        break;
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeConfig = {
          facture: { color: 'blue', icon: '📄' },
          devis: { color: 'green', icon: '📋' },
          comptoir: { color: 'orange', icon: '🛒' },
        };
        const config = typeConfig[type] || { color: 'default', icon: '📄' };
        return (
          <Space>
            <span>{config.icon}</span>
            <Tag color={config.color}>{type.toUpperCase()}</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Numéro',
      dataIndex: 'numero',
      key: 'numero',
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
    },
    {
      title: 'Montant',
      dataIndex: 'montant',
      key: 'montant',
      render: (montant) => `${montant?.toLocaleString()} FCFA`,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut) => {
        const statusConfig = {
          'payée': { color: 'green' },
          'brouillon': { color: 'orange' },
          'en_attente': { color: 'blue' },
          'annulée': { color: 'red' },
        };
        const config = statusConfig[statut] || { color: 'default' };
        return <Tag color={config.color}>{statut?.toUpperCase()}</Tag>;
      },
    },
  ];

  if (statsLoading || salesLoading || activityLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <Card 
        style={{ 
          marginBottom: 20, 
          background: '#2d2d2d', 
          border: '1px solid #404040' 
        }}
        bodyStyle={{ padding: '20px' }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#1890ff',
              margin: 0
            }}>
              📊 Tableau de Bord
            </h1>
            <p style={{ 
              color: '#a0a0a0', 
              margin: '8px 0 0 0' 
            }}>
              Dernière mise à jour: {lastUpdate.toLocaleString('fr-FR')}
            </p>
          </div>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            style={{ background: '#1890ff', borderColor: '#1890ff' }}
          >
            Actualiser
          </Button>
        </div>
      </Card>

      {/* Actions Rapides */}
      <Card 
        title="⚡ Actions Rapides" 
        style={{ 
          marginBottom: 20, 
          background: '#2d2d2d', 
          border: '1px solid #404040' 
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => handleQuickAction('facture')}
              style={{ 
                textAlign: 'center',
                background: '#404040',
                border: '1px solid #595959'
              }}
            >
              <FileTextOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '10px' }} />
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                Nouvelle Facture
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => handleQuickAction('devis')}
              style={{ 
                textAlign: 'center',
                background: '#404040',
                border: '1px solid #595959'
              }}
            >
              <FileSearchOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '10px' }} />
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                Nouveau Devis
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => handleQuickAction('comptoir')}
              style={{ 
                textAlign: 'center',
                background: '#404040',
                border: '1px solid #595959'
              }}
            >
              <ShopOutlined style={{ fontSize: '32px', color: '#fa8c16', marginBottom: '10px' }} />
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                Vente Comptoir
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => handleQuickAction('rapports')}
              style={{ 
                textAlign: 'center',
                background: '#404040',
                border: '1px solid #595959'
              }}
            >
              <ReportsOutlined style={{ fontSize: '32px', color: '#722ed1', marginBottom: '10px' }} />
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                Rapports
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Statistiques Principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            background: '#2d2d2d', 
            border: '1px solid #404040',
            textAlign: 'center'
          }}>
            <Statistic
              title="Clients"
              value={stats?.nb_clients || 0}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#ffffff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            background: '#2d2d2d', 
            border: '1px solid #404040',
            textAlign: 'center'
          }}>
            <Statistic
              title="Articles"
              value={stats?.nb_articles || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#ffffff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            background: '#2d2d2d', 
            border: '1px solid #404040',
            textAlign: 'center'
          }}>
            <Statistic
              title="Factures du Mois"
              value={stats?.nb_factures_mois || 0}
              prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#ffffff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            background: '#2d2d2d', 
            border: '1px solid #404040',
            textAlign: 'center'
          }}>
            <Statistic
              title="CA du Mois"
              value={stats?.ca_mois || 0}
              prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
              suffix="FCFA"
              valueStyle={{ color: '#ffffff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Graphiques */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={16}>
          <Card 
            title="📊 Ventes par Mois" 
            style={{ 
              background: '#2d2d2d', 
              border: '1px solid #404040' 
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis 
                  dataKey="mois" 
                  stroke="#a0a0a0"
                  tick={{ fill: '#a0a0a0' }}
                />
                <YAxis 
                  stroke="#a0a0a0"
                  tick={{ fill: '#a0a0a0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#2d2d2d', 
                    border: '1px solid #404040',
                    color: '#ffffff'
                  }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#1890ff" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title="📈 Évolution des Ventes" 
            style={{ 
              background: '#2d2d2d', 
              border: '1px solid #404040' 
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis 
                  dataKey="mois" 
                  stroke="#a0a0a0"
                  tick={{ fill: '#a0a0a0' }}
                />
                <YAxis 
                  stroke="#a0a0a0"
                  tick={{ fill: '#a0a0a0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#2d2d2d', 
                    border: '1px solid #404040',
                    color: '#ffffff'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#52c41a" 
                  strokeWidth={2}
                  dot={{ fill: '#52c41a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Activité Récente */}
      <Card 
        title="🕒 Activité Récente" 
        style={{ 
          background: '#2d2d2d', 
          border: '1px solid #404040' 
        }}
      >
        <Table
          columns={columns}
          dataSource={recentActivity || []}
          pagination={{ pageSize: 5 }}
          rowKey="id"
          style={{ background: 'transparent' }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;

