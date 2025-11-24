import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, message, Upload } from 'antd';
import { BugOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;

const SignalementBug = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const signalement = {
        titre: values.titre,
        description: values.description,
        priorite: values.priorite,
        module_concerne: values.module,
        statut: 'NOUVEAU',
        date_signalement: new Date().toISOString().split('T')[0]
      };

      // Simuler l'envoi (à adapter avec votre endpoint)
      message.success('Bug signalé avec succès !');
      form.resetFields();
      setFileList([]);
      
      // TODO: Ajouter l'appel API réel
      // await axios.post('http://localhost:8000/api/bugs', signalement);
      
    } catch (error) {
      message.error('Erreur lors du signalement du bug');
      console.error(error);
    }
    setLoading(false);
  };

  const uploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: () => false, // Empêcher l'upload automatique
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 30, display: 'flex', alignItems: 'center' }}>
        <BugOutlined style={{ marginRight: 10, color: '#ff4d4f' }} />
        Signaler un Bug
      </h1>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            priorite: 'MOYENNE'
          }}
        >
          <Form.Item
            label="Titre du bug"
            name="titre"
            rules={[{ required: true, message: 'Veuillez saisir un titre' }]}
          >
            <Input 
              placeholder="Ex: Erreur lors de la création d'une facture" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Module concerné"
            name="module"
            rules={[{ required: true, message: 'Veuillez sélectionner un module' }]}
          >
            <Select placeholder="Sélectionner un module" size="large">
              <Option value="Dashboard">📊 Dashboard</Option>
              <Option value="Clients">👥 Clients</Option>
              <Option value="Fournisseurs">📦 Fournisseurs</Option>
              <Option value="Articles">🛍️ Articles</Option>
              <Option value="Devis">📄 Devis</Option>
              <Option value="Facturation">📃 Facturation</Option>
              <Option value="Règlements">💰 Règlements</Option>
              <Option value="Avoirs">🔄 Avoirs</Option>
              <Option value="Comptoir">🏪 Comptoir</Option>
              <Option value="Stock">📊 Stock</Option>
              <Option value="Utilisateurs">🔒 Utilisateurs</Option>
              <Option value="Rapports">📈 Rapports</Option>
              <Option value="Configuration">⚙️ Configuration</Option>
              <Option value="Autre">❓ Autre</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Priorité"
            name="priorite"
            rules={[{ required: true, message: 'Veuillez sélectionner une priorité' }]}
          >
            <Select size="large">
              <Option value="BASSE">
                <span style={{ color: '#52c41a' }}>🟢 Basse</span>
              </Option>
              <Option value="MOYENNE">
                <span style={{ color: '#faad14' }}>🟡 Moyenne</span>
              </Option>
              <Option value="HAUTE">
                <span style={{ color: '#ff4d4f' }}>🔴 Haute</span>
              </Option>
              <Option value="CRITIQUE">
                <span style={{ color: '#cf1322' }}>🚨 Critique</span>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Description détaillée"
            name="description"
            rules={[
              { required: true, message: 'Veuillez décrire le bug' },
              { min: 20, message: 'La description doit contenir au moins 20 caractères' }
            ]}
          >
            <TextArea
              rows={8}
              placeholder=""
            />
          </Form.Item>

          <Form.Item
            label="Captures d'écran / Fichiers (optionnel)"
            name="fichiers"
          >
            <Upload {...uploadProps} multiple>
              <Button icon={<UploadOutlined />}>
                Joindre des fichiers
              </Button>
            </Upload>
            <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
              Formats acceptés : PNG, JPG, PDF (Max 5 Mo par fichier)
            </div>
          </Form.Item>

          <Form.Item style={{ marginTop: 30, marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SendOutlined />}
              size="large"
              block
              style={{ height: 50 }}
            >
              Envoyer le signalement
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SignalementBug;

