import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaSync, FaEdit, FaTrash, FaUserShield, FaUserTie, FaUser, FaKey } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { utilisateurService, formatDate } from '../services/api';
import UtilisateurFormModal from '../components/UtilisateurFormModal';
import DroitsModal from '../components/DroitsModal';
import '../styles/Utilisateurs.css';
import { confirmDelete } from '../utils/sweetAlertHelper';

function Utilisateurs() {
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [filteredUtilisateurs, setFilteredUtilisateurs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDroitsModal, setShowDroitsModal] = useState(false);
    const [selectedUtilisateur, setSelectedUtilisateur] = useState(null);

    // Récupérer l'utilisateur connecté
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser.role === 'ADMIN' || currentUser.droits === 'TOUS';

    useEffect(() => {
        loadUtilisateurs();
    }, []);

    useEffect(() => {
        filterUtilisateurs();
    }, [searchTerm, utilisateurs]);

    const loadUtilisateurs = async () => {
        try {
            setLoading(true);
            const data = await utilisateurService.getAll();
            
            // Si pas admin, montrer seulement son propre compte
            if (!isAdmin) {
                const monCompte = data.filter(u => u.id_utilisateur === currentUser.id_utilisateur);
                setUtilisateurs(monCompte || []);
            } else {
                setUtilisateurs(data || []);
            }
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
            toast.error('Erreur lors du chargement des utilisateurs');
            setUtilisateurs([]);
        } finally {
            setLoading(false);
        }
    };

    const filterUtilisateurs = () => {
        if (!searchTerm) {
            setFilteredUtilisateurs(utilisateurs);
            return;
        }

        const filtered = utilisateurs.filter(u =>
            u.nom_utilisateur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.role?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUtilisateurs(filtered);
    };

    const handleAdd = () => {
        setSelectedUtilisateur(null);
        setShowForm(true);
    };

    const handleEdit = (utilisateur) => {
        setSelectedUtilisateur(utilisateur);
        setShowForm(true);
    };

    const handleDelete = async (utilisateur) => {
        const confirmed = await confirmDelete(`l'utilisateur "${utilisateur.nom_utilisateur}"`);
        if (!confirmed) return;

        try {
            await utilisateurService.delete(utilisateur.id_utilisateur);
            toast.success('✅ Utilisateur supprimé avec succès');
            loadUtilisateurs();
        } catch (error) {
            toast.error('❌ Erreur lors de la suppression');
        }
    };

    const handleGererDroits = (utilisateur) => {
        setSelectedUtilisateur(utilisateur);
        setShowDroitsModal(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedUtilisateur(null);
        loadUtilisateurs();
    };

    const handleDroitsSuccess = () => {
        setShowDroitsModal(false);
        setSelectedUtilisateur(null);
        loadUtilisateurs();
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'ADMIN': return <FaUserShield style={{ color: '#EF4444' }} />;
            case 'GESTIONNAIRE': return <FaUserTie style={{ color: '#3B82F6' }} />;
            case 'VENDEUR': return <FaUser style={{ color: '#10B981' }} />;
            default: return <FaUser style={{ color: '#6B7280' }} />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'ADMIN': return '#EF4444';
            case 'GESTIONNAIRE': return '#3B82F6';
            case 'VENDEUR': return '#10B981';
            default: return '#6B7280';
        }
    };

    const formatDroits = (droits) => {
        if (!droits || droits === 'TOUS') return '10/10';
        
        try {
            const droitsObj = typeof droits === 'string' ? JSON.parse(droits) : droits;
            const accordes = Object.values(droitsObj).filter(d => d === true).length;
            return `${accordes}/10`;
        } catch {
            return '0/10';
        }
    };

    return (
        <div className="utilisateurs-container">
            {/* En-tête */}
            <div className="utilisateurs-header">
                <h1 className="utilisateurs-title">
                    {isAdmin ? '👥 Gestion des Utilisateurs' : '👤 Mon Profil'}
                </h1>
            </div>

            {/* Barre de contrôle */}
            <div className="utilisateurs-control-bar">
                {isAdmin && (
                    <button className="btn btn-success" onClick={handleAdd}>
                        <FaPlus /> Nouvel Utilisateur
                    </button>
                )}

                <div className="search-group">
                    {isAdmin && <FaSearch />}
                    {isAdmin && (
                        <input
                            type="text"
                            placeholder="Nom, email ou rôle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    )}
                    <button className="btn btn-secondary" onClick={loadUtilisateurs}>
                        <FaSync /> Actualiser
                    </button>
                </div>
            </div>

            {/* Tableau des utilisateurs */}
            <div className="utilisateurs-table-container">
                {loading ? (
                    <div className="loading">Chargement...</div>
                ) : (
                    <table className="utilisateurs-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>UTILISATEUR</th>
                                <th>EMAIL</th>
                                <th>RÔLE</th>
                                <th>STATUT</th>
                                <th>DATE CRÉATION</th>
                                {isAdmin && <th>DROITS</th>}
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUtilisateurs.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? "8" : "7"} style={{ textAlign: 'center', padding: '40px' }}>
                                        Aucun utilisateur trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredUtilisateurs.map(utilisateur => (
                                    <tr key={utilisateur.id_utilisateur}>
                                        <td>
                                            <strong>{utilisateur.id_utilisateur}</strong>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {getRoleIcon(utilisateur.role)}
                                                <strong>{utilisateur.nom_utilisateur}</strong>
                                            </div>
                                        </td>
                                        <td>{utilisateur.email || '-'}</td>
                                        <td>
                                            <span className="role-badge" style={{
                                                backgroundColor: getRoleColor(utilisateur.role),
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                {utilisateur.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                color: utilisateur.actif ? '#10B981' : '#EF4444',
                                                fontWeight: 'bold'
                                            }}>
                                                {utilisateur.actif ? '✅ Actif' : '❌ Inactif'}
                                            </span>
                                        </td>
                                        <td>{formatDate(utilisateur.created_at)}</td>
                                        {isAdmin && (
                                            <td>
                                                <span style={{ 
                                                    color: '#3B82F6', 
                                                    fontWeight: 'bold',
                                                    fontSize: '14px'
                                                }}>
                                                    {formatDroits(utilisateur.droits)}
                                                </span>
                                            </td>
                                        )}
                                        <td>
                                            <div className="action-buttons-group">
                                                {isAdmin && (
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleGererDroits(utilisateur)}
                                                        title="Gérer les droits"
                                                        style={{ backgroundColor: '#8B5CF6', color: 'white' }}
                                                    >
                                                        <FaKey />
                                                    </button>
                                                )}

                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleEdit(utilisateur)}
                                                    title={isAdmin ? "Modifier" : "Modifier mon mot de passe"}
                                                    style={{ backgroundColor: '#F59E0B', color: 'white' }}
                                                >
                                                    <FaEdit />
                                                </button>

                                                {isAdmin && (
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleDelete(utilisateur)}
                                                        title="Supprimer"
                                                        style={{ backgroundColor: '#EF4444', color: 'white' }}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
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
                <UtilisateurFormModal
                    utilisateur={selectedUtilisateur}
                    onClose={() => {
                        setShowForm(false);
                        setSelectedUtilisateur(null);
                    }}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Modal Gestion des Droits */}
            {showDroitsModal && (
                <DroitsModal
                    utilisateur={selectedUtilisateur}
                    onClose={() => {
                        setShowDroitsModal(false);
                        setSelectedUtilisateur(null);
                    }}
                    onSuccess={handleDroitsSuccess}
                />
            )}
        </div>
    );
}

export default Utilisateurs;