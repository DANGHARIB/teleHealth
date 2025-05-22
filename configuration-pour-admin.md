# Configuration pour l'application web d'administrateur

Ce document détaille la configuration nécessaire pour connecter l'application web d'administrateur (développée avec React Vite) au backend existant de notre application mobile.

## Configuration du fichier .env

Créez un fichier `.env` à la racine de votre projet d'application web d'administrateur avec les variables suivantes :

```
# URL de l'API Backend
VITE_API_URL=http://localhost:5000/api

# Configuration d'environnement
VITE_APP_ENV=development

# Timeout des requêtes API (en millisecondes)
VITE_API_TIMEOUT=30000

# Préfixe pour le stockage local
VITE_STORAGE_PREFIX=admin_app_
```

Pour l'environnement de production, modifiez ces valeurs :

```
VITE_API_URL=https://votre-domaine.com/api
VITE_APP_ENV=production
```

## Configuration CORS

Le serveur backend est déjà configuré pour accepter les requêtes depuis les origines suivantes :
- `http://localhost:5173` (développement de l'application web admin avec Vite)
- `https://admin.votre-domaine.com` (production)

Si vous utilisez un autre port ou domaine, modifiez le fichier `backend/server.js` pour ajouter cette origine à la liste des origines autorisées dans la configuration CORS.

## Points d'API disponibles

### Authentification pour Administrateurs

- **Créer un compte administrateur** : `POST /api/auth/register`
  - Corps : `{ email, password, firstName, lastName, role: "admin" }`
  - Réponse : `{ user, token }`

- **Login administrateur** : `POST /api/auth/login`
  - Corps : `{ email, password }`
  - Réponse : `{ user, token }`

- **Profil administrateur** : `GET /api/auth/profile`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Cette route vérifie automatiquement les permissions d'administrateur

### Gestion des Médecins

- **Liste complète des médecins** : `GET /api/doctors`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `?page=1&limit=20&sort=createdAt&order=desc`

- **Détails d'un médecin** : `GET /api/doctors/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Inclut les informations personnelles et professionnelles

- **Finances d'un médecin** : `GET /api/doctors/:id/finances`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Retourne les données financières complètes du médecin

- **Paiements d'un médecin** : `GET /api/payments?doctorId=:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=completed`
  - Retourne l'historique des paiements du médecin

### Gestion des Patients

- **Liste complète des patients** : `GET /api/patients`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `?page=1&limit=20&sort=createdAt&order=desc`

- **Détails d'un patient** : `GET /api/patients/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Inclut les informations personnelles et médicales

- **Finances d'un patient** : `GET /api/patients/:id/finances`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Retourne les données financières complètes du patient

- **Paiements d'un patient** : `GET /api/payments?patientId=:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=completed`
  - Retourne l'historique des paiements du patient

### Gestion des Rendez-vous

- **Liste complète des rendez-vous** : `GET /api/appointments`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `?page=1&limit=20&sort=scheduledDate&order=desc`

- **Rendez-vous par médecin** : `GET /api/appointments?doctorId=:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `&status=scheduled&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
  - Retourne tous les rendez-vous d'un médecin

- **Rendez-vous par patient** : `GET /api/appointments?patientId=:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `&status=scheduled&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
  - Retourne tous les rendez-vous d'un patient

- **Détails d'un rendez-vous** : `GET /api/appointments/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Inclut les détails complets du rendez-vous, y compris les informations du médecin et du patient

- **Notes d'un rendez-vous** : `GET /api/appointment-notes?appointmentId=:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Retourne les notes associées à un rendez-vous

### Utilisateurs

- **Liste des utilisateurs** : `GET /api/users`
- **Détails d'un utilisateur** : `GET /api/users/:id`
- **Créer un utilisateur** : `POST /api/users`
- **Modifier un utilisateur** : `PUT /api/users/:id`
- **Supprimer un utilisateur** : `DELETE /api/users/:id`

### Autres points d'API pertinents pour l'administration

- Spécialisations : `/api/specializations`
- Disponibilités : `/api/availability`
- Notifications : `/api/notifications`

## Configuration du client HTTP

Exemple de configuration avec Axios dans votre application React :

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(`${import.meta.env.VITE_STORAGE_PREFIX}token`);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
```

## Gestion des sessions

L'authentification est basée sur les JWT (JSON Web Tokens). Vous devrez :

1. Stocker le token reçu lors de la connexion dans le localStorage
2. Inclure ce token dans les en-têtes des requêtes API
3. Gérer l'expiration des tokens et la déconnexion

## Vérification des rôles administrateur

Pour sécuriser votre application web d'administrateur, assurez-vous de vérifier que l'utilisateur connecté possède bien le rôle "admin" après la connexion :

```javascript
// Exemple de vérification du rôle après connexion
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;
    
    // Vérifier si l'utilisateur est un administrateur
    if (user.role !== 'admin') {
      throw new Error('Accès non autorisé. Seuls les administrateurs peuvent accéder à cette application.');
    }
    
    // Stocker le token et les informations utilisateur
    localStorage.setItem(`${import.meta.env.VITE_STORAGE_PREFIX}token`, token);
    localStorage.setItem(`${import.meta.env.VITE_STORAGE_PREFIX}user`, JSON.stringify(user));
    
    return user;
  } catch (error) {
    throw error;
  }
};
```

## Déploiement

Pour le déploiement en production :

1. Configurez les variables d'environnement appropriées
2. Assurez-vous que l'URL de l'API pointe vers votre serveur de production
3. Vérifiez que le domaine de votre application web d'administrateur est bien inclus dans la liste des origines CORS autorisées sur le serveur backend 