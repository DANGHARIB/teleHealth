# Security Configuration for TeleHealth Application

## HIPAA Compliance and Data Encryption

For HIPAA compliance, sensitive patient data is encrypted in the database. This includes medical notes, diagnoses, treatments, and other protected health information (PHI).

### Required Environment Variables for Encryption

Add the following variables to your `.env` file:

```
# Encryption keys for HIPAA compliance (REQUIRED for production)
# These MUST be set in production environments
ENCRYPTION_KEY=your-strong-32-byte-encryption-key-here
ENCRYPTION_IV=your-16-byte-initialization-vector-here
```

> **IMPORTANT**: The application uses default encryption keys in development mode if these values are not set. 
> **NEVER use the default values in production** as this would compromise patient data security.

### Generating Secure Keys

To generate a secure encryption key and initialization vector, you can use the following commands:

```bash
# Generate a 32-byte (256-bit) encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate a 16-byte initialization vector
node -e "console.log(require('crypto').randomBytes(16).toString('hex').slice(0, 16))"
```

### Deployment Checklist

1. Generate unique encryption keys for each environment
2. Add the keys to your environment variables or secure key store
3. Verify encryption is working correctly by testing note creation
4. Create a key rotation plan for production environments

### Important Security Notes

1. Never commit encryption keys to version control
2. Use different keys for development, staging, and production environments
3. Store encryption keys securely using a secret management service
4. Rotate encryption keys periodically
5. Implement proper key access controls

## Additional HIPAA Security Measures

1. All API endpoints are protected with authentication
2. Access to patient data is restricted based on user roles
3. Audit logs track all access to patient information
4. Data in transit is protected with TLS/SSL
5. Regular security reviews and penetration testing

## Troubleshooting

If you encounter errors related to encryption:

1. Verify your encryption keys are correctly set in the environment variables
2. Ensure the IV is exactly 16 bytes (characters) long
3. Check log files for specific encryption/decryption errors
4. In development mode, you can enable detailed error messages by setting `NODE_ENV=development` 