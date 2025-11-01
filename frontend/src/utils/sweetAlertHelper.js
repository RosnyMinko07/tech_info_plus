import Swal from 'sweetalert2';

/**
 * Popup de confirmation pour suppression
 * @param {string} itemName - Nom de l'élément à supprimer
 * @returns {Promise<boolean>} - true si confirmé, false sinon
 */
export const confirmDelete = async (itemName = 'cet élément') => {
  const result = await Swal.fire({
    title: 'Êtes-vous sûr ?',
    html: `Voulez-vous vraiment supprimer <strong>${itemName}</strong> ?<br><small>Cette action est irréversible.</small>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: '<i class="fas fa-trash"></i> Oui, supprimer',
    cancelButtonText: '<i class="fas fa-times"></i> Annuler',
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom',
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel'
    }
  });
  
  return result.isConfirmed;
};

/**
 * Popup de confirmation spécialisé pour suppression de clients avec documents
 * @param {string} clientName - Nom du client
 * @param {number} nbFactures - Nombre de factures
 * @param {number} nbDevis - Nombre de devis
 * @returns {Promise<boolean>} - true si confirmé, false sinon
 */
export const confirmDeleteClientWithDocuments = async (clientName, nbFactures, nbDevis) => {
  const result = await Swal.fire({
    title: '⚠️ Suppression avec documents',
    html: `
      <div style="text-align: left;">
        <p>Le client <strong>"${clientName}"</strong> a des documents liés :</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>📄 ${nbFactures} facture(s)</li>
          <li>📋 ${nbDevis} devis</li>
        </ul>
        <p style="color: #dc3545; font-weight: bold;">
          ⚠️ La suppression supprimera AUSSI tous ces documents !
        </p>
        <small style="color: #666;">Cette action est irréversible.</small>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: '<i class="fas fa-trash"></i> Supprimer tout',
    cancelButtonText: '<i class="fas fa-times"></i> Annuler',
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom',
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel'
    }
  });
  
  return result.isConfirmed;
};

/**
 * Popup de confirmation pour déconnexion
 * @returns {Promise<boolean>} - true si confirmé, false sinon
 */
export const confirmLogout = async () => {
  const result = await Swal.fire({
    title: 'Déconnexion',
    html: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#fd7e14',
    cancelButtonColor: '#6c757d',
    confirmButtonText: '<i class="fas fa-sign-out-alt"></i> Oui, me déconnecter',
    cancelButtonText: '<i class="fas fa-times"></i> Annuler',
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom',
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel'
    }
  });
  
  return result.isConfirmed;
};

/**
 * Popup de confirmation générique
 * @param {string} title - Titre du popup
 * @param {string} message - Message du popup
 * @param {string} confirmText - Texte du bouton de confirmation
 * @param {string} icon - Icône (success, error, warning, info, question)
 * @returns {Promise<boolean>} - true si confirmé, false sinon
 */
export const confirmAction = async (title, message, confirmText = 'Confirmer', icon = 'question') => {
  const result = await Swal.fire({
    title,
    html: message,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#1f538d',
    cancelButtonColor: '#6c757d',
    confirmButtonText: `<i class="fas fa-check"></i> ${confirmText}`,
    cancelButtonText: '<i class="fas fa-times"></i> Annuler',
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom',
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel'
    }
  });
  
  return result.isConfirmed;
};

/**
 * Popup de confirmation pour vider le panier
 * @returns {Promise<boolean>} - true si confirmé, false sinon
 */
export const confirmClearCart = async () => {
  const result = await Swal.fire({
    title: 'Vider le panier ?',
    html: 'Tous les articles du panier seront supprimés.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#fd7e14',
    cancelButtonColor: '#6c757d',
    confirmButtonText: '<i class="fas fa-trash"></i> Oui, vider',
    cancelButtonText: '<i class="fas fa-times"></i> Annuler',
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom',
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel'
    }
  });
  
  return result.isConfirmed;
};

/**
 * Popup de confirmation pour valider un devis
 * @param {string} numeroDevis - Numéro du devis
 * @returns {Promise<boolean>} - true si confirmé, false sinon
 */
export const confirmValidateDevis = async (numeroDevis) => {
  const result = await Swal.fire({
    title: 'Valider le devis ?',
    html: `Voulez-vous valider le devis <strong>${numeroDevis}</strong> ?<br><small>Une facture sera créée automatiquement.</small>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#6c757d',
    confirmButtonText: '<i class="fas fa-check"></i> Oui, valider',
    cancelButtonText: '<i class="fas fa-times"></i> Annuler',
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom',
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel'
    }
  });
  
  return result.isConfirmed;
};

/**
 * Popup de confirmation pour démarrer un inventaire
 * @returns {Promise<boolean>} - true si confirmé, false sinon
 */
export const confirmStartInventory = async () => {
  const result = await Swal.fire({
    title: 'Démarrer un inventaire ?',
    html: 'Vous pourrez saisir les quantités réelles pour chaque article.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#1f538d',
    cancelButtonColor: '#6c757d',
    confirmButtonText: '<i class="fas fa-play"></i> Démarrer',
    cancelButtonText: '<i class="fas fa-times"></i> Annuler',
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom',
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel'
    }
  });
  
  return result.isConfirmed;
};

/**
 * Popup de confirmation pour annuler un inventaire
 * @returns {Promise<boolean>} - true si confirmé, false sinon
 */
export const confirmCancelInventory = async () => {
  const result = await Swal.fire({
    title: 'Annuler l\'inventaire ?',
    html: '<strong>Toutes les données saisies seront perdues.</strong>',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: '<i class="fas fa-times-circle"></i> Oui, annuler',
    cancelButtonText: '<i class="fas fa-arrow-left"></i> Continuer l\'inventaire',
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom',
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel'
    }
  });
  
  return result.isConfirmed;
};

/**
 * Popup de succès
 * @param {string} message - Message de succès
 * @param {number} timer - Durée d'affichage en ms (0 = manuel)
 */
export const showSuccess = (message, timer = 2000) => {
  Swal.fire({
    icon: 'success',
    title: 'Succès !',
    text: message,
    timer,
    showConfirmButton: timer === 0,
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom'
    }
  });
};

/**
 * Popup d'erreur
 * @param {string} message - Message d'erreur
 */
export const showError = (message) => {
  Swal.fire({
    icon: 'error',
    title: 'Erreur',
    text: message,
    confirmButtonColor: '#dc3545',
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom'
    }
  });
};

/**
 * Popup d'information
 * @param {string} title - Titre
 * @param {string} message - Message
 */
export const showInfo = (title, message) => {
  Swal.fire({
    icon: 'info',
    title,
    html: message,
    confirmButtonColor: '#1f538d',
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom'
    }
  });
};

/**
 * Popup de succès avec détails (pour ventes, etc.)
 * @param {string} title - Titre
 * @param {string} details - Détails HTML
 */
export const showSuccessWithDetails = (title, details) => {
  Swal.fire({
    icon: 'success',
    title,
    html: details,
    confirmButtonColor: '#28a745',
    background: 'var(--bg-secondaire)',
    color: 'var(--texte-principal)',
    customClass: {
      popup: 'swal-popup-custom'
    }
  });
};





