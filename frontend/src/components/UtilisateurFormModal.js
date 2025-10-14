import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { utilisateurService } from '../services/api';
import '../styles/Modal.css';

function UtilisateurFormModal({ utilisateur, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        nom_utilisateur: '',
        mot_de_passe: '',
        confirmer_mot_de_passe: '',
        email: '',
        role: 'VENDEUR',
        actif: true
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Définir les droits par défaut selon le rôle (comme Python ligne 818-872)
    const getDroitsByRole = (role) => {
        const droitsParRole = {
            "ADMIN": "TOUS",
            "GESTIONNAIRE": {
                "gestion_utilisateurs": true,
                "gestion_factures": true,
                "gestion_clients": true,
                "gestion_produits": true,
                "gestion_stock": true,
                "gestion_rapports": true,
                "gestion_avoirs": true,
                "gestion_reglements": true,
                "gestion_comptoir": true,
                "gestion_devis": true
            },
            "VENDEUR": {
                "gestion_utilisateurs": false,
                "gestion_factures": true,
                "gestion_clients": true,
                "gestion_produits": false,
                "gestion_stock": false,
                "gestion_rapports": false,
                "gestion_avoirs": true,
                "gestion_reglements": true,
                "gestion_comptoir": true,
                "gestion_devis": true
            },
            "GESTIONNAIRE_STOCK": {
                "gestion_utilisateurs": false,
                "gestion_factures": false,
                "gestion_clients": false,
                "gestion_produits": true,
                "gestion_stock": true,
                "gestion_rapports": true,
                "gestion_avoirs": false,
                "gestion_reglements": false,
                "gestion_comptoir": false,
                "gestion_devis": false
            },
            "CAISSIER": {
                "gestion_utilisateurs": false,
                "gestion_factures": false,
                "gestion_clients": false,
                "gestion_produits": false,
                "gestion_stock": false,
                "gestion_rapports": false,
                "gestion_avoirs": false,
                "gestion_reglements": true,
                "gestion_comptoir": true,
                "gestion_devis": false
            }
        };

        const droits = droitsParRole[role] || droitsParRole["VENDEUR"];
        return typeof droits === 'string' ? droits : JSON.stringify(droits);
    };

    useEffect(() => {
        if (utilisateur) {
            setFormData({
                nom_utilisateur: utilisateur.nom_utilisateur || '',
                mot_de_passe: '',
                confirmer_mot_de_passe: '',
                email: utilisateur.email || '',
                role: utilisateur.role || 'VENDEUR',
                actif: utilisateur.actif !== false
            });
        }
    }, [utilisateur]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.nom_utilisateur) {
            toast.error('Le nom d\'utilisateur est obligatoire');
            return;
        }

        if (!utilisateur && !formData.mot_de_passe) {
            toast.error('Le mot de passe est obligatoire');
            return;
        }

        if (formData.mot_de_passe && formData.mot_de_passe !== formData.confirmer_mot_de_passe) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            const userData = {
                nom_utilisateur: formData.nom_utilisateur,
                email: formData.email,
                role: formData.role,
                actif: formData.actif
            };

            if (formData.mot_de_passe) {
                userData.mot_de_passe = formData.mot_de_passe;
            }

            // Ajouter les droits par défaut selon le rôle (seulement pour création)
            if (!utilisateur) {
                userData.droits = getDroitsByRole(formData.role);
            }

            if (utilisateur) {
                // Modification
                await utilisateurService.update(utilisateur.id_utilisateur, userData);
                toast.success('Utilisateur modifié avec succès');
            } else {
                // Création
                await utilisateurService.create(userData);
                toast.success('Utilisateur créé avec succès');
            }

            onSuccess();
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement de l\'utilisateur');
            console.error(error);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>👥 {utilisateur ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}</h2>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Nom d'utilisateur *</label>
                        <input
                            type="text"
                            value={formData.nom_utilisateur}
                            onChange={(e) => setFormData({ ...formData, nom_utilisateur: e.target.value })}
                            className="form-control"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="form-control"
                            placeholder="utilisateur@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Rôle *</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="form-control"
                            required
                        >
                            <option value="ADMIN">🛡️ Administrateur</option>
                            <option value="GESTIONNAIRE">👔 Gestionnaire</option>
                            <option value="VENDEUR">👤 Vendeur</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Mot de passe {utilisateur ? '' : '*'}</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={formData.mot_de_passe}
                                onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                                className="form-control"
                                placeholder={utilisateur ? 'Laisser vide pour ne pas changer' : ''}
                                required={!utilisateur}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#666',
                                    fontSize: '16px'
                                }}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirmer mot de passe {utilisateur ? '' : '*'}</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmer_mot_de_passe}
                                onChange={(e) => setFormData({ ...formData, confirmer_mot_de_passe: e.target.value })}
                                className="form-control"
                                placeholder={utilisateur ? 'Laisser vide pour ne pas changer' : ''}
                                required={!utilisateur && formData.mot_de_passe}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#666',
                                    fontSize: '16px'
                                }}
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.actif}
                                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                            />
                            <span>Compte actif</span>
                        </label>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Annuler
                        </button>
                        <button type="submit" className="btn btn-success">
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UtilisateurFormModal;
