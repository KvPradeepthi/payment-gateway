// VPA validation - accepts format: user@bank
const validateVPA = (vpa) => {
  const vpaPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return vpaPattern.test(vpa);
};

// Luhn algorithm for card validation
const validateCardNumber = (cardNumber) => {
  // Remove spaces and dashes
  const cleanCard = cardNumber.replace(/[\s-]/g, '');
  
  // Must be digits only and 13-19 length
  if (!/^\d{13,19}$/.test(cleanCard)) {
    return false;
  }

  // Apply Luhn algorithm
  let sum = 0;
  for (let i = cleanCard.length - 2; i >= 0; i -= 2) {
    let digit = parseInt(cleanCard[i]) * 2;
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  
  // Add odd positioned digits
  for (let i = cleanCard.length - 1; i >= 0; i -= 2) {
    sum += parseInt(cleanCard[i]);
  }
  
  return sum % 10 === 0;
};

// Card network detection
const detectCardNetwork = (cardNumber) => {
  const cleanCard = cardNumber.replace(/[\s-]/g, '');
  
  if (/^4/.test(cleanCard)) return 'visa';
  if (/^5[1-5]/.test(cleanCard)) return 'mastercard';
  if (/^3[47]/.test(cleanCard)) return 'amex';
  if (/^(60|65|8[1-9])/.test(cleanCard)) return 'rupay';
  return 'unknown';
};

// Expiry validation
const validateExpiry = (month, year) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Ensure month is 1-12
  if (month < 1 || month > 12) return false;
  
  // Handle 2-digit or 4-digit year
  let fullYear = year;
  if (year < 100) {
    fullYear = currentYear - (currentYear % 100) + year;
  }
  
  // Card is valid if expiry is in the future
  return fullYear > currentYear || (fullYear === currentYear && month >= currentMonth);
};

module.exports = {
  validateVPA,
  validateCardNumber,
  detectCardNetwork,
  validateExpiry
};
