import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Card, Statistic, Row, Col, Tag, Space, Progress } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, WarningOutlined, AlertOutlined, DollarOutlined, BoxPlotOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;

const Stock = () => {
  const [articles, setArticles] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mouvementModalVisible, setMouvementModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [articlesList, setArticlesList] = useState([]);

  // Statistiques
  const [stats, setStats] = useState({
    articlesEnStock: 0,
    stockFaible: 0,
    stockCritique: 0,
    valeurStock: 0
  });

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      // Charger les articles (stock)
      const articlesResponse = await axios.get('http://localhost:8000/api/articles');
      const articlesData = articlesResponse.data.filter(a => a.type_article === 'PRODUIT');
      setArticles(articlesData);
      
      // Charger les mouvements
      const mouvementsResponse = await axios.get('http://localhost:8000/api/mouvements');
      setMouvements(mouvementsResponse.data.slice(0, 20)); // Limiter à 20

      // Charger la liste des articles pour le formulaire
      setArticlesList(articlesResponse.data);

      // Calculer statistiques
      calculerStatistiques(articlesData);
    } catch (error) {
      message.error('Erreur lors du chargement des données');
      console.error(error);
    }
    setLoading(false);
  };

  const calculerStatistiques = (data) => {
    const articlesEnStock = data.length;
    const stockFaible = data.filter(a => a.stock_actuel < a.stock_alerte && a.stock_actuel > 0).length;
    const stockCritique = data.filter(a => a.stock_actuel === 0 || a.stock_actuel === null).length;
    const valeurStock = data.reduce((sum, a) => sum + (a.stock_actuel || 0) * (a.prix_vente || 0), 0);

    setStats({
      articlesEnStock,
      stockFaible,
      stockCritique,
      valeurStock
    });
  };

  const ouvrirMouvementModal = (article = null) => {
    form.resetFields();
    if (article) {
      form.setFieldsValue({
        id_article: article.id_article
      });
    }
    setMouvementModalVisible(true);
  };

  const enregistrerMouvement = async (values) => {
    try {
      await axios.post('http://localhost:8000/api/mouvements', {
        ...values,
        date_mouvement: dayjs().format('YYYY-MM-DD')
      });
      message.success('Mouvement enregistré avec succès');
      setMouvementModalVisible(false);
      chargerDonnees();
    } catch (error) {
      message.error('Erreur lors de l\'enregistrement du mouvement');
      console.error(error);
    }
  };

  const rechercherArticles = () => {
    return articles.filter(a =>
      a.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getStockStatus = (article) => {
    const stock = article.stock_actuel || 0;
    const alerte = article.stock_alerte || 0;

    if (stock === 0) return { color: 'red', icon: <AlertOutlined />, text: 'Critique' };
    if (stock < alerte) return { color: 'orange', icon: <WarningOutlined />, text: 'Faible' };
    return { color: 'green', icon: <BoxPlotOutlined />, text: 'Normal' };
  };

  const columnsArticles = [
    {
      title: 'Article',
      dataIndex: 'designation',
      key: 'designation',
      width: 250,
      render: (text, record) => {
        const status = getStockStatus(record);
        return (
          <Space>
            <span style={{ fontSize: 20 }}>{status.icon}</span>
            <span>{text}</span>
          </Space>
        );
      }
    },
    {
      title: 'Stock',
      key: 'stock',
      width: 200,
      render: (_, record) => {
        const stock = record.stock_actuel || 0;
        const alerte = record.stock_alerte || 0;
        const percent = alerte > 0 ? Math.min((stock / (alerte * 2)) * 100, 100) : 0;
        const status = getStockStatus(record);

        return (
          <div>
            <div><strong>{stock}</strong> {record.unite || 'unités'}</div>
            <div style={{ fontSize: 12, color: '#888' }}>Seuil: {alerte}</div>
            <Progress 
              percent={percent} 
              size="small" 
              status={status.color === 'green' ? 'success' : status.color === 'orange' ? 'exception' : 'exception'}
              showInfo={false}
            />
          </div>
        );
      }
    },
    {
      title: 'Valeur',
      key: 'valeur',
      width: 150,
      render: (_, record) => `${((record.stock_actuel || 0) * (record.prix_vente || 0)).toLocaleString()} FCFA`
    },
    {
      title: 'Prix',
      dataIndex: 'prix_vente',
      key: 'prix_vente',
      width: 120,
      render: (val) => `${(val || 0).toLocaleString()} FCFA`
    },
    {
      title: 'Code',
      key: 'code',
      width: 100,
      render: (_, record) => `ART${String(record.id_article).padStart(4, '0')}`
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => ouvrirMouvementModal(record)}
        >
          + Mouvement
        </Button>
      )
    }
  ];

  const columnsMouvements = [
    {
      title: 'Article',
      dataIndex: 'article_nom',
      key: 'article_nom',
      width: 200,
      render: (text, record) => {
        const icon = record.article_type === 'PRODUIT' ? '📦' : '🔧';
        return `${icon} ${text}`;
      }
    },
    {
      title: 'Type',
      dataIndex: 'type_mouvement',
      key: 'type_mouvement',
      width: 100,
      render: (type) => (
        <Tag color={type === 'ENTREE' ? 'green' : 'red'}>
          {type === 'ENTREE' ? '📈 Entrée' : '📉 Sortie'}
        </Tag>
      )
    },
    {
      title: 'Quantité',
      dataIndex: 'quantite',
      key: 'quantite',
      width: 100,
      render: (qte, record) => {
        const color = record.type_mouvement === 'ENTREE' ? 'green' : 'red';
        const sign = record.type_mouvement === 'ENTREE' ? '+' : '-';
        return <span style={{ color }}>{sign}{qte}</span>;
      }
    },
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      ellipsis: true
    },
    {
      title: 'Date',
      dataIndex: 'date_mouvement',
      key: 'date_mouvement',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ fontSize: 32, marginBottom: 5 }}>Gestion des stocks</h1>
        <p style={{ color: '#888', fontSize: 16 }}>Surveillez et gérez vos niveaux de stock</p>
      </div>

      {/* Statistiques */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="📦 Articles en stock" 
              value={stats.articlesEnStock}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="⚠️ Stock faible" 
              value={stats.stockFaible}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="🚨 Stock critique" 
              value={stats.stockCritique}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="💰 Valeur stock" 
              value={stats.valeurStock}
              suffix="FCFA"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Barre de recherche */}
      <Card style={{ marginBottom: 20 }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input
            placeholder="Rechercher un article..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
          />
          <Button icon={<ReloadOutlined />} onClick={chargerDonnees}>
            Actualiser
          </Button>
        </Space>
      </Card>

      {/* Deux colonnes : Articles et Mouvements */}
      <Row gutter={16}>
        <Col span={14}>
          <Card title="📦 Articles en stock" style={{ height: '100%' }}>
            <Table
              columns={columnsArticles}
              dataSource={rechercherArticles()}
              loading={loading}
              rowKey="id_article"
              scroll={{ y: 500 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="📊 Mouvements récents" style={{ height: '100%' }}>
            <Table
              columns={columnsMouvements}
              dataSource={mouvements}
              loading={loading}
              rowKey="id_mouvement"
              scroll={{ y: 500 }}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Modal Mouvement */}
      <Modal
        title="Nouveau Mouvement de Stock"
        open={mouvementModalVisible}
        onCancel={() => setMouvementModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={enregistrerMouvement}>
          <Form.Item 
            name="id_article" 
            label="Article" 
            rules={[{ required: true, message: 'Veuillez sélectionner un article' }]}
          >
            <Select
              showSearch
              placeholder="Sélectionner un article"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {articlesList.map(a => (
                <Option key={a.id_article} value={a.id_article}>{a.designation}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item 
            name="type_mouvement" 
            label="Type de mouvement" 
            rules={[{ required: true, message: 'Veuillez sélectionner le type' }]}
          >
            <Select placeholder="Sélectionner le type">
              <Option value="ENTREE">Entrée (ajout stock)</Option>
              <Option value="SORTIE">Sortie (retrait stock)</Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="quantite" 
            label="Quantité" 
            rules={[{ required: true, message: 'Veuillez entrer la quantité' }]}
          >
            <Input type="number" min="1" placeholder="Entrez la quantité" />
          </Form.Item>

          <Form.Item name="reference" label="Motif (optionnel)">
            <Input placeholder="Ex: Achat, Vente, Inventaire, etc." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Enregistrer
              </Button>
              <Button onClick={() => setMouvementModalVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Stock;
