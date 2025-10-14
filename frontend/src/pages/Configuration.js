import React, { useState, useEffect } from 'react';
import { FaSave, FaImage, FaBuilding, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';
import '../styles/Configuration.css';

function Configuration() {
    const [formData, setFormData] = useState({
        nom: '',
        adresse: '',
        telephone: '',
        email: '',
        nif: '',
        devise: 'FCFA',
        taux_tva: 9.5,
        logo_path: '',
        slogan: '',
        site_web: '',
        compte_bancaire: ''
    });

    const [logoPreview, setLogoPreview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/entreprise/config');
            console.log('📥 Config chargée depuis serveur:', response.data);
            if (response.data) {
                // Mettre à jour formData avec TOUTES les données y compris le logo
                const configData = {
                    nom: response.data.nom || '',
                    adresse: response.data.adresse || '',
                    telephone: response.data.telephone || '',
                    email: response.data.email || '',
                    nif: response.data.nif || '',
                    devise: response.data.devise || 'FCFA',
                    taux_tva: response.data.taux_tva || 9.5,
                    logo_path: response.data.logo_path || '',
                    slogan: response.data.slogan || '',
                    site_web: response.data.site_web || '',
                    compte_bancaire: response.data.compte_bancaire || ''
                };
                
                setFormData(configData);
                
                if (response.data.logo_path && response.data.logo_path.trim() !== '') {
                    console.log('🖼️ Logo trouvé:', response.data.logo_path.substring(0, 50) + '...');
                    setLogoPreview(response.data.logo_path);
                } else {
                    console.log('⚠️ Pas de logo dans la config');
                    setLogoPreview(null);
                }
            }
        } catch (error) {
            console.error('❌ Erreur chargement config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
                setFormData({ ...formData, logo_path: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nom || !formData.telephone) {
            toast.error('Veuillez remplir les champs obligatoires');
            return;
        }

        try {
            console.log('💾 Enregistrement config:', {
                ...formData,
                logo_path: formData.logo_path ? `${formData.logo_path.substring(0, 50)}...` : 'Aucun'
            });
            const response = await api.post('/api/entreprise/config', formData);
            console.log('✅ Réponse serveur:', response);
            toast.success('Configuration enregistrée avec succès');
            await loadConfig();
        } catch (error) {
            console.error('❌ Erreur enregistrement config:', error);
            toast.error('Erreur lors de l\'enregistrement');
        }
    };

    if (loading) {
        return (
            <div className="configuration-container">
                <div className="loading">Chargement de la configuration...</div>
            </div>
        );
    }

    return (
        <div className="configuration-container">
            {/* En-tête */}
            <div className="configuration-header">
                <h1 className="configuration-title">⚙️ Configuration de l'Entreprise</h1>
                <p className="configuration-subtitle">Gérez les informations de votre entreprise et le logo pour les PDFs</p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="configuration-form">
                <div className="form-section">
                    <h3 className="section-title">
                        <FaBuilding /> Informations de l'entreprise
                    </h3>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nom de l'entreprise *</label>
                            <input
                                type="text"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                className="form-control"
                                placeholder="Ex: TECH INFO PLUS"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Téléphone *</label>
                            <input
                                type="text"
                                value={formData.telephone}
                                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                className="form-control"
                                placeholder="Ex: +241 XX XX XX XX"
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
                                placeholder="Ex: contact@entreprise.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>Adresse</label>
                            <input
                                type="text"
                                value={formData.adresse}
                                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                className="form-control"
                                placeholder="Ex: Port-Gentil, Gabon"
                            />
                        </div>

                        <div className="form-group">
                            <label>NIF (Numéro d'Identification Fiscale)</label>
                            <input
                                type="text"
                                value={formData.nif}
                                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                                className="form-control"
                                placeholder="Ex: G1234567890123"
                            />
                        </div>

                        <div className="form-group">
                            <label>Site web</label>
                            <input
                                type="text"
                                value={formData.site_web}
                                onChange={(e) => setFormData({ ...formData, site_web: e.target.value })}
                                className="form-control"
                                placeholder="Ex: www.entreprise.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>Compte bancaire</label>
                            <input
                                type="text"
                                value={formData.compte_bancaire}
                                onChange={(e) => setFormData({ ...formData, compte_bancaire: e.target.value })}
                                className="form-control"
                                placeholder="Ex: IBAN ou RIB"
                            />
                        </div>

                        <div className="form-group">
                            <label>Slogan</label>
                            <input
                                type="text"
                                value={formData.slogan}
                                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                                className="form-control"
                                placeholder="Ex: Votre partenaire informatique"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="section-title">
                        💰 Paramètres Financiers
                    </h3>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Devise</label>
                            <select
                                value={formData.devise}
                                onChange={(e) => setFormData({ ...formData, devise: e.target.value })}
                                className="form-control"
                            >
                                <option value="FCFA">FCFA</option>
                                <option value="XAF">XAF</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Taux TVA/Précompte (%)</label>
                            <input
                                type="number"
                                value={formData.taux_tva}
                                onChange={(e) => setFormData({ ...formData, taux_tva: parseFloat(e.target.value) })}
                                className="form-control"
                                step="0.1"
                                min="0"
                                max="100"
                                placeholder="Ex: 9.5"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="section-title">
                        <FaImage /> Logo de l'entreprise
                    </h3>

                    <div className="logo-section">
                        {logoPreview && (
                            <div className="logo-preview">
                                <img src={logoPreview} alt="Logo" />
                            </div>
                        )}
                        
                        <div className="logo-upload">
                            <label htmlFor="logo-upload" className="btn btn-primary">
                                <FaImage /> Choisir un logo
                            </label>
                            <input
                                id="logo-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                style={{ display: 'none' }}
                            />
                            <p className="help-text">Format: JPG, PNG (max 2MB)</p>
                        </div>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="form-actions">
                    <button type="button" onClick={loadConfig} className="btn btn-secondary">
                        <FaSync /> Réinitialiser
                    </button>
                    <button type="submit" className="btn btn-success">
                        <FaSave /> Enregistrer
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Configuration;