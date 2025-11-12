import React, { useState, useEffect } from 'react';
import { FaTimes, FaImage } from 'react-icons/fa';
import { articleService, fournisseurService } from '../services/api';
import { toast } from 'react-toastify';
import { preventNegativeNumbers } from '../utils/numberValidation';

function ArticleFormModal({ article, onClose, onSuccess }) {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
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
      // Charger l'aperçu de l'image existante
      if (article.image_path) {
        setImagePreview(article.image_path);
      }
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5 MB');
        return;
      }

      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        console.log('Image chargée, taille:', imageData.length, 'caractères');
        setImagePreview(imageData);
        setFormData(prev => ({ ...prev, image_path: imageData }));
      };
      reader.onerror = () => {
        console.error('Erreur lors de la lecture du fichier');
        toast.error('Erreur lors de la lecture de l\'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_path: '' }));
    // Réinitialiser aussi l'input file
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
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

            {/* Upload d'image (uniquement pour les produits) */}
            {formData.type_article === 'PRODUIT' && (
              <div className="input-group full-width">
                <label className="input-label">
                  <FaImage /> Image du produit
                </label>
                
                {imagePreview ? (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '10px',
                    padding: '15px',
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <img 
                      src={imagePreview} 
                      alt="Aperçu" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '200px', 
                        borderRadius: '8px',
                        objectFit: 'cover',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm"
                      onClick={handleRemoveImage}
                      style={{ fontSize: '12px', padding: '5px 15px' }}
                    >
                      ✕ Supprimer l'image
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '10px',
                    padding: '30px',
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9',
                    cursor: 'pointer'
                  }}>
                    <FaImage style={{ fontSize: '48px', color: '#ccc' }} />
                    <label 
                      htmlFor="image-upload" 
                      style={{ 
                        cursor: 'pointer',
                        color: '#007bff',
                        fontWeight: '500'
                      }}
                    >
                      📁 Cliquez pour sélectionner une image
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Formats acceptés: JPG, PNG, GIF (max 5 MB)
                    </small>
                  </div>
                )}
              </div>
            )}
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
