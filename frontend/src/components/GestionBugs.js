import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, Space, Card, Statistic, Row, Col, message } from 'antd';
import { BugOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const GestionBugs = () => {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBug, setSelectedBug] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    chargerBugs();
  }, []);

  const chargerBugs = async () => {
    setLoading(true);
    try {
      // TODO: Remplacer par l'endpoint réel
      // const response = await axios.get('http://localhost:8000/api/bugs');
      // setBugs(response.data);
      
      // Données de démonstration
      setBugs([
        {
          id_bug: 1,
          titre: 'Erreur calcul TVA',
          description: 'La TVA n\'est pas calculée correctement sur les factures',
          priorite: 'HAUTE',
          statut: 'EN_COURS',
          module_concerne: 'Facturation',
          date_signalement: '2025-01-15',
          signale_par: 'admin'
        },
        {
          id_bug: 2,
          titre: 'Problème d\'affichage du stock',
          description: 'Le stock ne se met pas à jour après une vente',
          priorite: 'MOYENNE',
          statut: 'NOUVEAU',
          module_concerne: 'Stock',
          date_signalement: '2025-01-14',
          signale_par: 'caissier1'
        }
      ]);
      
    } catch (error) {
      message.error('Erreur lors du chargement des bugs');
      console.error(error);
    }
    setLoading(false);
  };

  const afficherDetails = (bug) => {
    setSelectedBug(bug);
    form.setFieldsValue({
      statut: bug.statut,
      priorite: bug.priorite,
      commentaire: bug.commentaire_admin || ''
    });
    setModalVisible(true);
  };

  const mettreAJourBug = async (values) => {
    try {
      // TODO: Appel API réel
      // await axios.put(`http://localhost:8000/api/bugs/${selectedBug.id_bug}`, values);
      
      message.success('Bug mis à jour avec succès');
      setModalVisible(false);
      chargerBugs();
    } catch (error) {
      message.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  const getPrioriteColor = (priorite) => {
    switch (priorite) {
      case 'BASSE': return 'green';
      case 'MOYENNE': return 'orange';
      case 'HAUTE': return 'red';
      case 'CRITIQUE': return 'volcano';
      default: return 'default';
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'NOUVEAU': return 'blue';
      case 'EN_COURS': return 'processing';
      case 'RESOLU': return 'success';
      case 'FERME': return 'default';
      default: return 'default';
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'NOUVEAU': return <ClockCircleOutlined />;
      case 'EN_COURS': return <ClockCircleOutlined />;
      case 'RESOLU': return <CheckCircleOutlined />;
      case 'FERME': return <CloseCircleOutlined />;
      default: return null;
    }
  };

  // Statistiques
  const stats = {
    total: bugs.length,
    nouveaux: bugs.filter(b => b.statut === 'NOUVEAU').length,
    enCours: bugs.filter(b => b.statut === 'EN_COURS').length,
    resolus: bugs.filter(b => b.statut === 'RESOLU').length
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id_bug',
      key: 'id_bug',
      width: 60,
      render: (id) => `#${id}`
    },
    {
      title: 'Titre',
      dataIndex: 'titre',
      key: 'titre',
      width: 250,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Module',
      dataIndex: 'module_concerne',
      key: 'module_concerne',
      width: 120,
      render: (module) => <Tag color="blue">{module}</Tag>
    },
    {
      title: 'Priorité',
      dataIndex: 'priorite',
      key: 'priorite',
      width: 100,
      render: (priorite) => (
        <Tag color={getPrioriteColor(priorite)}>
          {priorite}
        </Tag>
      )
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 120,
      render: (statut) => (
        <Tag color={getStatutColor(statut)} icon={getStatutIcon(statut)}>
          {statut.replace('_', ' ')}
        </Tag>
      )
    },
    {
      title: 'Signalé le',
      dataIndex: 'date_signalement',
      key: 'date_signalement',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Signalé par',
      dataIndex: 'signale_par',
      key: 'signale_par',
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => afficherDetails(record)}
          >
            Voir
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: 20, display: 'flex', alignItems: 'center' }}>
        <BugOutlined style={{ marginRight: 10, color: '#ff4d4f' }} />
        Gestion des Bugs
      </h1>

      {/* Statistiques */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Bugs"
              value={stats.total}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Nouveaux"
              value={stats.nouveaux}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="En cours"
              value={stats.enCours}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Résolus"
              value={stats.resolus}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={bugs}
          loading={loading}
          rowKey="id_bug"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total: ${total} bug(s)`
          }}
        />
      </Card>

      {/* Modal Détails */}
      <Modal
        title={
          <Space>
            <BugOutlined style={{ color: '#ff4d4f' }} />
            <span>Détails du Bug #{selectedBug?.id_bug}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedBug && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h3>{selectedBug.titre}</h3>
              <p style={{ color: '#8c8c8c', marginBottom: 10 }}>
                Signalé le {dayjs(selectedBug.date_signalement).format('DD/MM/YYYY')} par {selectedBug.signale_par}
              </p>
              <Space>
                <Tag color={getPrioriteColor(selectedBug.priorite)}>
                  {selectedBug.priorite}
                </Tag>
                <Tag color="blue">{selectedBug.module_concerne}</Tag>
              </Space>
            </div>

            <div style={{ marginBottom: 20, padding: 15, background: '#f5f5f5', borderRadius: 8 }}>
              <strong>Description :</strong>
              <p style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>
                {selectedBug.description}
              </p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={mettreAJourBug}
            >
              <Form.Item
                label="Statut"
                name="statut"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="NOUVEAU">Nouveau</Option>
                  <Option value="EN_COURS">En cours</Option>
                  <Option value="RESOLU">Résolu</Option>
                  <Option value="FERME">Fermé</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Priorité"
                name="priorite"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="BASSE">Basse</Option>
                  <Option value="MOYENNE">Moyenne</Option>
                  <Option value="HAUTE">Haute</Option>
                  <Option value="CRITIQUE">Critique</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Commentaire administrateur"
                name="commentaire"
              >
                <TextArea rows={4} placeholder="Ajoutez un commentaire ou une note..." />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setModalVisible(false)}>
                    Annuler
                  </Button>
                  <Button type="primary" htmlType="submit" icon={<EditOutlined />}>
                    Mettre à jour
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GestionBugs;

