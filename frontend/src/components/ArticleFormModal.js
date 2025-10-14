import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { articleService, fournisseurService } from '../services/api';
import { toast } from 'react-toastify';
import { preventNegativeNumbers } from '../utils/numberValidation';

function ArticleFormModal({ article, onClose, onSuccess }) {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [formData, setFormData] = useState({
    code_article: '',
    designation: '',
    description: '',
    type_article: 'PRODUIT',
    prix_achat: 0,
    prix_vente: 0,
    prix_service: 0,
    stock_actuel: 0,
    stock_alerte: 10,
    unite: 'PIECE',
    categorie: '',
    image_path: '',
    id_fournisseur: null
  });

  useEffect(() => {
    loadFournisseurs();
    if (article) {
      setFormData({
        code_article: article.code_article || '',
        designation: article.designation || '',
        description: article.description || '',
        type_article: article.type_article || 'PRODUIT',
        prix_achat: article.prix_achat || 0,
        prix_vente: article.prix_vente || 0,
        prix_service: article.prix_service || 0,
        stock_actuel: article.stock_actuel || 0,
        stock_alerte: article.stock_alerte || 10,
        unite: article.unite || 'PIECE',
        categorie: article.categorie || '',
        image_path: article.image_path || '',
        id_fournisseur: article.id_fournisseur || null
      });
    } else {
      generateCodeArticle();
    }
  }, [article]);

  const loadFournisseurs = async () => {
    try {
      const data = await fournisseurService.getAll();
      setFournisseurs(data || []);
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
      setFournisseurs([]);
    }
  };

  const generateCodeArticle = async () => {
    try {
      const code = await articleService.generateCode();
      setFormData(prev => ({ ...prev, code_article: code }));
    } catch (error) {
      console.error('Erreur génération code:', error);
      // Fallback : génération locale
      const code = 'ART-NEW';
      setFormData(prev => ({ ...prev, code_article: code }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.designation.trim()) {
      toast.error('La désignation est obligatoire');
      return;
    }

    try {
      // Préparer les données en convertissant les types correctement
      const articleData = {
        ...formData,
        prix_achat: parseFloat(formData.prix_achat) || 0,
        prix_vente: parseFloat(formData.prix_vente) || 0,
        prix_service: parseFloat(formData.prix_service) || 0,
        stock_actuel: parseInt(formData.stock_actuel) || 0,
        stock_alerte: parseInt(formData.stock_alerte) || 10,
        id_fournisseur: formData.id_fournisseur && formData.id_fournisseur !== '' 
          ? parseInt(formData.id_fournisseur) 
          : null
      };

      if (article) {
        await articleService.update(article.id_article, articleData);
        toast.success('Article modifié avec succès');
      } else {
        await articleService.create(articleData);
        toast.success('Article créé avec succès');
      }
      onSuccess();
    } catch (error) {
      console.error('Erreur sauvegarde article:', error);
      toast.error(`Erreur lors de la sauvegarde: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {article ? 'Modifier Article' : 'Nouvel Article'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Code Article *</label>
              <input
                type="text"
                name="code_article"
                value={formData.code_article}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Désignation *</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Type *</label>
              <select
                name="type_article"
                value={formData.type_article}
                onChange={handleChange}
                className="input-field"
              >
                <option value="PRODUIT">Produit</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>

            {formData.type_article === 'PRODUIT' && (
              <>
                <div className="input-group">
                  <label className="input-label">Prix d'achat</label>
                  <input
                    type="number"
                    name="prix_achat"
                    value={formData.prix_achat}
                    onChange={handleChange}
                    className="input-field"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Stock actuel</label>
                  <input
                    type="number"
                    name="stock_actuel"
                    value={formData.stock_actuel}
                    onChange={handleChange}
                    className="input-field"
                    min="0"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Stock d'alerte</label>
                  <input
                    type="number"
                    name="stock_alerte"
                    value={formData.stock_alerte}
                    onChange={handleChange}
                    className="input-field"
                    min="0"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Unité</label>
                  <input
                    type="text"
                    name="unite"
                    value={formData.unite}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Fournisseur</label>
                  <select
                    name="id_fournisseur"
                    value={formData.id_fournisseur || ''}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Aucun</option>
                    {fournisseurs.map(f => (
                      <option key={f.id_fournisseur} value={f.id_fournisseur}>
                        {f.nom_fournisseur}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="input-group">
              <label className="input-label">Prix de vente *</label>
              <input
                type="number"
                name="prix_vente"
                value={formData.prix_vente}
                onChange={handleChange}
                className="input-field"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="input-group full-width">
              <label className="input-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success">
              ✓ Enregistrer
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ✕ Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ArticleFormModal;
