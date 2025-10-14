import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { utilisateurService } from '../services/api';
import '../styles/Modal.css';

function DroitsModal({ utilisateur, onClose, onSuccess }) {
    const [droits, setDroits] = useState({
        gestion_utilisateurs: false,
        gestion_factures: false,
        gestion_clients: false,
        gestion_produits: false,
        gestion_stock: false,
        gestion_rapports: false,
        gestion_avoirs: false,
        gestion_reglements: false,
        gestion_comptoir: false,
        gestion_devis: false
    });

    const droitsLabels = {
        gestion_utilisateurs: 'Gestion des utilisateurs',
        gestion_factures: 'Gestion des factures',
        gestion_clients: 'Gestion des clients',
        gestion_produits: 'Gestion des produits',
        gestion_stock: 'Gestion du stock',
        gestion_rapports: 'Gestion des rapports',
        gestion_avoirs: 'Gestion des avoirs',
        gestion_reglements: 'Gestion des règlements',
        gestion_comptoir: 'Gestion du comptoir',
        gestion_devis: 'Gestion des devis'
    };

    useEffect(() => {
        if (utilisateur && utilisateur.droits) {
            try {
                const droitsData = typeof utilisateur.droits === 'string' 
                    ? JSON.parse(utilisateur.droits) 
                    : utilisateur.droits;
                
                if (droitsData && typeof droitsData === 'object') {
                    setDroits(droitsData);
                }
            } catch (error) {
                console.error('Erreur parsing droits:', error);
            }
        }
    }, [utilisateur]);

    const handleToggleDroit = (key) => {
        setDroits({
            ...droits,
            [key]: !droits[key]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await utilisateurService.updateDroits(utilisateur.id_utilisateur, droits);
            toast.success('Droits mis à jour avec succès !');
            onSuccess();
        } catch (error) {
            toast.error('Erreur lors de la mise à jour des droits');
            console.error(error);
        }
    };

    const handleSelectAll = () => {
        const allTrue = {};
        Object.keys(droits).forEach(key => {
            allTrue[key] = true;
        });
        setDroits(allTrue);
    };

    const handleDeselectAll = () => {
        const allFalse = {};
        Object.keys(droits).forEach(key => {
            allFalse[key] = false;
        });
        setDroits(allFalse);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>🔑 Gestion des droits - {utilisateur?.nom_utilisateur}</h2>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="droits-info">
                        <p style={{ color: '#94A3B8', marginBottom: '20px' }}>
                            Cochez les permissions que vous souhaitez accorder à cet utilisateur
                        </p>
                    </div>

                    <div className="droits-actions" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                        <button 
                            type="button" 
                            onClick={handleSelectAll}
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                            ✓ Tout cocher
                        </button>
                        <button 
                            type="button" 
                            onClick={handleDeselectAll}
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                            ✗ Tout décocher
                        </button>
                    </div>

                    <div className="droits-list">
                        {Object.entries(droitsLabels).map(([key, label]) => (
                            <div key={key} className="droit-item">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={droits[key] || false}
                                        onChange={() => handleToggleDroit(key)}
                                    />
                                    <span>{label}</span>
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Annuler
                        </button>
                        <button type="submit" className="btn btn-success">
                            Sauvegarder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DroitsModal;
