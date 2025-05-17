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

# Téléhealth App

Application mobile de consultation médicale à distance.

## Fonctionnalités de gestion des rendez-vous

### Flux de rendez-vous
1. Le patient sélectionne un médecin et voit ses disponibilités
2. Le patient réserve un créneau, créant un rendez-vous avec statut "pending"
3. Le médecin reçoit la demande et peut la confirmer, générant un lien Zoom
4. Le médecin et le patient peuvent voir le lien de consultation dans les détails du rendez-vous
5. Après la consultation, le médecin peut marquer le rendez-vous comme "completed"

### Statuts de rendez-vous
- **pending**: En attente de confirmation par le médecin
- **confirmed**: Confirmé par le médecin avec lien de consultation
- **scheduled**: Programmé (statut hérité)
- **completed**: Consultation terminée
- **cancelled**: Annulé par le patient ou le médecin
- **rescheduled**: Reprogrammé à un autre créneau

### Gestion des empêchements
Le médecin peut reprogrammer un rendez-vous en:
1. Sélectionnant une nouvelle disponibilité
2. Libérant l'ancien créneau
3. Réservant le nouveau créneau
4. Mettant à jour le statut à "rescheduled"

### Paiement
Le paiement est initialement en statut "pending" et pourra être complété ultérieurement.

## Fonctionnalités implémentées

### Backend
- Modèle de rendez-vous avec statuts multiples
- Confirmation des rendez-vous avec génération de lien Zoom
- Reprogrammation des rendez-vous
- Annulation des rendez-vous

### Frontend Médecin
- Visualisation des rendez-vous avec code couleur selon statut
- Confirmation des rendez-vous en attente
- Interface de reprogrammation avec sélection des disponibilités
- Marquage des rendez-vous comme terminés

### Frontend Patient
- Visualisation des rendez-vous avec code couleur selon statut
- Accès au lien de consultation Zoom
- Annulation des rendez-vous

## Prochaines étapes

### Priorité haute
1. Implémentation du système de paiement (simulé)
2. Système de notification pour informer des changements de statut
3. Validation des rendez-vous annulés ou reprogrammés

### Priorité moyenne
1. Historique des rendez-vous passés
2. Évaluation post-consultation
3. Gestion des remboursements pour les annulations

### Priorité basse
1. Intégration avec des calendriers externes
2. Rappels automatiques avant rendez-vous
3. Interface administrateur pour supervision 