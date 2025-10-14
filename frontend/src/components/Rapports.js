import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Table, Tag, Space, message, Row, Col, Statistic } from 'antd';
import { 
  FileTextOutlined, 
  BarChartOutlined, 
  UserOutlined, 
  ShoppingOutlined,
  DollarOutlined,
  WarningOutlined,
  BankOutlined,
  UndoOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;

const Rapports = () => {
  const [typeRapport, setTypeRapport] = useState('ventes');
  const [periode, setPeriode] = useState('ce_mois');
  const [loading, setLoading] = useState(false);
  const [donnees, setDonnees] = useState([]);

  useEffect(() => {
    chargerRapport();
  }, [typeRapport, periode]);

  const chargerRapport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/rapports/${typeRapport}`, {
        params: { periode }
      });
      
      // Extraire le tableau selon le type de rapport
      let data = [];
      if (typeRapport === 'ventes' && response.data.factures) {
        data = response.data.factures;
      } else if (typeRapport === 'clients' && response.data.clients) {
        data = response.data.clients;
      } else if (typeRapport === 'stock' && response.data.articles) {
        data = response.data.articles;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else {
        data = [];
      }
      
      setDonnees(data);
    } catch (error) {
      message.error('Erreur lors du chargement du rapport');
      console.error(error);
      setDonnees([]);
    }
    setLoading(false);
  };

  const exporterRapport = () => {
    message.info('Fonctionnalité d\'export en cours de développement');
  };

  // Colonnes pour rapport Ventes
  const colonnesVentes = [
    {
      title: 'N° Facture',
      dataIndex: 'numero_facture',
      key: 'numero_facture',
      width: 150
    },
    {
      title: 'Date',
      dataIndex: 'date_facture',
      key: 'date_facture',
      width: 120,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Client',
      dataIndex: 'id_client',
      key: 'id_client',
      width: 100
    },
    {
      title: 'Total HT',
      dataIndex: 'total_ht',
      key: 'total_ht',
      width: 120,
      render: (val) => `${(val || 0).toLocaleString()} FCFA`
    },
    {
      title: 'Total TTC',
      dataIndex: 'total_ttc',
      key: 'total_ttc',
      width: 120,
      render: (val) => <span style={{ fontWeight: 'bold', color: '#52c41a' }}>{(val || 0).toLocaleString()} FCFA</span>
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 120,
      render: (statut) => {
        let color = 'default';
        if (statut === 'Payée') color = 'green';
        if (statut === 'Impayée') color = 'red';
        if (statut === 'Partiellement payée') color = 'orange';
        return <Tag color={color}>{statut || 'N/A'}</Tag>;
      }
    }
  ];

  // Colonnes pour rapport Clients
  const colonnesClients = [
    {
      title: 'Client',
      dataIndex: 'nom',
      key: 'nom',
      width: 200
    },
    {
      title: 'Type',
      dataIndex: 'type_client',
      key: 'type_client',
      width: 120,
      render: (type) => <Tag>{type || 'N/A'}</Tag>
    },
    {
      title: 'Factures',
      dataIndex: 'nb_factures',
      key: 'nb_factures',
      width: 100
    },
    {
      title: 'Montant',
      dataIndex: 'montant_total',
      key: 'montant_total',
      render: (val) => `${(val || 0).toLocaleString()} FCFA`
    }
  ];

  // Colonnes pour rapport Produits
  const colonnesProduits = [
    {
      title: 'Produit',
      dataIndex: 'designation',
      key: 'designation',
      width: 200,
      render: (text, record) => {
        const icon = record.type_article === 'PRODUIT' ? '📦' : '🔧';
        return `${icon} ${text}`;
      }
    },
    {
      title: 'Type',
      dataIndex: 'type_article',
      key: 'type_article',
      width: 100
    },
    {
      title: 'Prix',
      dataIndex: 'prix_vente',
      key: 'prix_vente',
      width: 120,
      render: (val) => `${(val || 0).toLocaleString()} FCFA`
    },
    {
      title: 'Stock',
      dataIndex: 'stock_actuel',
      key: 'stock_actuel',
      width: 80
    },
    {
      title: 'Ventes',
      dataIndex: 'quantite_vendue',
      key: 'quantite_vendue',
      width: 100,
      render: (qte, record) => `${qte} (${record.nb_ventes})`
    },
    {
      title: 'Montant',
      dataIndex: 'montant_total',
      key: 'montant_total',
      render: (val) => `${(val || 0).toLocaleString()} FCFA`
    }
  ];

  // Colonnes pour rapport Règlements
  const colonnesReglements = [
    {
      title: 'Facture',
      dataIndex: 'numero_facture',
      key: 'numero_facture',
      width: 150
    },
    {
      title: 'Client',
      dataIndex: 'nom_client',
      key: 'nom_client',
      width: 180
    },
    {
      title: 'Date',
      dataIndex: 'date_reglement',
      key: 'date_reglement',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Montant',
      dataIndex: 'montant',
      key: 'montant',
      width: 120,
      render: (val) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{(val || 0).toLocaleString()} FCFA</span>
    },
    {
      title: 'Mode',
      dataIndex: 'mode_paiement',
      key: 'mode_paiement',
      width: 120,
      render: (mode) => <Tag color="blue">{mode || 'N/A'}</Tag>
    },
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      ellipsis: true
    }
  ];

  // Colonnes pour rapport Impayés
  const colonnesImpayes = [
    {
      title: 'Facture',
      dataIndex: 'numero_facture',
      key: 'numero_facture',
      width: 150
    },
    {
      title: 'Date',
      dataIndex: 'date_facture',
      key: 'date_facture',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Client',
      dataIndex: 'nom_client',
      key: 'nom_client',
      width: 180
    },
    {
      title: 'Total',
      dataIndex: 'montant_ttc',
      key: 'montant_ttc',
      width: 120,
      render: (val) => `${(val || 0).toLocaleString()} FCFA`
    },
    {
      title: 'Payé',
      dataIndex: 'montant_avance',
      key: 'montant_avance',
      width: 120,
      render: (val) => <span style={{ color: '#52c41a' }}>{(val || 0).toLocaleString()} FCFA</span>
    },
    {
      title: 'Reste',
      dataIndex: 'montant_reste',
      key: 'montant_reste',
      width: 120,
      render: (val) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{(val || 0).toLocaleString()} FCFA</span>
    }
  ];

  // Colonnes pour rapport Avoirs
  const colonnesAvoirs = [
    {
      title: 'Avoir',
      dataIndex: 'numero_avoir',
      key: 'numero_avoir',
      width: 150
    },
    {
      title: 'Facture',
      dataIndex: 'numero_facture',
      key: 'numero_facture',
      width: 150
    },
    {
      title: 'Client',
      dataIndex: 'nom_client',
      key: 'nom_client',
      width: 180
    },
    {
      title: 'Montant',
      dataIndex: 'montant_ttc',
      key: 'montant_ttc',
      width: 120,
      render: (val) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{(val || 0).toLocaleString()} FCFA</span>
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 120,
      render: (statut) => {
        let color = 'default';
        if (statut === 'TRAITE') color = 'green';
        if (statut === 'EN_ATTENTE') color = 'orange';
        return <Tag color={color}>{statut}</Tag>;
      }
    },
    {
      title: 'Date',
      dataIndex: 'date_avoir',
      key: 'date_avoir',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    }
  ];

  const getColonnes = () => {
    switch (typeRapport) {
      case 'ventes': return colonnesVentes;
      case 'clients': return colonnesClients;
      case 'produits': return colonnesProduits;
      case 'reglements': return colonnesReglements;
      case 'impayes': return colonnesImpayes;
      case 'avoirs': return colonnesAvoirs;
      default: return [];
    }
  };

  const getTotalCalcule = () => {
    if (!donnees || donnees.length === 0) return null;

    switch (typeRapport) {
      case 'reglements':
        return donnees.reduce((sum, r) => sum + (r.montant || 0), 0);
      case 'impayes':
        return donnees.reduce((sum, i) => sum + (i.montant_reste || 0), 0);
      case 'avoirs':
        return donnees.reduce((sum, a) => sum + (a.montant_ttc || 0), 0);
      default:
        return null;
    }
  };

  const rapportsDisponibles = [
    { value: 'ventes', label: '📈 Ventes', icon: <BarChartOutlined /> },
    { value: 'clients', label: '👥 Clients', icon: <UserOutlined /> },
    { value: 'produits', label: '📦 Produits', icon: <ShoppingOutlined /> },
    { value: 'reglements', label: '💰 Règlements', icon: <DollarOutlined /> },
    { value: 'impayes', label: '⚠️ Impayés', icon: <WarningOutlined /> },
    { value: 'tresorerie', label: '🏦 Trésorerie', icon: <BankOutlined /> },
    { value: 'avoirs', label: '🔄 Avoirs', icon: <UndoOutlined /> }
  ];

  const total = getTotalCalcule();

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: 20 }}>Rapports et Analyses</h1>

      {/* Barre de contrôle */}
      <Card style={{ marginBottom: 20 }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space>
            <span style={{ fontWeight: 'bold' }}>Période:</span>
            <Select value={periode} onChange={setPeriode} style={{ width: 180 }}>
              <Option value="aujourdhui">Aujourd'hui</Option>
              <Option value="cette_semaine">Cette semaine</Option>
              <Option value="ce_mois">Ce mois</Option>
              <Option value="cette_annee">Cette année</Option>
            </Select>
          </Space>
          <Space>
            <Button icon={<FileTextOutlined />} onClick={chargerRapport}>
              📊 Générer Rapport
            </Button>
            <Button onClick={exporterRapport}>
              📁 Exporter
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Boutons de sélection des rapports */}
      <Card title="📊 Sélectionner un rapport:" style={{ marginBottom: 20 }}>
        <Row gutter={[8, 8]}>
          {rapportsDisponibles.map(rapport => (
            <Col key={rapport.value} xs={24} sm={12} md={8} lg={6} xl={3}>
              <Button
                type={typeRapport === rapport.value ? 'primary' : 'default'}
                onClick={() => setTypeRapport(rapport.value)}
                block
                style={{ height: 'auto', padding: '8px' }}
              >
                {rapport.label}
              </Button>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Zone de résultats */}
      <Card 
        title={rapportsDisponibles.find(r => r.value === typeRapport)?.label || 'Rapport'}
        extra={total && (
          <Statistic 
            title={typeRapport === 'reglements' ? 'Total Règlements' : typeRapport === 'impayes' ? 'Total Impayé' : 'Total Avoirs'} 
            value={total} 
            suffix="FCFA"
            valueStyle={{ 
              color: typeRapport === 'reglements' ? '#52c41a' : '#ff4d4f',
              fontSize: 18
            }}
          />
        )}
      >
        <Table
          columns={getColonnes()}
          dataSource={donnees}
          loading={loading}
          rowKey={(record, index) => `${typeRapport}_${index}`}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
};

export default Rapports;
