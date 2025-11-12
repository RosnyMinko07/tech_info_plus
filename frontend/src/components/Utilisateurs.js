import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Card, Tag, Space, Checkbox, Divider } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, CheckSquareOutlined, CloseSquareOutlined } from '@ant-design/icons';
import { utilisateurService } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const Utilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [droitsModalVisible, setDroitsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [droitsForm] = Form.useForm();
  const [selectedUtilisateur, setSelectedUtilisateur] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const DROITS_LIST = [
    { key: 'gestion_utilisateurs', label: 'Gestion des utilisateurs' },
    { key: 'gestion_factures', label: 'Gestion des factures' },
    { key: 'gestion_clients', label: 'Gestion des clients' },
    { key: 'gestion_produits', label: 'Gestion des produits' },
    { key: 'gestion_stock', label: 'Gestion du stock' },
    { key: 'gestion_rapports', label: 'Gestion des rapports' },
    { key: 'gestion_avoirs', label: 'Gestion des avoirs' },
    { key: 'gestion_reglements', label: 'Gestion des règlements' },
    { key: 'gestion_comptoir', label: 'Gestion du comptoir' },
    { key: 'gestion_devis', label: 'Gestion des devis' }
  ];

  useEffect(() => {
    chargerUtilisateurs();
  }, []);

  const chargerUtilisateurs = async () => {
    setLoading(true);
    try {
      const response = await utilisateurService.getAll();
      setUtilisateurs(response || []);
    } catch (error) {
      message.error('Erreur lors du chargement des utilisateurs');
      console.error(error);
    }
    setLoading(false);
  };

  const ouvrirFormulaire = () => {
    setSelectedUtilisateur(null);
    form.resetFields();
    form.setFieldsValue({ role: 'VENDEUR', statut: 'ACTIF' });
    setModalVisible(true);
  };

  const modifierUtilisateur = (utilisateur) => {
    setSelectedUtilisateur(utilisateur);
    form.setFieldsValue({
      nom_utilisateur: utilisateur.nom_utilisateur,
      email: utilisateur.email,
      role: utilisateur.role,
      statut: utilisateur.actif ? 'ACTIF' : 'INACTIF'
    });
    setModalVisible(true);
  };

  const supprimerUtilisateur = async (utilisateurId, nom) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${nom}" ?`,
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:8000/api/utilisateurs/${utilisateurId}`);
          message.success('Utilisateur supprimé');
          chargerUtilisateurs();
        } catch (error) {
          message.error('Erreur lors de la suppression');
        }
      }
    });
  };

  const enregistrerUtilisateur = async (values) => {
    try {
      const data = {
        ...values,
        actif: values.statut === 'ACTIF' ? 1 : 0
      };

      if (selectedUtilisateur) {
        await utilisateurService.update(selectedUtilisateur.id_utilisateur, data);
        message.success('Utilisateur modifié');
      } else {
        await utilisateurService.create(data);
        message.success('Utilisateur créé');
      }

      setModalVisible(false);
      chargerUtilisateurs();
    } catch (error) {
      message.error('Erreur lors de l\'enregistrement');
      console.error(error);
    }
  };

  const ouvrirGestionDroits = (utilisateur) => {
    setSelectedUtilisateur(utilisateur);
    
    // Parser les droits existants
    let droits = {};
    try {
      if (utilisateur.droits === 'TOUS') {
        droits = DROITS_LIST.reduce((acc, item) => ({ ...acc, [item.key]: true }), {});
      } else if (utilisateur.droits) {
        droits = typeof utilisateur.droits === 'string'
          ? JSON.parse(utilisateur.droits)
          : utilisateur.droits;
      }
    } catch (e) {
      droits = {};
    }
    const valeurs = DROITS_LIST.reduce((acc, item) => ({
      ...acc,
      [item.key]: droits[item.key] || false
    }), {});
    droitsForm.setFieldsValue(valeurs);

    setDroitsModalVisible(true);
  };

  const enregistrerDroits = async (values) => {
    try {
      await utilisateurService.updateDroits(selectedUtilisateur.id_utilisateur, values);
      message.success('Droits mis à jour');
      setDroitsModalVisible(false);
      chargerUtilisateurs();
    } catch (error) {
      message.error('Erreur lors de la mise à jour des droits');
      console.error('Erreur droits:', error);
    }
  };

  const handleSelectAllDroits = () => {
    const valeurs = DROITS_LIST.reduce((acc, item) => ({ ...acc, [item.key]: true }), {});
    droitsForm.setFieldsValue(valeurs);
  };

  const handleUnselectAllDroits = () => {
    const valeurs = DROITS_LIST.reduce((acc, item) => ({ ...acc, [item.key]: false }), {});
    droitsForm.setFieldsValue(valeurs);
  };

  const formaterDroits = (droitsJson) => {
    try {
      if (!droitsJson) return '0/0';
      let droits = {};
      if (droitsJson === 'TOUS') {
        droits = DROITS_LIST.reduce((acc, item) => ({ ...acc, [item.key]: true }), {});
      } else {
        droits = typeof droitsJson === 'string' ? JSON.parse(droitsJson) : droitsJson;
      }
      const accordes = Object.values(droits).filter(v => v).length;
      const total = DROITS_LIST.length;
      return `${accordes}/${total}`;
    } catch {
      return '0/0';
    }
  };

  const columns = [
      });
      message.success('Droits mis à jour');
      setDroitsModalVisible(false);
      chargerUtilisateurs();
    } catch (error) {
      message.error('Erreur lors de la mise à jour des droits');
      console.error('Erreur droits:', error);
    }
  };

  const filtrerUtilisateurs = () => {
    return utilisateurs.filter(u =>
      u.nom_utilisateur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const generateDroitsCheckboxes = () => (
    DROITS_LIST.map((item) => (
      <Form.Item key={item.key} name={item.key} valuePropName="checked">
        <Checkbox>{item.label}</Checkbox>
      </Form.Item>
    ))
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id_utilisateur',
      key: 'id_utilisateur',
      width: 80
    },
    {
      title: 'Nom',
      dataIndex: 'nom_utilisateur',
      key: 'nom_utilisateur',
      width: 150
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (role) => <Tag color="blue">{role}</Tag>
    },
    {
      title: 'Statut',
      key: 'statut',
      width: 100,
      render: (_, record) => {
        const actif = record.actif === 1 || record.actif === true;
        return <Tag color={actif ? 'green' : 'red'}>{actif ? 'ACTIF' : 'INACTIF'}</Tag>;
      }
    },
    {
      title: 'Date Création',
      dataIndex: 'date_creation',
      key: 'date_creation',
      width: 130,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'
    },
    {
      title: 'Droits',
      dataIndex: 'droits',
      key: 'droits',
      width: 100,
      render: (droits) => formaterDroits(droits)
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
            onClick={() => modifierUtilisateur(record)}
          />
          <Button
            icon={<LockOutlined />}
            size="small"
            type="primary"
            onClick={() => ouvrirGestionDroits(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => supprimerUtilisateur(record.id_utilisateur, record.nom_utilisateur)}
          />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: 20 }}>👥 Gestion des Utilisateurs</h1>

      {/* Barre de contrôle */}
      <Card style={{ marginBottom: 20 }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="Rechercher (nom, email, rôle)..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={chargerUtilisateurs}>
              Actualiser
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={ouvrirFormulaire}>
              Nouvel Utilisateur
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Tableau */}
      <Card>
        <Table
          columns={columns}
          dataSource={filtrerUtilisateurs()}
          loading={loading}
          rowKey="id_utilisateur"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Modal Formulaire Utilisateur */}
      <Modal
        title={selectedUtilisateur ? "Modifier Utilisateur" : "Nouvel Utilisateur"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={enregistrerUtilisateur}>
          <Form.Item 
            name="nom_utilisateur" 
            label="Nom d'utilisateur" 
            rules={[{ required: true, message: 'Le nom est requis' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item 
            name="email" 
            label="Email" 
            rules={[
              { required: true, message: 'L\'email est requis' },
              { type: 'email', message: 'Email invalide' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item 
            name="mot_de_passe" 
            label={selectedUtilisateur ? "Nouveau mot de passe (laisser vide pour conserver)" : "Mot de passe"}
            rules={selectedUtilisateur ? [] : [{ required: true, message: 'Le mot de passe est requis' }]}
          >
            <Input.Password 
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item 
            name="role" 
            label="Rôle" 
            rules={[{ required: true, message: 'Le rôle est requis' }]}
          >
            <Select>
              <Option value="ADMIN">Administrateur</Option>
              <Option value="GESTIONNAIRE">Gestionnaire</Option>
              <Option value="VENDEUR">Vendeur</Option>
              <Option value="COMPTABLE">Comptable</Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="statut" 
            label="Statut" 
            rules={[{ required: true, message: 'Le statut est requis' }]}
          >
            <Select>
              <Option value="ACTIF">Actif</Option>
              <Option value="INACTIF">Inactif</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                💾 Enregistrer
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Gestion des Droits */}
      <Modal
        title={`🔐 Gestion des droits - ${selectedUtilisateur?.nom_utilisateur}`}
        open={droitsModalVisible}
        onCancel={() => setDroitsModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={droitsForm} layout="vertical" onFinish={enregistrerDroits}>
          <Space style={{ marginBottom: 12 }}>
            <Button icon={<CheckSquareOutlined />} onClick={handleSelectAllDroits}>
              Tout cocher
            </Button>
            <Button icon={<CloseSquareOutlined />} onClick={handleUnselectAllDroits}>
              Tout décocher
            </Button>
          </Space>
          <Divider style={{ margin: '12px 0' }} />
          {generateDroitsCheckboxes()}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Sauvegarder
              </Button>
              <Button onClick={() => setDroitsModalVisible(false)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Utilisateurs;
