import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, message, Card, Statistic, Row, Col, Space } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, BarChartOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingArticle, setEditingArticle] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalProduits: 0,
    totalServices: 0,
    stockBas: 0
  });

  // Charger les articles
  const chargerArticles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/articles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticles(response.data);
      calculerStats(response.data);
    } catch (error) {
      message.error('Erreur lors du chargement des articles');
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques
  const calculerStats = (data) => {
    const produits = data.filter(a => a.type_article === 'PRODUIT');
    const services = data.filter(a => a.type_article === 'SERVICE');
    const stockBas = produits.filter(a => a.stock_actuel <= a.stock_alerte);
    
    setStats({
      totalArticles: data.length,
      totalProduits: produits.length,
      totalServices: services.length,
      stockBas: stockBas.length
    });
  };

  useEffect(() => {
    chargerArticles();
  }, []);

  // Ouvrir le formulaire
  const ouvrirFormulaire = (article = null) => {
    if (article) {
      setEditingArticle(article);
      form.setFieldsValue(article);
    } else {
      setEditingArticle(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  // Enregistrer un article
  const enregistrerArticle = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingArticle
        ? `http://localhost:8000/api/articles/${editingArticle.id_article}`
        : 'http://localhost:8000/api/articles';
      
      const method = editingArticle ? 'put' : 'post';
      
      await axios[method](url, values, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success(`Article ${editingArticle ? 'modifié' : 'créé'} avec succès`);
      setModalVisible(false);
      form.resetFields();
      chargerArticles();
    } catch (error) {
      message.error('Erreur lors de l\'enregistrement');
    }
  };

  // Supprimer un article
  const supprimerArticle = async (id) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Voulez-vous vraiment supprimer cet article ?',
      okText: 'Oui',
      cancelText: 'Non',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:8000/api/articles/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          message.success('Article supprimé avec succès');
          chargerArticles();
        } catch (error) {
          message.error('Erreur lors de la suppression');
        }
      }
    });
  };

  // Colonnes du tableau
  const columns = [
    {
      title: 'Code',
      dataIndex: 'code_article',
      key: 'code_article',
      width: 120,
    },
    {
      title: 'Désignation',
      dataIndex: 'designation',
      key: 'designation',
      filteredValue: [searchText],
      onFilter: (value, record) =>
        record.designation.toLowerCase().includes(value.toLowerCase()) ||
        record.code_article?.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Type',
      dataIndex: 'type_article',
      key: 'type_article',
      width: 100,
      render: (type) => (
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          background: type === 'PRODUIT' ? '#e6f7ff' : '#f6ffed',
          color: type === 'PRODUIT' ? '#1890ff' : '#52c41a'
        }}>
          {type}
        </span>
      ),
    },
    {
      title: 'Prix Achat',
      dataIndex: 'prix_achat',
      key: 'prix_achat',
      width: 120,
      render: (prix) => `${prix?.toLocaleString() || 0} FCFA`,
    },
    {
      title: 'Prix Vente',
      dataIndex: 'prix_vente',
      key: 'prix_vente',
      width: 120,
      render: (prix) => `${prix?.toLocaleString() || 0} FCFA`,
    },
    {
      title: 'Marge',
      key: 'marge',
      width: 100,
      render: (_, record) => {
        const marge = record.prix_vente - record.prix_achat;
        return `${marge.toLocaleString()} FCFA`;
      },
    },
    {
      title: 'Stock',
      dataIndex: 'stock_actuel',
      key: 'stock_actuel',
      width: 80,
      render: (stock, record) => (
        <span style={{ 
          color: stock <= record.stock_alerte ? 'red' : 'green',
          fontWeight: 'bold'
        }}>
          {stock || 0}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => ouvrirFormulaire(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => supprimerArticle(record.id_article)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
          Gestion des Articles
        </h1>
      </div>

      {/* Statistiques */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Articles"
              value={stats.totalArticles}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Produits"
              value={stats.totalProduits}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Services"
              value={stats.totalServices}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Stock Bas"
              value={stats.stockBas}
              valueStyle={{ color: '#cf1322' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Barre de contrôle */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <Input
          placeholder="Rechercher un article..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => ouvrirFormulaire()}
        >
          Nouvel Article
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={chargerArticles}
        >
          Actualiser
        </Button>
      </div>

      {/* Tableau */}
      <Table
        columns={columns}
        dataSource={articles}
        rowKey="id_article"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal de formulaire */}
      <Modal
        title={editingArticle ? 'Modifier l\'article' : 'Nouvel article'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={enregistrerArticle}
        >
          <Form.Item
            name="code_article"
            label="Code Article"
            rules={[{ required: true, message: 'Code requis' }]}
          >
            <Input placeholder="EX: ART001" />
          </Form.Item>

          <Form.Item
            name="designation"
            label="Désignation"
            rules={[{ required: true, message: 'Désignation requise' }]}
          >
            <Input placeholder="Nom de l'article" />
          </Form.Item>

          <Form.Item
            name="type_article"
            label="Type"
            rules={[{ required: true, message: 'Type requis' }]}
          >
            <Select placeholder="Sélectionnez le type">
              <Option value="PRODUIT">Produit</Option>
              <Option value="SERVICE">Service</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="prix_achat"
                label="Prix d'achat (FCFA)"
                rules={[{ required: true, message: 'Prix requis' }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="prix_vente"
                label="Prix de vente (FCFA)"
                rules={[{ required: true, message: 'Prix requis' }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stock_actuel"
                label="Stock actuel"
                initialValue={0}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="stock_alerte"
                label="Stock d'alerte"
                initialValue={5}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="unite"
            label="Unité"
            initialValue="Unité"
          >
            <Input placeholder="Ex: Unité, Kg, L, m²" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Enregistrer
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Articles;

