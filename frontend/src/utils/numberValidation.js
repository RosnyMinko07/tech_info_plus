/**
 * Utilitaires pour la validation des nombres
 * Empêche les valeurs négatives dans tous les champs numériques
 */

/**
 * Handler pour empêcher la saisie de nombres négatifs
 * À utiliser avec onKeyDown sur les inputs type="number"
 */
export const preventNegativeNumbers = (e) => {
  // Empêcher le signe moins (-)
  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
    e.preventDefault();
  }
};

/**
 * Valider et nettoyer une valeur numérique
 * Retourne 0 si la valeur est négative
 */
export const sanitizeNumber = (value) => {
  const num = parseFloat(value);
  return isNaN(num) || num < 0 ? 0 : num;
};

/**
 * Handler onChange pour les inputs numériques
 * Empêche les valeurs négatives
 */
export const handleNumberChange = (value, setter) => {
  const sanitized = sanitizeNumber(value);
  setter(sanitized);
  return sanitized;
};



