# Application Mobile React Native avec Backend Express/MongoDB

Ce projet est une application mobile complète construite avec React Native (Expo) et un backend Express/Node.js utilisant MongoDB.

## Structure du Projet

```
my-mobile-app/
├── frontend/          # Application React Native Expo
├── backend/           # API Node.js/Express avec MongoDB
└── README.md          # Documentation du projet
```

## Installation

### Prérequis

- Node.js (v14+ recommandé)
- npm ou yarn
- MongoDB (local ou distant)
- Expo CLI (`npm install -g expo-cli`)

### Backend

```bash
# Naviguer dans le dossier backend
cd backend

# Installer les dépendances
npm install

# Créer un fichier .env avec les variables suivantes:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/mobile-app
# JWT_SECRET=votre_secret_jwt_securise
# NODE_ENV=development

# Lancer le serveur en mode développement
npm run dev
```

Le serveur backend sera accessible à l'adresse: http://localhost:5000

### Frontend

```bash
# Naviguer dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Lancer l'application en mode développement
npx expo start
```

Suivez les instructions dans le terminal pour lancer l'application sur un émulateur ou sur votre appareil via Expo Go.

## Fonctionnalités

- **Backend**:
  - API RESTful avec Express
  - Authentification JWT
  - Base de données MongoDB avec Mongoose
  - Structure MVC

- **Frontend**:
  - Interface utilisateur React Native
  - Navigation entre écrans
  - Gestion d'état
  - Requêtes API avec Axios

## Workflow de développement

1. Lancer le backend: `cd backend && npm run dev`
2. Lancer le frontend: `cd frontend && npx expo start`
3. Développer les fonctionnalités en parallèle
4. Tester la communication entre le frontend et le backend

## Endpoints API

- `GET /api/ping`: Tester la connexion à l'API
- `POST /api/auth/register`: Inscription d'un nouvel utilisateur
- `POST /api/auth/login`: Connexion d'un utilisateur
- `GET /api/auth/profile`: Récupérer les informations du profil (authentifié)

## License

MIT 