import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaSync, FaEdit, FaTrash, FaFileExport, FaMoneyBillWave, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { reglementService, factureService, formatMontant, formatDate } from '../services/api';
import { confirmDelete } from '../utils/sweetAlertHelper';
import '../styles/Reglements.css';

function Reglements() {
    const [reglements, setReglements] = useState([]);
    const [filteredReglements, setFilteredReglements] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [reglementDetails, setReglementDetails] = useState(null);
    
    // Statistiques
    const [stats, setStats] = useState({
        total: 0,
        montant_total: 0,
        ce_mois: 0,
        attente: 0
    });

    // Formulaire
    const [formData, setFormData] = useState({
        id_facture: '',
        montant: '',
        mode_paiement: 'ESPECES',
        date_reglement: new Date().toISOString().split('T')[0],
        reference: '',
        notes: ''
    });

    const [factures, setFactures] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterReglements();
    }, [searchTerm, reglements]);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadReglements(),
                loadFactures()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadReglements = async () => {
        try {
            const data = await reglementService.getAll();
            setReglements(data || []);
            calculateStats(data || []);
        } catch (error) {
            console.error('Erreur chargement règlements:', error);
            toast.error('Erreur lors du chargement des règlements');
            setReglements([]);
        }
    };

    const loadFactures = async () => {
        try {
            const data = await factureService.getAll();
            // Filtrer uniquement les factures qui ne sont PAS entièrement payées
            const facturesNonPayees = (data || []).filter(f => {
                const montant_reste = parseFloat(f.montant_reste || 0);
                return montant_reste > 0 && f.statut !== 'Payée' && f.statut !== 'Annulée';
            });
            setFactures(facturesNonPayees);
        } catch (error) {
            console.error('Erreur chargement factures:', error);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const montant_total = data.reduce((sum, r) => sum + (r.montant || 0), 0);
        
        // Règlements du mois en cours
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const ce_mois = data.filter(r => {
            const date = new Date(r.date_reglement);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).reduce((sum, r) => sum + (r.montant || 0), 0);
        
        // En attente (statut si applicable)
        const attente = data.filter(r => r.statut === 'EN_ATTENTE').length;
        
        setStats({ total, montant_total, ce_mois, attente });
    };

    const filterReglements = () => {
        if (!searchTerm) {
            setFilteredReglements(reglements);
            return;
        }
        
        const filtered = reglements.filter(r =>
            r.facture_numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.mode_paiement?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredReglements(filtered);
    };

    const handleAdd = () => {
        setFormData({
            id_facture: '',
            montant: '',
            mode_paiement: 'ESPECES',
            date_reglement: new Date().toISOString().split('T')[0],
            reference: '',
            notes: ''
        });
        setShowForm(true);
    };

    const handleDelete = async (reglement) => {
        const confirmed = await confirmDelete(`le règlement de ${formatMontant(reglement.montant)}`);
        if (!confirmed) return;
        
        try {
            await reglementService.delete(reglement.id_reglement);
            toast.success('✅ Règlement supprimé avec succès');
            loadData();
        } catch (error) {
            toast.error('❌ Erreur lors de la suppression');
        }
    };

    const handleViewDetails = async (reglement) => {
        try {
            const details = await reglementService.getById(reglement.id_reglement);
            setReglementDetails(details);
            setShowDetails(true);
        } catch (error) {
            console.error('Erreur chargement détails:', error);
            toast.error('❌ Erreur lors du chargement des détails');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.id_facture || !formData.montant) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }
        
        // Vérifier si la facture sélectionnée est déjà entièrement payée
        const factureSelectionnee = factures.find(f => f.id_facture === parseInt(formData.id_facture));
        if (factureSelectionnee) {
            const montant_reste = parseFloat(factureSelectionnee.montant_reste || 0);
            if (montant_reste <= 0 || factureSelectionnee.statut === 'Payée') {
                toast.error('Cette facture est déjà entièrement payée. Impossible d\'ajouter un règlement.');
                return;
            }
            
            // Vérifier que le montant ne dépasse pas le reste à payer
            const montant_reglement = parseFloat(formData.montant);
            if (montant_reglement > montant_reste) {
                toast.error(`Le montant du règlement (${formatMontant(montant_reglement)}) dépasse le reste à payer (${formatMontant(montant_reste)})`);
                return;
            }
        }
        
        try {
            await reglementService.create({
                ...formData,
                id_facture: parseInt(formData.id_facture),
                montant: parseFloat(formData.montant)
            });
            
            toast.success('Règlement enregistré avec succès');
            setShowForm(false);
            loadData();
        } catch (error) {
            console.error('Erreur enregistrement règlement:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Erreur lors de l\'enregistrement du règlement';
            toast.error(errorMessage);
        }
    };

    const handleExport = () => {
        try {
            const csvContent = generateCSV(filteredReglements);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `reglements_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            toast.success('Export réussi');
        } catch (error) {
            toast.error('Erreur lors de l\'export');
        }
    };

    const generateCSV = (data) => {
        const headers = ['Date', 'Facture', 'Client', 'Montant', 'Mode Paiement', 'Référence'];
        const rows = data.map(r => [
            formatDate(r.date_reglement),
            r.facture_numero || 'N/A',
            r.client_nom || 'N/A',
            r.montant,
            r.mode_paiement,
            r.reference || '-'
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    };

    const getModeIcon = (mode) => {
        const icons = {
            'ESPECES': '💵',
            'CHEQUE': '🏦',
            'VIREMENT': '🏧',
            'CARTE': '💳',
            'MOBILE': '📱'
        };
        return icons[mode] || '💰';
    };

    return (
        <div className="reglements-container">
            {/* En-tête */}
            <div className="reglements-header">
                <h1 className="reglements-title">Gestion des Règlements</h1>
            </div>

            {/* Barre de contrôle */}
            <div className="reglements-control-bar">
                <div className="search-group">
                    <input
                        type="text"
                        placeholder="Rechercher un règlement..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                
                <div className="action-buttons">
                    <button className="btn btn-success" onClick={handleAdd}>
                        <FaPlus /> Nouveau Règlement
                    </button>
                    <button className="btn btn-secondary" onClick={loadData}>
                        <FaSync /> Actualiser
                    </button>
                    <button className="btn btn-primary" onClick={handleExport}>
                        <FaFileExport /> Exporter
                    </button>
                </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="reglements-stats-cards">
                <div className="reglements-stat-card">
                    <div className="stat-label">Total Règlements</div>
                    <div className="stat-value" style={{ color: '#3B82F6' }}>{stats.total}</div>
                </div>
                
                <div className="reglements-stat-card">
                    <div className="stat-label">Montant Total</div>
                    <div className="stat-value" style={{ color: '#10B981' }}>
                        {formatMontant(stats.montant_total)}
                    </div>
                </div>
                
                <div className="reglements-stat-card">
                    <div className="stat-label">Ce Mois</div>
                    <div className="stat-value" style={{ color: '#F59E0B' }}>
                        {formatMontant(stats.ce_mois)}
                    </div>
                </div>
                
                <div className="reglements-stat-card">
                    <div className="stat-label">En Attente</div>
                    <div className="stat-value" style={{ color: '#EF4444' }}>{stats.attente}</div>
                </div>
            </div>

            {/* Tableau des règlements */}
            <div className="reglements-table-container">
                {loading ? (
                    <div className="loading">Chargement...</div>
                ) : (
                    <table className="reglements-table">
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>FACTURE</th>
                                <th>CLIENT</th>
                                <th>MONTANT</th>
                                <th>MODE PAIEMENT</th>
                                <th>RÉFÉRENCE</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReglements.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        Aucun règlement trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredReglements.map(reglement => (
                                    <tr key={reglement.id_reglement}>
                                        <td>{formatDate(reglement.date_reglement)}</td>
                                        <td>
                                            <strong>{reglement.facture_numero || 'N/A'}</strong>
                                        </td>
                                        <td>{reglement.client_nom || 'N/A'}</td>
                                        <td>
                                            <strong style={{ color: '#10B981' }}>
                                                {formatMontant(reglement.montant || 0)}
                                            </strong>
                                        </td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {getModeIcon(reglement.mode_paiement)}
                                                {reglement.mode_paiement}
                                            </span>
                                        </td>
                                        <td>{reglement.reference || '-'}</td>
                                        <td>
                                            <div className="action-buttons-group">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleViewDetails(reglement)}
                                                    title="Voir les détails"
                                                    style={{ backgroundColor: '#3B82F6', color: 'white' }}
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleDelete(reglement)}
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

            {/* Modal Formulaire */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>💰 Nouveau Règlement</h2>
                            <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label>Facture *</label>
                                <select
                                    value={formData.id_facture}
                                    onChange={(e) => setFormData({ ...formData, id_facture: e.target.value })}
                                    className="form-control"
                                    required
                                >
                                    <option value="">Sélectionner une facture</option>
                                    {factures.map(facture => (
                                        <option key={facture.id_facture} value={facture.id_facture}>
                                            {facture.numero_facture} - {facture.client_nom} - Reste: {formatMontant(facture.montant_reste || 0)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Montant *</label>
                                <input
                                    type="number"
                                    value={formData.montant}
                                    onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                                    className="form-control"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Mode de Paiement *</label>
                                <select
                                    value={formData.mode_paiement}
                                    onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value })}
                                    className="form-control"
                                    required
                                >
                                    <option value="ESPECES">💵 Espèces</option>
                                    <option value="CHEQUE">🏦 Chèque</option>
                                    <option value="VIREMENT">🏧 Virement</option>
                                    <option value="CARTE">💳 Carte Bancaire</option>
                                    <option value="MOBILE">📱 Mobile Money</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Date de Règlement *</label>
                                <input
                                    type="date"
                                    value={formData.date_reglement}
                                    onChange={(e) => setFormData({ ...formData, date_reglement: e.target.value })}
                                    className="form-control"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Référence</label>
                                <input
                                    type="text"
                                    value={formData.reference}
                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                    className="form-control"
                                    placeholder="N° de chèque, transaction..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="form-control"
                                    rows="3"
                                    placeholder="Notes supplémentaires..."
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-success">
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Détails Règlement */}
            {showDetails && reglementDetails && (
                <div className="modal-overlay" onClick={() => setShowDetails(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px'}}>
                        <div className="modal-header">
                            <h2>💰 Détails du Règlement</h2>
                            <button className="btn-close" onClick={() => setShowDetails(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="client-details">
                                <div className="details-section">
                                    <h3>💵 Informations du Règlement</h3>
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <label>Montant:</label>
                                            <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '18px' }}>
                                                {formatMontant(reglementDetails.montant)}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Mode de paiement:</label>
                                            <span>{reglementDetails.mode_paiement}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Date du règlement:</label>
                                            <span>{formatDate(reglementDetails.date_reglement)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Référence:</label>
                                            <span>{reglementDetails.reference || 'Non renseignée'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Date de création:</label>
                                            <span>{formatDate(reglementDetails.created_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                {reglementDetails.facture && (
                                    <div className="details-section">
                                        <h3>📄 Informations de la Facture</h3>
                                        <div className="details-grid">
                                            <div className="detail-item">
                                                <label>Numéro facture:</label>
                                                <span>{reglementDetails.facture.numero_facture}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Date facture:</label>
                                                <span>{formatDate(reglementDetails.facture.date_facture)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Montant HT:</label>
                                                <span>{formatMontant(reglementDetails.facture.montant_ht)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Montant TTC:</label>
                                                <span>{formatMontant(reglementDetails.facture.montant_ttc)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Statut:</label>
                                                <span>{reglementDetails.facture.statut}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {reglementDetails.client && (
                                    <div className="details-section">
                                        <h3>👤 Informations du Client</h3>
                                        <div className="details-grid">
                                            <div className="detail-item">
                                                <label>Nom:</label>
                                                <span>{reglementDetails.client.nom}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Téléphone:</label>
                                                <span>{reglementDetails.client.telephone || 'Non renseigné'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Email:</label>
                                                <span>{reglementDetails.client.email || 'Non renseigné'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-primary" onClick={() => setShowDetails(false)}>
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Reglements;