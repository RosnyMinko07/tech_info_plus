/**
 * Hook personnalisé pour gérer les inputs numériques
 * Empêche automatiquement les valeurs négatives
 */

export const useNumberInput = () => {
  const handleKeyDown = (e) => {
    // Empêcher le signe moins (-), le signe plus (+) et la notation scientifique (e, E)
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
      e.preventDefault();
    }
  };

  const sanitizeValue = (value) => {
    const num = parseFloat(value);
    return isNaN(num) || num < 0 ? 0 : num;
  };

  const handleChange = (e, setter) => {
    const value = e.target.value;
    const sanitized = sanitizeValue(value);
    
    if (setter) {
      setter(sanitized);
    }
    
    return sanitized;
  };

  const handlePaste = (e) => {
    // Empêcher le collage de valeurs négatives
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('-') || parseFloat(pastedText) < 0) {
      e.preventDefault();
    }
  };

  return {
    numberInputProps: {
      onKeyDown: handleKeyDown,
      onPaste: handlePaste,
      min: 0,
      step: 'any'
    },
    handleKeyDown,
    handlePaste,
    sanitizeValue,
    handleChange
  };
};



