const crypto = require('crypto');
const logger = require('../config/logger');

// Environment variable for encryption key - should be moved to .env file
// In production, use a strong, unique key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'telehealth-default-32byte-security-key';
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || '1234567890abcdef'; // 16 bytes

// Encrypt sensitive data
const encrypt = (text) => {
  try {
    if (!text) return '';
    
    const iv = Buffer.from(ENCRYPTION_IV, 'utf8');
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf8'); // Ensure key is 32 bytes
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    logger.error('Encryption error:', error);
    // Return original text instead of throwing, to prevent save failures
    return text.toString();
  }
};

// Decrypt sensitive data
const decrypt = (encryptedText) => {
  try {
    if (!encryptedText) return '';
    
    // Check if the text is already decrypted (not in hex format)
    if (!/^[0-9a-f]+$/i.test(encryptedText)) {
      return encryptedText;
    }
    
    const iv = Buffer.from(ENCRYPTION_IV, 'utf8');
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf8'); // Ensure key is 32 bytes
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    // Return original text instead of throwing, to prevent read failures
    return encryptedText;
  }
};

module.exports = {
  encrypt,
  decrypt
}; 