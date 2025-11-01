import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaSync, FaEdit, FaTrash, FaCheck, FaTimes, FaPrint, FaFilePdf } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { avoirService, clientService, factureService, formatMontant, formatDate, downloadPDF } from '../services/api';
import { generateAvoirPDF } from '../services/pdfGenerator';
import AvoirFormModal from '../components/AvoirFormModal';
import { confirmDelete, confirmAction } from '../utils/sweetAlertHelper';
import '../styles/Avoirs.css';

function Avoirs() {
    const [avoirs, setAvoirs] = useState([]);
    const [filteredAvoirs, setFilteredAvoirs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Tous');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedAvoir, setSelectedAvoir] = useState(null);

    // Statistiques
    const [stats, setStats] = useState({
        total: 0,
        attente: 0,
        valides: 0,
        refuses: 0
    });

    useEffect(() => {
        loadAvoirs();
    }, []);

    useEffect(() => {
        filterAvoirs();
    }, [searchTerm, filterStatus, avoirs]);

    const loadAvoirs = async () => {
        try {
            setLoading(true);
            const data = await avoirService.getAll();
            setAvoirs(data || []);
            calculateStats(data || []);
        } catch (error) {
            console.error('Erreur chargement avoirs:', error);
            toast.error('Erreur lors du chargement des avoirs');
            setAvoirs([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const stats = {
            total: data.length,
            attente: data.filter(a => a.statut === 'EN_ATTENTE').length,
            valides: data.filter(a => a.statut === 'VALIDE').length,
            refuses: data.filter(a => a.statut === 'REFUSE').length
        };
        setStats(stats);
    };

    const filterAvoirs = () => {
        let filtered = avoirs;

        // Filtre par recherche
        if (searchTerm) {
            filtered = filtered.filter(a =>
                a.numero_avoir?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.client_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.motif?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtre par statut
        if (filterStatus !== 'Tous') {
            filtered = filtered.filter(a => a.statut === filterStatus);
        }

        setFilteredAvoirs(filtered);
    };

    const handleAdd = () => {
        setSelectedAvoir(null);
        setShowForm(true);
    };

    const handleEdit = async (avoir) => {
        try {
            const details = await avoirService.getDetails(avoir.id_avoir);
            setSelectedAvoir(details);
            setShowForm(true);
        } catch (error) {
            toast.error('Erreur lors du chargement de l\'avoir');
        }
    };

    const handleDelete = async (avoir) => {
        const confirmed = await confirmDelete(`l'avoir "${avoir.numero_avoir}"`);
        if (!confirmed) return;

        try {
            const id = avoir.id_avoir;
            await avoirService.delete(id);
            toast.success('Avoir supprimé avec succès');
            loadAvoirs();
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleValider = async (avoir) => {
        // Message de confirmation détaillé (comme Python ligne 1581)
        const confirmed = await confirmAction(
            'Valider l\'avoir ?',
            `Êtes-vous sûr de vouloir valider l'avoir <strong>${avoir.numero_avoir}</strong> ?<br><br>Cela va :<br>• Créer un remboursement de <strong>${formatMontant(avoir.montant_ttc || 0)}</strong><br>• Remettre les articles en stock<br>• Mettre à jour la facture associée<br>• Marquer l'avoir comme traité`,
            'Oui, valider',
            'question'
        );
        if (!confirmed) return;

        try{
            const response = await avoirService.valider(avoir.id_avoir);
            
            // Afficher un message de succès détaillé (comme Python ligne 1731)
            if (response.success) {
                const msg = `Avoir traité avec succès !\n\n• Remboursement : ${formatMontant(response.avoir.montant_ttc || 0)}\n• Nouveau statut facture : ${response.facture_nouveau_statut}\n• Solde restant : ${formatMontant(response.facture_solde_restant || 0)}\n\n💡 Allez dans Facturation et cliquez sur 'Actualiser' pour voir les changements`;
                toast.success(msg, { autoClose: 8000 });
            } else {
                toast.success('Avoir validé avec succès');
            }
            
            loadAvoirs();
        } catch (error) {
            console.error('Erreur validation:', error);
            toast.error(error.response?.data?.detail || 'Erreur lors de la validation');
        }
    };

    const handleRefuser = async (avoir) => {
        const confirmed = await confirmAction(
            'Refuser l\'avoir ?',
            'Cette action est irréversible.',
            'Oui, refuser',
            'warning'
        );
        if (!confirmed) return;

        try {
            const id = avoir.id_avoir;
            await avoirService.refuser(id);
            toast.success('Avoir refusé');
            loadAvoirs();
        } catch (error) {
            toast.error('Erreur lors du refus');
        }
    };

    const handleGeneratePDF = async (avoir) => {
        try {
            toast.info('Génération du PDF en cours...');
            
            // Récupérer les détails complets de l'avoir
            const response = await avoirService.getById(avoir.id_avoir);
            const avoirComplet = response.data;
            
            // Récupérer le client
            const clientResponse = await clientService.getById(avoirComplet.id_facture ? avoirComplet.facture?.id_client : null);
            const client = clientResponse?.data;
            
            // Récupérer la facture
            const factureResponse = avoirComplet.id_facture ? await factureService.getById(avoirComplet.id_facture) : null;
            const facture = factureResponse?.data;
            
            // Récupérer les lignes
            const lignes = avoirComplet.lignes || [];
            
            // Récupérer les infos entreprise (depuis la config ou valeurs par défaut)
            const entreprise = {
                nom: 'TECH INFO PLUS',
                adresse: 'Votre adresse',
                telephone: 'Votre téléphone',
                email: 'votre@email.com',
                logo: null // Ajouter le logo si disponible
            };
            
            // Générer le PDF
            await generateAvoirPDF(avoirComplet, lignes, client, facture, entreprise);
            
            toast.success('PDF généré avec succès');
        } catch (error) {
            console.error('Erreur génération PDF avoir:', error);
            toast.error('Erreur lors de la génération du PDF');
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedAvoir(null);
        loadAvoirs();
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'VALIDE': return '#10B981';
            case 'EN_ATTENTE': return '#F59E0B';
            case 'REFUSE': return '#EF4444';
            case 'TRAITE': return '#3B82F6';
            default: return '#6B7280';
        }
    };

    const getStatutLabel = (statut) => {
        const labels = {
            'EN_ATTENTE': 'En attente',
            'VALIDE': 'Validé',
            'REFUSE': 'Refusé',
            'TRAITE': 'Traité'
        };
        return labels[statut] || statut;
    };

    return (
        <div className="avoirs-container">
            {/* En-tête */}
            <div className="avoirs-header">
                <h1 className="avoirs-title">💰 Gestion des Avoirs</h1>
            </div>

            {/* Barre de recherche */}
            <div className="avoirs-search-bar">
                <div className="search-group">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Numéro d'avoir..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-group">
                    <label>Statut :</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="Tous">Tous</option>
                        <option value="EN_ATTENTE">En Attente</option>
                        <option value="VALIDE">Validé</option>
                        <option value="REFUSE">Refusé</option>
                        <option value="TRAITE">Traité</option>
                    </select>
                </div>

                <button className="btn btn-primary" onClick={loadAvoirs}>
                    <FaSync /> Actualiser
                </button>
            </div>

            {/* Cartes de statistiques */}
            <div className="avoirs-stats-cards">
                <div className="avoirs-stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-label">Total Avoirs</div>
                    <div className="stat-value" style={{ color: '#3B82F6' }}>{stats.total}</div>
                </div>

                <div className="avoirs-stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-label">En Attente</div>
                    <div className="stat-value" style={{ color: '#F59E0B' }}>{stats.attente}</div>
                </div>

                <div className="avoirs-stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-label">Validés</div>
                    <div className="stat-value" style={{ color: '#10B981' }}>{stats.valides}</div>
                </div>
            </div>

            {/* Boutons d'action */}
            <div className="avoirs-actions">
                <button className="btn btn-success" onClick={handleAdd}>
                    <FaPlus /> Nouvel Avoir
                </button>
            </div>

            {/* Tableau des avoirs */}
            <div className="avoirs-table-container">
                {loading ? (
                    <div className="loading">Chargement...</div>
                ) : (
                    <table className="avoirs-table">
                        <thead>
                            <tr>
                                        <th>N° AVOIR</th>
                                        <th>DATE</th>
                                        <th>CLIENT</th>
                                        <th>MONTANT</th>
                                        <th>STATUT</th>
                                        <th>MOTIF</th>
                                        <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAvoirs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        Aucun avoir trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredAvoirs.map(avoir => (
                                    <tr key={avoir.id_avoir}>
                                        <td>
                                            <strong>{avoir.numero_avoir}</strong>
                                        </td>
                                        <td>{formatDate(avoir.date_avoir)}</td>
                                        <td>{avoir.client_nom || 'N/A'}</td>
                                        <td>
                                            <strong>{formatMontant(avoir.montant_ttc || 0)}</strong>
                                        </td>
                                        <td>
                                            <span className="status-badge" style={{
                                                backgroundColor: getStatutColor(avoir.statut),
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                {getStatutLabel(avoir.statut)}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {avoir.motif || '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons-group">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleGeneratePDF(avoir)}
                                                    title="Générer PDF"
                                                    style={{ backgroundColor: '#9333EA', color: 'white' }}
                                                >
                                                    <FaFilePdf />
                                                </button>

                                                {avoir.statut === 'EN_ATTENTE' && (
                                                    <>
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => handleValider(avoir)}
                                                            title="Valider et traiter l'avoir (remboursement + stock)"
                                                            style={{ backgroundColor: '#10B981', color: 'white' }}
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => handleRefuser(avoir)}
                                                            title="Refuser"
                                                            style={{ backgroundColor: '#EF4444', color: 'white' }}
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </>
                                                )}

                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleEdit(avoir)}
                                                    title="Modifier"
                                                    style={{ backgroundColor: '#F59E0B', color: 'white' }}
                                                >
                                                    <FaEdit />
                                                </button>

                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleDelete(avoir)}
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
                <AvoirFormModal
                    avoir={selectedAvoir}
                    onClose={() => {
                        setShowForm(false);
                        setSelectedAvoir(null);
                    }}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}

export default Avoirs;