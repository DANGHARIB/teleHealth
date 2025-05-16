const fs = require('fs');
const path = require('path');

// Chemin des fichiers .env
const backendEnvPath = path.join(__dirname, '../backend/.env');
const frontendEnvPath = path.join(__dirname, '../frontend/.env');

// Contenu des fichiers .env
const backendEnvContent = `NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://daneeliasgharib:<db_password>@telehealth.1ji8cro.mongodb.net/?retryWrites=true&w=majority&appName=teleHealth
JWT_SECRET=votre_secret_jwt_ici
JWT_EXPIRES_IN=90d`;

const frontendEnvContent = `EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_MONGODB_URI=mongodb+srv://daneeliasgharib:<db_password>@telehealth.1ji8cro.mongodb.net/?retryWrites=true&w=majority&appName=teleHealth`;

// Créer les répertoires si nécessaire
function ensureDirExists(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

// Écrire les fichiers .env
function createEnvFile(filePath, content) {
  ensureDirExists(filePath);
  
  try {
    fs.writeFileSync(filePath, content);
    console.log(`Fichier créé avec succès: ${filePath}`);
  } catch (error) {
    console.error(`Erreur lors de la création du fichier ${filePath}:`, error);
  }
}

// Créer les fichiers
createEnvFile(backendEnvPath, backendEnvContent);
createEnvFile(frontendEnvPath, frontendEnvContent);

console.log('\nN\'oubliez pas de remplacer <db_password> par votre mot de passe réel dans les fichiers .env!'); 