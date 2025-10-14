import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Card, Statistic, Row, Col, Tag, Space, Checkbox } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, CheckOutlined, CloseOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const Avoirs = () => {
  const [avoirs, setAvoirs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [articlesModalVisible, setArticlesModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedAvoir, setSelectedAvoir] = useState(null);
  const [clients, setClients] = useState([]);
  const [factures, setFactures] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    valides: 0
  });

  useEffect(() => {
    chargerAvoirs();
    chargerClients();
  }, []);

  const chargerAvoirs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/avoirs');
      setAvoirs(response.data);
      calculerStatistiques(response.data);
    } catch (error) {
      message.error('Erreur lors du chargement des avoirs');
      console.error(error);
    }
    setLoading(false);
  };

  const calculerStatistiques = (data) => {
    setStats({
      total: data.length,
      enAttente: data.filter(a => a.statut === 'EN_ATTENTE').length,
      valides: data.filter(a => a.statut === 'VALIDE').length
    });
  };

  const chargerClients = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const chargerFacturesClient = async (clientId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/factures?id_client=${clientId}`);
      setFactures(response.data);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    }
  };

  const chargerArticlesFacture = async (factureId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/factures/${factureId}/lignes`);
      setArticles(response.data);
    } catch (error) {
      console.error('Erreur chargement articles:', error);
    }
  };

  const ouvrirFormulaire = () => {
    setSelectedAvoir(null);
    form.resetFields();
    form.setFieldsValue({
      date_avoir: dayjs(),
      statut: 'EN_ATTENTE',
      montant_ht: 0,
      montant_ttc: 0
    });
    setModalVisible(true);
  };

  const modifierAvoir = (avoir) => {
    setSelectedAvoir(avoir);
    form.setFieldsValue({
      ...avoir,
      date_avoir: dayjs(avoir.date_avoir)
    });
    setModalVisible(true);
  };

  const validerAvoir = async (avoir) => {
    try {
      await axios.put(`http://localhost:8000/api/avoirs/${avoir.id_avoir}/valider`);
      message.success('Avoir validé et traité avec succès');
      chargerAvoirs();
    } catch (error) {
      message.error('Erreur lors de la validation');
      console.error(error);
    }
  };

  const annulerAvoir = async (avoir) => {
    try {
      await axios.put(`http://localhost:8000/api/avoirs/${avoir.id_avoir}`, {
        ...avoir,
        statut: 'REFUSE'
      });
      message.success('Avoir annulé');
      chargerAvoirs();
    } catch (error) {
      message.error('Erreur lors de l\'annulation');
    }
  };

  const supprimerAvoir = async (avoirId) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Êtes-vous sûr de vouloir supprimer cet avoir ?',
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:8000/api/avoirs/${avoirId}`);
          message.success('Avoir supprimé');
          chargerAvoirs();
        } catch (error) {
          message.error('Erreur lors de la suppression');
        }
      }
    });
  };

  const enregistrerAvoir = async (values) => {
    try {
      const data = {
        ...values,
        date_avoir: values.date_avoir.format('YYYY-MM-DD'),
        articles_selectionnes: selectedArticles
      };

      if (selectedAvoir) {
        await axios.put(`http://localhost:8000/api/avoirs/${selectedAvoir.id_avoir}`, data);
        message.success('Avoir modifié');
      } else {
        await axios.post('http://localhost:8000/api/avoirs', data);
        message.success('Avoir créé');
      }

      setModalVisible(false);
      chargerAvoirs();
    } catch (error) {
      message.error('Erreur lors de l\'enregistrement');
      console.error(error);
    }
  };

  const ouvrirSelectionArticles = async () => {
    const factureId = form.getFieldValue('id_facture');
    if (!factureId) {
      message.warning('Veuillez d\'abord sélectionner une facture');
      return;
    }
    await chargerArticlesFacture(factureId);
    setArticlesModalVisible(true);
  };

  const validerSelectionArticles = () => {
    const montantTotal = selectedArticles.reduce((sum, art) => sum + art.montant_ttc, 0);
    form.setFieldsValue({
      montant_ht: montantTotal / 1.095,
      montant_ttc: montantTotal
    });
    setArticlesModalVisible(false);
    message.success(`${selectedArticles.length} article(s) sélectionné(s)`);
  };

  const filtrerAvoirs = () => {
    let filtered = avoirs;

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.numero_avoir?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filtreStatut !== 'Tous') {
      filtered = filtered.filter(a => a.statut === filtreStatut);
    }

    return filtered;
  };

  const columns = [
    {
      title: 'N° Avoir',
      dataIndex: 'numero_avoir',
      key: 'numero_avoir',
      width: 120
    },
    {
      title: 'Date',
      dataIndex: 'date_avoir',
      key: 'date_avoir',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Client',
      dataIndex: 'client_nom',
      key: 'client_nom',
      width: 180,
      render: (text) => text || 'N/A'
    },
    {
      title: 'Montant HT',
      dataIndex: 'montant_ht',
      key: 'montant_ht',
      width: 120,
      render: (val) => `${(val || 0).toLocaleString()} FCFA`
    },
    {
      title: 'Montant TTC',
      dataIndex: 'montant_ttc',
      key: 'montant_ttc',
      width: 120,
      render: (val) => `${(val || 0).toLocaleString()} FCFA`
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 130,
      render: (statut) => {
        let color = 'default';
        if (statut === 'EN_ATTENTE') color = 'orange';
        if (statut === 'VALIDE') color = 'green';
        if (statut === 'REFUSE') color = 'red';
        if (statut === 'TRAITE') color = 'blue';
        return <Tag color={color}>{statut}</Tag>;
      }
    },
    {
      title: 'Motif',
      dataIndex: 'motif',
      key: 'motif',
      ellipsis: true
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => modifierAvoir(record)}
          />
          <Button
            icon={<CheckOutlined />}
            type="primary"
            size="small"
            onClick={() => validerAvoir(record)}
            disabled={record.statut === 'TRAITE'}
          />
          <Button
            icon={<CloseOutlined />}
            danger
            size="small"
            onClick={() => annulerAvoir(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            size="small"
            onClick={() => supprimerAvoir(record.id_avoir)}
          />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: 20 }}>💰 Gestion des Avoirs</h1>

      {/* Statistiques */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card>
            <Statistic title="📊 Total Avoirs" value={stats.total} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="⏳ En Attente" value={stats.enAttente} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="✅ Validés" value={stats.valides} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      {/* Barre de recherche */}
      <Card style={{ marginBottom: 20 }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="Rechercher un avoir..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              value={filtreStatut}
              onChange={setFiltreStatut}
              style={{ width: 150 }}
            >
              <Option value="Tous">Tous</Option>
              <Option value="EN_ATTENTE">En Attente</Option>
              <Option value="VALIDE">Validé</Option>
              <Option value="REFUSE">Refusé</Option>
              <Option value="TRAITE">Traité</Option>
            </Select>
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={chargerAvoirs}>
              Actualiser
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={ouvrirFormulaire}>
              Nouvel Avoir
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Tableau */}
      <Card>
        <Table
          columns={columns}
          dataSource={filtrerAvoirs()}
          loading={loading}
          rowKey="id_avoir"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Modal Formulaire */}
      <Modal
        title={selectedAvoir ? "Modifier Avoir" : "Nouvel Avoir"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={enregistrerAvoir}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="numero_avoir" label="N° Avoir" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date_avoir" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="id_client" label="Client" rules={[{ required: true }]}>
                <Select
                  showSearch
                  placeholder="Sélectionner un client"
                  onChange={chargerFacturesClient}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {clients.map(c => (
                    <Option key={c.id_client} value={c.id_client}>{c.nom}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="id_facture" label="Facture Référence" rules={[{ required: true }]}>
                <Select
                  placeholder="Sélectionner une facture"
                  onChange={(val) => form.setFieldsValue({ id_facture: val })}
                >
                  {factures.map(f => (
                    <Option key={f.id_facture} value={f.id_facture}>
                      {f.numero_facture} - {f.montant_ttc} FCFA
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="montant_ht" label="Montant HT">
                <Input type="number" step="0.01" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="montant_ttc" label="Montant TTC">
                <Input type="number" step="0.01" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="statut" label="Statut">
                <Select>
                  <Option value="EN_ATTENTE">En Attente</Option>
                  <Option value="VALIDE">Validé</Option>
                  <Option value="REFUSE">Refusé</Option>
                  <Option value="TRAITE">Traité</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="motif" label="Motif">
            <Input placeholder="Motif de l'avoir" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Description détaillée" />
          </Form.Item>

          <Button type="dashed" block onClick={ouvrirSelectionArticles} style={{ marginBottom: 16 }}>
            📦 Sélectionner les articles à rembourser
          </Button>

          {selectedArticles.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong>Articles sélectionnés :</strong>
              {selectedArticles.map((art, idx) => (
                <div key={idx}>• {art.designation} - Qté: {art.quantite} - {art.montant_ttc} FCFA</div>
              ))}
            </div>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                💾 Enregistrer
              </Button>
              <Button onClick={() => setModalVisible(false)}>Annuler</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Sélection Articles */}
      <Modal
        title="📦 Sélectionner les articles"
        open={articlesModalVisible}
        onCancel={() => setArticlesModalVisible(false)}
        onOk={validerSelectionArticles}
        width={700}
      >
        {articles.map((art, idx) => (
          <Card key={idx} style={{ marginBottom: 10 }} size="small">
            <Checkbox
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedArticles([...selectedArticles, art]);
                } else {
                  setSelectedArticles(selectedArticles.filter(a => a.id_article !== art.id_article));
                }
              }}
            >
              <strong>{art.designation}</strong> - Qté: {art.quantite} - Prix: {art.prix_unitaire} FCFA
            </Checkbox>
          </Card>
        ))}
      </Modal>
    </div>
  );
};

export default Avoirs;
