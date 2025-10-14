import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Tabs, Switch, Select, InputNumber, Divider } from 'antd';
import { SettingOutlined, SaveOutlined, ShopOutlined, LockOutlined, DollarOutlined, PrinterOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const Configuration = () => {
  const [formEntreprise] = Form.useForm();
  const [formSysteme] = Form.useForm();
  const [formFacturation] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [entreprise, setEntreprise] = useState(null);

  useEffect(() => {
    chargerConfiguration();
  }, []);

  const chargerConfiguration = async () => {
    setLoading(true);
    try {
      // TODO: Remplacer par l'endpoint réel
      const response = await axios.get('http://localhost:8000/api/configuration');
      
      if (response.data) {
        formEntreprise.setFieldsValue(response.data.entreprise);
        formSysteme.setFieldsValue(response.data.systeme);
        formFacturation.setFieldsValue(response.data.facturation);
        setEntreprise(response.data.entreprise);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      // Charger des valeurs par défaut
      formEntreprise.setFieldsValue({
        nom_entreprise: 'TECH INFO PLUS',
        slogan: 'Votre partenaire informatique',
        adresse: 'Libreville, Gabon',
        telephone: '+241 XX XX XX XX',
        email: 'contact@techinfoplus.ga',
        nif: '123456789',
        rccm: 'RCCM/123456',
        site_web: 'www.techinfoplus.ga'
      });
      
      formSysteme.setFieldsValue({
        devise: 'FCFA',
        langue: 'FR',
        fuseau_horaire: 'Africa/Libreville',
        mode_demo: false,
        sauvegardes_auto: true
      });
      
      formFacturation.setFieldsValue({
        tva: 18,
        precompte: 5,
        format_numero: 'FAC-YYYY-0001',
        validite_devis: 30,
        echeance_facture: 30
      });
    }
    setLoading(false);
  };

  const sauvegarderEntreprise = async (values) => {
    setLoading(true);
    try {
      // TODO: Remplacer par l'endpoint réel
      // await axios.put('http://localhost:8000/api/configuration/entreprise', values);
      message.success('Informations de l\'entreprise sauvegardées');
    } catch (error) {
      message.error('Erreur lors de la sauvegarde');
      console.error(error);
    }
    setLoading(false);
  };

  const sauvegarderSysteme = async (values) => {
    setLoading(true);
    try {
      // TODO: Remplacer par l'endpoint réel
      // await axios.put('http://localhost:8000/api/configuration/systeme', values);
      message.success('Paramètres système sauvegardés');
    } catch (error) {
      message.error('Erreur lors de la sauvegarde');
      console.error(error);
    }
    setLoading(false);
  };

  const sauvegarderFacturation = async (values) => {
    setLoading(true);
    try {
      // TODO: Remplacer par l'endpoint réel
      // await axios.put('http://localhost:8000/api/configuration/facturation', values);
      message.success('Paramètres de facturation sauvegardés');
    } catch (error) {
      message.error('Erreur lors de la sauvegarde');
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 30, display: 'flex', alignItems: 'center' }}>
        <SettingOutlined style={{ marginRight: 10, color: '#1890ff' }} />
        Configuration
      </h1>

      <Tabs defaultActiveKey="entreprise" size="large">
        {/* ENTREPRISE */}
        <TabPane
          tab={
            <span>
              <ShopOutlined />
              Entreprise
            </span>
          }
          key="entreprise"
        >
          <Card>
            <Form
              form={formEntreprise}
              layout="vertical"
              onFinish={sauvegarderEntreprise}
            >
              <h3>Informations générales</h3>
              <Divider />

              <Form.Item
                label="Nom de l'entreprise"
                name="nom_entreprise"
                rules={[{ required: true, message: 'Requis' }]}
              >
                <Input size="large" placeholder="Ex: TECH INFO PLUS" />
              </Form.Item>

              <Form.Item
                label="Slogan"
                name="slogan"
              >
                <Input size="large" placeholder="Ex: Votre partenaire informatique" />
              </Form.Item>

              <Form.Item
                label="Adresse"
                name="adresse"
                rules={[{ required: true, message: 'Requis' }]}
              >
                <TextArea rows={2} placeholder="Adresse complète" />
              </Form.Item>

              <Form.Item
                label="Téléphone"
                name="telephone"
                rules={[{ required: true, message: 'Requis' }]}
              >
                <Input size="large" placeholder="+241 XX XX XX XX" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Requis' },
                  { type: 'email', message: 'Email invalide' }
                ]}
              >
                <Input size="large" placeholder="contact@entreprise.com" />
              </Form.Item>

              <h3 style={{ marginTop: 30 }}>Informations légales</h3>
              <Divider />

              <Form.Item
                label="NIF (Numéro d'Identification Fiscale)"
                name="nif"
              >
                <Input size="large" placeholder="123456789" />
              </Form.Item>

              <Form.Item
                label="RCCM (Registre de Commerce)"
                name="rccm"
              >
                <Input size="large" placeholder="RCCM/123456" />
              </Form.Item>

              <Form.Item
                label="Site web"
                name="site_web"
              >
                <Input size="large" placeholder="www.entreprise.com" />
              </Form.Item>

              <Form.Item style={{ marginTop: 30 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Sauvegarder
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* SYSTÈME */}
        <TabPane
          tab={
            <span>
              <SettingOutlined />
              Système
            </span>
          }
          key="systeme"
        >
          <Card>
            <Form
              form={formSysteme}
              layout="vertical"
              onFinish={sauvegarderSysteme}
            >
              <h3>Paramètres généraux</h3>
              <Divider />

              <Form.Item
                label="Devise"
                name="devise"
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Option value="FCFA">FCFA (Franc CFA)</Option>
                  <Option value="EUR">EUR (Euro)</Option>
                  <Option value="USD">USD (Dollar)</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Langue"
                name="langue"
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Option value="FR">Français</Option>
                  <Option value="EN">English</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Fuseau horaire"
                name="fuseau_horaire"
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Option value="Africa/Libreville">Africa/Libreville (GMT+1)</Option>
                  <Option value="Africa/Douala">Africa/Douala (GMT+1)</Option>
                  <Option value="Europe/Paris">Europe/Paris (GMT+1)</Option>
                </Select>
              </Form.Item>

              <h3 style={{ marginTop: 30 }}>Fonctionnalités</h3>
              <Divider />

              <Form.Item
                label="Mode démonstration"
                name="mode_demo"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="Sauvegardes automatiques"
                name="sauvegardes_auto"
                valuePropName="checked"
              >
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item style={{ marginTop: 30 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Sauvegarder
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* FACTURATION */}
        <TabPane
          tab={
            <span>
              <DollarOutlined />
              Facturation
            </span>
          }
          key="facturation"
        >
          <Card>
            <Form
              form={formFacturation}
              layout="vertical"
              onFinish={sauvegarderFacturation}
            >
              <h3>Taux et taxes</h3>
              <Divider />

              <Form.Item
                label="TVA (%)"
                name="tva"
                rules={[{ required: true }]}
              >
                <InputNumber 
                  size="large"
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                  addonAfter="%"
                />
              </Form.Item>

              <Form.Item
                label="Précompte (%)"
                name="precompte"
                rules={[{ required: true }]}
              >
                <InputNumber 
                  size="large"
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                  addonAfter="%"
                />
              </Form.Item>

              <h3 style={{ marginTop: 30 }}>Format de numérotation</h3>
              <Divider />

              <Form.Item
                label="Format des numéros de facture"
                name="format_numero"
                rules={[{ required: true }]}
                help="Variables : YYYY (année), MM (mois), 0001 (numéro)"
              >
                <Input size="large" placeholder="FAC-YYYY-0001" />
              </Form.Item>

              <h3 style={{ marginTop: 30 }}>Échéances</h3>
              <Divider />

              <Form.Item
                label="Validité des devis (jours)"
                name="validite_devis"
                rules={[{ required: true }]}
              >
                <InputNumber 
                  size="large"
                  min={1}
                  max={365}
                  style={{ width: '100%' }}
                  addonAfter="jours"
                />
              </Form.Item>

              <Form.Item
                label="Échéance de paiement par défaut (jours)"
                name="echeance_facture"
                rules={[{ required: true }]}
              >
                <InputNumber 
                  size="large"
                  min={1}
                  max={365}
                  style={{ width: '100%' }}
                  addonAfter="jours"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 30 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Sauvegarder
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* IMPRESSION */}
        <TabPane
          tab={
            <span>
              <PrinterOutlined />
              Impression
            </span>
          }
          key="impression"
        >
          <Card>
            <h3>Paramètres d'impression</h3>
            <Divider />

            <Form layout="vertical">
              <Form.Item
                label="Format de page"
                name="format_page"
              >
                <Select size="large" defaultValue="A4">
                  <Option value="A4">A4</Option>
                  <Option value="A5">A5</Option>
                  <Option value="Letter">Letter</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Logo sur les documents"
                name="afficher_logo"
                valuePropName="checked"
              >
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item
                label="Pied de page personnalisé"
                name="pied_de_page"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Ex: Merci pour votre confiance"
                  defaultValue="Merci pour votre confiance"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 30 }}>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Sauvegarder
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* SÉCURITÉ */}
        <TabPane
          tab={
            <span>
              <LockOutlined />
              Sécurité
            </span>
          }
          key="securite"
        >
          <Card>
            <h3>Paramètres de sécurité</h3>
            <Divider />

            <Form layout="vertical">
              <Form.Item
                label="Déconnexion automatique (minutes)"
                name="timeout_session"
              >
                <InputNumber 
                  size="large"
                  min={5}
                  max={120}
                  defaultValue={30}
                  style={{ width: '100%' }}
                  addonAfter="min"
                />
              </Form.Item>

              <Form.Item
                label="Complexité minimale du mot de passe"
                name="complexite_mdp"
                valuePropName="checked"
              >
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item
                label="Authentification à deux facteurs"
                name="auth_2fa"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="Journal d'activité"
                name="logs_actifs"
                valuePropName="checked"
              >
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item style={{ marginTop: 30 }}>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Sauvegarder
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Configuration;

