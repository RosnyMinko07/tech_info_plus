import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaSync, FaFileExport, FaPrint, FaFilePdf, FaCheck, FaEdit, FaTrash, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api, { devisService, formatMontant, formatDate, downloadPDF } from '../services/api';
import DevisFormModal from '../components/DevisFormModal';
import { generateDevisPDF } from '../services/pdfGenerator';
import { confirmDelete, confirmValidateDevis, confirmAction } from '../utils/sweetAlertHelper';
import '../styles/CommonPages.css';
import '../styles/Devis.css';

function Devis() {
    const [devisList, setDevisList] = useState([]);
    const [filteredDevis, setFilteredDevis] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingDevis, setEditingDevis] = useState(null);
    
    // Statistiques
    const [stats, setStats] = useState({
        total: 0,
        attente: 0,
        acceptes: 0,
        refuses: 0
    });

    useEffect(() => {
        loadDevis();
    }, []);

    useEffect(() => {
        filterDevis();
    }, [searchTerm, devisList]);

    const loadDevis = async () => {
        try {
            setLoading(true);
            console.log('📥 Chargement des devis...');
            const data = await devisService.getAll();
            console.log('📦 Devis reçus:', data);
            
            // Vérifier les montants du premier devis
            if (data && data.length > 0) {
                console.log('🔍 Premier devis détaillé:', {
                    numero: data[0].numero_devis,
                    montant_ht: data[0].montant_ht,
                    montant_ttc: data[0].montant_ttc,
                    total_ht: data[0].total_ht,
                    total_ttc: data[0].total_ttc
                });
            }
            
            setDevisList(data || []);
            calculateStats(data || []);
        } catch (error) {
            toast.error('Erreur lors du chargement des devis');
            console.error('❌ Erreur chargement devis:', error);
            setDevisList([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const stats = {
            total: data.length,
            attente: data.filter(d => d.statut === 'En attente').length,
            acceptes: data.filter(d => d.statut === 'Accepté').length,
            refuses: data.filter(d => d.statut === 'Refusé').length
        };
        setStats(stats);
    };

    const filterDevis = () => {
        if (!searchTerm) {
            setFilteredDevis(devisList);
            return;
        }
        
        const filtered = devisList.filter(devis => 
            devis.numero_devis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            devis.client_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            devis.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredDevis(filtered);
    };

    const handleAdd = () => {
        setEditingDevis(null);
        setShowForm(true);
    };

    const handleEdit = async (devis) => {
        try {
            const details = await devisService.getDetails(devis.id_devis);
            setEditingDevis(details);
            setShowForm(true);
        } catch (error) {
            toast.error('Erreur lors du chargement du devis');
            console.error(error);
        }
    };

    const handleAnnuler = async (devis) => {
        const confirmed = await confirmAction(
            'Annuler ce devis ?',
            `Voulez-vous annuler le devis ${devis.numero_devis} ?`,
            'Oui, annuler',
            'warning'
        );
        if (!confirmed) return;
        
        try {
            await devisService.annuler(devis.id_devis);
            toast.success('✅ Devis annulé avec succès');
            loadDevis();
        } catch (error) {
            toast.error('❌ Erreur lors de l\'annulation');
            console.error(error);
        }
    };

    const handleDelete = async (devis) => {
        const confirmed = await confirmDelete(`le devis "${devis.numero_devis}"`);
        if (!confirmed) return;
        
        try {
            await devisService.delete(devis.id_devis);
            toast.success('✅ Devis supprimé avec succès');
            loadDevis();
        } catch (error) {
            toast.error('❌ Erreur lors de la suppression');
            console.error(error);
        }
    };

    const handleValider = async (devis) => {
        const confirmed = await confirmValidateDevis(devis.numero_devis);
        if (!confirmed) return;
        
        try {
            await devisService.valider(devis.id_devis);
            toast.success('✅ Devis validé avec succès');
            loadDevis();
        } catch (error) {
            toast.error('❌ Erreur lors de la validation');
            console.error(error);
        }
    };

    const handleGeneratePDF = async (devis) => {
        try {
            toast.info('📄 Génération du PDF...');
            
            // Récupérer les détails du devis avec les lignes
            const { data: devisDetails } = await api.get(`/api/devis/${devis.id_devis}/details`);
            const lignes = devisDetails.lignes || [];
            
            if (lignes.length === 0) {
                console.warn('⚠️ Ce devis n\'a pas de lignes dans la base de données');
            }
            
            // Infos client
            const client = {
                nom: devis.client_nom || 'Client',
                adresse: devisDetails.client_adresse || '',
                telephone: devisDetails.client_telephone || '',
                email: devisDetails.client_email || '',
                nif: devisDetails.client_nif || ''
            };
            
            // Récupérer les infos de l'entreprise
            let entreprise = {
                nom: 'TECH INFO PLUS',
                adresse: 'Douala, Cameroun',
                telephone: '+237 XXX XX XX XX',
                email: 'contact@techinfoplus.com',
                nif: 'NIF123456789',
                logo_path: null
            };
            
            try {
                const { data: configData } = await api.get('/api/entreprise/config');
                if (configData) {
                    entreprise = {
                        nom: configData.nom || entreprise.nom,
                        adresse: configData.adresse || entreprise.adresse,
                        telephone: configData.telephone || entreprise.telephone,
                        email: configData.email || entreprise.email,
                        nif: configData.nif || entreprise.nif,
                        logo_path: configData.logo_path || null
                    };
                }
            } catch (e) {
                console.warn('⚠️ Impossible de charger la config entreprise:', e);
            }
            
            await generateDevisPDF(devisDetails, lignes, client, entreprise);
            toast.success('✅ PDF généré avec succès !');
            
        } catch (error) {
            toast.error('❌ Erreur lors de la génération du PDF');
            console.error('Erreur PDF:', error);
        }
    };

    const handleCreerFacture = async (devis) => {
        const confirmed = await confirmAction(
            'Créer une facture ?',
            `Créer une facture pour le devis <strong>${devis.numero_devis}</strong> ?`,
            'Oui, créer',
            'question'
        );
        if (!confirmed) return;
        
        try {
            window.location.href = `/facturation?from_devis=${devis.id_devis}`;
        } catch (error) {
            toast.error('❌ Erreur lors de la création de la facture');
            console.error(error);
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingDevis(null);
        loadDevis();
    };

    const handleExport = () => {
        try {
            const csvContent = generateCSV(filteredDevis);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `devis_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            toast.success('Export réussi');
        } catch (error) {
            toast.error('Erreur lors de l\'export');
        }
    };

    const generateCSV = (data) => {
        const headers = ['Numéro', 'Date', 'Client', 'Montant HT', 'Montant TTC', 'Statut', 'Validité'];
        const rows = data.map(d => [
            d.numero_devis,
            formatDate(d.date_devis),
            d.client_nom || 'N/A',
            d.montant_ht || 0,
            d.montant_ttc || 0,
            d.statut,
            d.validite || 30
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'Accepté': return '#10B981';
            case 'En attente': return '#F59E0B';
            case 'Refusé': return '#EF4444';
            case 'Annulé': return '#dc3545';
            default: return '#6B7280';
        }
    };

    const getFactureStatus = (devis) => {
        if (devis.facture_numero) {
            return (
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>
                    ✅ Oui<br />
                    <small>{devis.facture_numero}</small>
                </span>
            );
        }
        return <span style={{ color: '#EF4444', fontWeight: 'bold' }}>❌ Non</span>;
    };

    return (
        <div className="devis-container">
            {/* Header avec titre et sous-titre */}
            <div className="devis-header">
                <div>
                    <h1 className="devis-title">Gestion des devis</h1>
                    <p className="devis-subtitle">Créez et gérez vos devis</p>
                </div>
            </div>

            {/* Barre de contrôle */}
            <div className="devis-control-bar">
                <div className="search-group">
                    <input
                        type="text"
                        placeholder="Rechercher un devis..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button className="btn btn-icon">
                        <FaSearch />
                    </button>
                </div>
                
                <div className="action-buttons">
                    <button className="btn btn-success" onClick={handleAdd}>
                        <FaPlus /> Nouveau Devis
                    </button>
                    <button className="btn btn-secondary" onClick={loadDevis}>
                        <FaSync /> Actualiser
                    </button>
                </div>
            </div>

            {/* Cartes de statistiques avec icônes */}
            <div className="devis-stats-cards">
                <div className="devis-stat-card">
                    <div className="stat-icon">📄</div>
                    <div className="stat-label">Total devis</div>
                    <div className="stat-value" style={{ color: '#3B82F6' }}>{stats.total}</div>
                </div>
                
                <div className="devis-stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-label">En attente</div>
                    <div className="stat-value" style={{ color: '#F59E0B' }}>{stats.attente}</div>
                </div>
                
                <div className="devis-stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-label">Acceptés</div>
                    <div className="stat-value" style={{ color: '#10B981' }}>{stats.acceptes}</div>
                </div>
            </div>

            {/* Tableau des devis */}
            <div className="devis-table-container">
                {loading ? (
                    <div className="loading">Chargement...</div>
                ) : (
                    <table className="devis-table">
                        <thead>
                            <tr>
                                <th>DEVIS</th>
                                <th>CLIENT</th>
                                <th>MONTANT</th>
                                <th>STATUT</th>
                                <th>CRÉÉ PAR</th>
                                <th>FACTURÉ</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevis.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        Aucun devis trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredDevis.map(devis => (
                                    <tr key={devis.id_devis}>
                                        <td>
                                            <div>
                                                <strong>{devis.numero_devis}</strong><br />
                                                <small style={{ color: '#888' }}>{formatDate(devis.date_devis)}</small>
                                            </div>
                                        </td>
                                        <td>{devis.client_nom || 'N/A'}</td>
                                        <td>
                                            <strong>{formatMontant(devis.montant_ttc || devis.total_ttc || 0)}</strong>
                                        </td>
                                        <td>
                                            <span className="status-badge" style={{ 
                                                backgroundColor: getStatutColor(devis.statut),
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                {devis.statut}
                                            </span>
                                        </td>
                                        <td style={{ color: '#3B82F6', fontWeight: 'bold' }}>
                                            {devis.cree_par || 'Système'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {getFactureStatus(devis)}
                                        </td>
                                        <td>
                                            <div className="action-buttons-group" style={{ display: 'flex', gap: '5px', justifyContent: 'flex-start' }}>
                                                {/* Bouton Voir PDF */}
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleGeneratePDF(devis)}
                                                    title="Voir PDF"
                                                    style={{ backgroundColor: '#9333EA', color: 'white' }}
                                                >
                                                    <FaFilePdf />
                                                </button>
                                                
                                                {/* Bouton Valider (si en attente) */}
                                                {devis.statut === 'En attente' && (
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleValider(devis)}
                                                        title="Valider Devis"
                                                        style={{ backgroundColor: '#10B981', color: 'white' }}
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                )}
                                                
                                                {/* Bouton Créer Facture (si accepté et pas encore facturé) */}
                                                {devis.statut === 'Accepté' && !devis.facture_numero && (
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleCreerFacture(devis)}
                                                        title="Créer Facture"
                                                        style={{ backgroundColor: '#3B82F6', color: 'white' }}
                                                    >
                                                        <FaMoneyBillWave />
                                                    </button>
                                                )}
                                                
                                                {devis.statut !== 'Annulé' && (
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleEdit(devis)}
                                                    title="Modifier"
                                                    style={{ backgroundColor: '#F59E0B', color: 'white' }}
                                                >
                                                    <FaEdit />
                                                </button>
                                                )}
                                                
                                                {devis.statut !== 'Annulé' && (
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleAnnuler(devis)}
                                                        title="Annuler"
                                                        style={{ backgroundColor: '#dc3545', color: 'white' }}
                                                    >
                                                        ❌
                                                    </button>
                                                )}
                                                
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleDelete(devis)}
                                                    title="Supprimer"
                                                    style={{ backgroundColor: '#EF4444', color: 'white' }}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal du formulaire */}
            {showForm && (
                <DevisFormModal
                    devis={editingDevis}
                    onClose={() => {
                        setShowForm(false);
                        setEditingDevis(null);
                    }}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}

export default Devis;