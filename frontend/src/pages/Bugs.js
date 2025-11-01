import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaBug, FaPlus, FaSync, FaEdit, FaTrash, FaTimes, FaCheck, FaLock, FaTools } from 'react-icons/fa';
import api from '../services/api';
import '../styles/Bugs.css';
import { confirmDelete, confirmAction } from '../utils/sweetAlertHelper';

// Utiliser l'instance API (URL dynamique)

function Bugs() {
  const [bugs, setBugs] = useState([]);
  const [filteredBugs, setFilteredBugs] = useState([]);
  const [stats, setStats] = useState({ total: 0, ouverts: 0, resolus_mois: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [filterPriorite, setFilterPriorite] = useState('Toutes');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingBug, setEditingBug] = useState(null);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    priorite: 'MOYENNE',
    statut: 'OUVERT'
  });

  useEffect(() => {
    loadBugs();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bugs, filterStatut, filterPriorite, searchTerm]);

  const loadBugs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bugs');
      setBugs(response.data);
    } catch (error) {
      console.error('Erreur chargement bugs:', error);
      toast.error('Erreur lors du chargement des bugs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/api/bugs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...bugs];

    // Filtre statut
    if (filterStatut !== 'Tous') {
      filtered = filtered.filter(bug => bug.statut === filterStatut);
    }

    // Filtre priorité
    if (filterPriorite !== 'Toutes') {
      filtered = filtered.filter(bug => bug.priorite === filterPriorite);
    }

    // Recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bug =>
        bug.titre.toLowerCase().includes(term) ||
        bug.description.toLowerCase().includes(term) ||
        bug.nom_utilisateur.toLowerCase().includes(term)
      );
    }

    setFilteredBugs(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titre || !formData.description) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (editingBug) {
        // Modification
        await api.put(`/api/bugs/${editingBug.id_signalement}`, formData);
        toast.success('Bug modifié avec succès');
      } else {
        // Création
        await api.post('/api/bugs', formData);
        toast.success('Bug créé avec succès');
      }

      closeModal();
      loadBugs();
      loadStats();
    } catch (error) {
      console.error('Erreur sauvegarde bug:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (bugId) => {
    const confirmed = await confirmDelete('ce signalement');
    if (!confirmed) return;

    try {
      await api.delete(`/api/bugs/${bugId}`);
      toast.success('✅ Bug supprimé avec succès');
      loadBugs();
      loadStats();
    } catch (error) {
      console.error('Erreur suppression bug:', error);
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  // 🔧 Marquer comme EN_COURS
  const handleMarquerEnCours = async (bug) => {
    try {
      await api.put(`/api/bugs/${bug.id_signalement}`, { ...bug, statut: 'EN_COURS' });
      toast.success('Bug marqué comme "En cours"');
      loadBugs();
      loadStats();
    } catch (error) {
      console.error('Erreur mise à jour bug:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // ✅ Marquer comme RÉSOLU
  const handleResoudre = async (bug) => {
    const confirmed = await confirmAction(
      'Marquer comme résolu ?',
      'Ce bug sera marqué comme résolu.',
      'Oui, résoudre',
      'question'
    );
    if (!confirmed) return;

    try {
      await api.put(`/api/bugs/${bug.id_signalement}`, { ...bug, statut: 'RESOLU', date_resolution: new Date().toISOString() });
      toast.success('✅ Bug résolu avec succès !');
      loadBugs();
      loadStats();
    } catch (error) {
      console.error('Erreur résolution bug:', error);
      toast.error('❌ Erreur lors de la résolution');
    }
  };

  // 🔒 Marquer comme FERMÉ
  const handleFermer = async (bug) => {
    const confirmed = await confirmAction(
      'Fermer définitivement ?',
      'Ce bug sera fermé définitivement.',
      'Oui, fermer',
      'warning'
    );
    if (!confirmed) return;

    try {
      await api.put(`/api/bugs/${bug.id_signalement}`, { ...bug, statut: 'FERME' });
      toast.success('🔒 Bug fermé');
      loadBugs();
      loadStats();
    } catch (error) {
      console.error('Erreur fermeture bug:', error);
      toast.error('❌ Erreur lors de la fermeture');
    }
  };

  const openModal = (bug = null) => {
    if (bug) {
      setEditingBug(bug);
      setFormData({
        titre: bug.titre,
        description: bug.description,
        priorite: bug.priorite,
        statut: bug.statut
      });
    } else {
      setEditingBug(null);
      setFormData({
        titre: '',
        description: '',
        priorite: 'MOYENNE',
        statut: 'OUVERT'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBug(null);
    setFormData({
      titre: '',
      description: '',
      priorite: 'MOYENNE',
      statut: 'OUVERT'
    });
  };

  const getPriorityColor = (priorite) => {
    switch (priorite) {
      case 'CRITIQUE': return '#E74C3C';
      case 'ELEVEE': return '#FF6B35';
      case 'MOYENNE': return '#FFD23F';
      case 'FAIBLE': return '#2ECC71';
      default: return '#3498DB';
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'OUVERT': return '#E74C3C';
      case 'EN_COURS': return '#FF6B35';
      case 'RESOLU': return '#2ECC71';
      case 'FERME': return '#95A5A6';
      default: return '#3498DB';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bugs-container">
      {/* Header */}
      <div className="bugs-header">
        <div className="header-left">
          <h1 className="bugs-title">
            <FaBug /> Gestion des Bugs
          </h1>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={() => openModal()}>
            <FaPlus /> Nouveau Bug
          </button>
          <button className="btn btn-secondary" onClick={loadBugs}>
            <FaSync /> Actualiser
          </button>
        </div>
      </div>

      {/* Filtres et Stats */}
      <div className="bugs-filters-stats">
        <div className="filters-section">
          <div className="filter-group">
            <label>Statut:</label>
            <select 
              value={filterStatut} 
              onChange={(e) => setFilterStatut(e.target.value)}
              className="filter-select"
            >
              <option>Tous</option>
              <option>OUVERT</option>
              <option>EN_COURS</option>
              <option>RESOLU</option>
              <option>FERME</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priorité:</label>
            <select 
              value={filterPriorite} 
              onChange={(e) => setFilterPriorite(e.target.value)}
              className="filter-select"
            >
              <option>Toutes</option>
              <option>CRITIQUE</option>
              <option>ELEVEE</option>
              <option>MOYENNE</option>
              <option>FAIBLE</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Rechercher:</label>
            <input
              type="text"
              placeholder="Titre ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-box">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-box stat-danger">
            <span className="stat-label">Ouverts:</span>
            <span className="stat-value">{stats.ouverts}</span>
          </div>
          <div className="stat-box stat-success">
            <span className="stat-label">Résolus:</span>
            <span className="stat-value">{stats.resolus_mois}</span>
          </div>
        </div>
      </div>

      {/* Liste des bugs */}
      <div className="bugs-list">
        {loading ? (
          <div className="loading">Chargement des bugs...</div>
        ) : filteredBugs.length === 0 ? (
          <div className="empty-state">
            <FaBug size={60} color="#95A5A6" />
            <p>Aucun bug trouvé</p>
          </div>
        ) : (
          filteredBugs.map((bug) => (
            <div key={bug.id_signalement} className="bug-card">
              <div 
                className="bug-priority-badge" 
                style={{ backgroundColor: getPriorityColor(bug.priorite) }}
              >
                {bug.priorite}
              </div>

              <div className="bug-content">
                <div className="bug-header-row">
                  <h3 className="bug-titre">{bug.titre}</h3>
                  <div 
                    className="bug-status-badge"
                    style={{ backgroundColor: getStatusColor(bug.statut) }}
                  >
                    {bug.statut}
                  </div>
                </div>

                <p className="bug-description">
                  {bug.description.length > 150 
                    ? bug.description.substring(0, 150) + '...' 
                    : bug.description}
                </p>

                <div className="bug-footer">
                  <div className="bug-info">
                    <span className="bug-user">
                      Par {bug.nom_utilisateur} ({bug.role})
                    </span>
                    <span className="bug-date">{formatDate(bug.date_signalement)}</span>
                  </div>

                  <div className="bug-actions">
                    {/* Boutons d'action selon le statut */}
                    {bug.statut === 'OUVERT' && (
                      <button 
                        className="btn-icon btn-en-cours"
                        onClick={() => handleMarquerEnCours(bug)}
                        title="Marquer comme En cours"
                      >
                        <FaTools />
                      </button>
                    )}
                    
                    {(bug.statut === 'OUVERT' || bug.statut === 'EN_COURS') && (
                      <button 
                        className="btn-icon btn-resoudre"
                        onClick={() => handleResoudre(bug)}
                        title="Marquer comme Résolu"
                      >
                        <FaCheck />
                      </button>
                    )}
                    
                    {bug.statut === 'RESOLU' && (
                      <button 
                        className="btn-icon btn-fermer"
                        onClick={() => handleFermer(bug)}
                        title="Fermer définitivement"
                      >
                        <FaLock />
                      </button>
                    )}
                    
                    <button 
                      className="btn-icon btn-edit"
                      onClick={() => openModal(bug)}
                      title="Modifier"
                    >
                      <FaEdit />
                    </button>
                    
                    <button 
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(bug.id_signalement)}
                      title="Supprimer"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBug ? 'Modifier le Bug' : 'Nouveau Bug'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Titre *</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Titre du bug..."
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description détaillée du problème..."
                  className="form-textarea"
                  rows="6"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priorité *</label>
                  <select
                    value={formData.priorite}
                    onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
                    className="form-select"
                  >
                    <option value="FAIBLE">FAIBLE</option>
                    <option value="MOYENNE">MOYENNE</option>
                    <option value="ELEVEE">ELEVEE</option>
                    <option value="CRITIQUE">CRITIQUE</option>
                  </select>
                </div>

                {editingBug && (
                  <div className="form-group">
                    <label>Statut *</label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                      className="form-select"
                    >
                      <option value="OUVERT">OUVERT</option>
                      <option value="EN_COURS">EN_COURS</option>
                      <option value="RESOLU">RESOLU</option>
                      <option value="FERME">FERME</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingBug ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bugs;



