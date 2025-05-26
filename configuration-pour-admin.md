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
  - Corps : `{ email, password, firstName, lastName, role: "Admin" }`
  - Réponse : `{ user, token }`
  - Note : Le rôle doit être "Admin" avec un "A" majuscule

- **Login administrateur** : `POST /api/auth/login`
  - Corps : `{ email, password, role: "Admin" }`
  - Réponse : `{ user, token }`
  - Note : Spécifier le rôle "Admin" est recommandé

- **Profil administrateur** : `GET /api/auth/profile`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Cette route vérifie automatiquement les permissions d'administrateur

### Gestion des Médecins

- **Liste complète des médecins** : `GET /api/doctors`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `?page=1&limit=20&sort=createdAt&order=desc`
  - Format de réponse :
    ```json
    [
      {
        "_id": "string",
        "first_name": "string",
        "last_name": "string",
        "full_name": "string",
        "email": "string",
        "specialization": {
          "_id": "string",
          "name": "string"
        },
        "verified": "boolean",
        "gender": "string",
        "experience": "number",
        "price": "number",
        "about": "string",
        "education": "string",
        "certifications": ["string"],
        "specializations": [
          {
            "_id": "string", 
            "name": "string"
          }
        ],
        "doctor_image": "string",
        "dob": "date",
        "user": {
          "_id": "string", 
          "email": "string",
          "firstName": "string", 
          "lastName": "string"
        },
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
    ```
    - Note: `specialization` est un ObjectId référençant le modèle 'Specialization'
    - Note: `specializations` est un tableau d'ObjectIds référençant le modèle 'Specialization'
    - Note: Les champs `specialization` et `user` peuvent être peuplés ou non selon les paramètres de la requête

- **Détails d'un médecin** : `GET /api/doctors/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Inclut les informations personnelles et professionnelles

- **Recherche de médecins** : `GET /api/doctors/search`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `?search=term&specialization=value`

- **Vérifier un médecin** : `PATCH /api/doctors/:id/verify`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

- **Rejeter un médecin** : `PATCH /api/doctors/:id/reject`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Corps : `{ reason: "string" }`

- **Finances d'un médecin** : `GET /api/doctors/:id/finances`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Retourne les données financières complètes du médecin

- **Nombre de patients d'un médecin** : `GET /api/doctors/:id/patients/count`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Retourne le nombre de patients associés au médecin
  - Format de réponse :
    ```json
    {
      "doctorId": "string",
      "patientCount": "number",
      "timestamp": "date"
    }
    ```

- **Paiements d'un médecin** : `GET /api/payments?doctorId=:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=completed`
  - Retourne l'historique des paiements du médecin

### Gestion des Patients

- **Liste complète des patients** : `GET /api/patients`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `?page=1&limit=20&sort=createdAt&order=desc`
  - Format de réponse :
    ```json
    [
      {
        "_id": "string",
        "first_name": "string",
        "last_name": "string",
        "date_of_birth": "date",
        "gender": "string",
        "has_taken_assessment": "boolean",
        "savedDoctors": [
          {
            "_id": "string",
            "full_name": "string"
          }
        ],
        "user": {
          "_id": "string",
          "email": "string"
        },
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
    ```
    - Note: `savedDoctors` est un tableau d'ObjectIds référençant le modèle 'Doctor'
    - Note: `user` est un ObjectId référençant le modèle 'User'

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
  - Format de réponse :
    ```json
    [
      {
        "_id": "string",
        "doctor": {
          "_id": "string",
          "first_name": "string",
          "last_name": "string",
          "full_name": "string"
        },
        "patient": {
          "_id": "string",
          "first_name": "string",
          "last_name": "string"
        },
        "availability": {
          "_id": "string",
          "date": "date",
          "slots": ["object"]
        },
        "slotDate": "date",
        "slotStartTime": "string",
        "slotEndTime": "string",
        "duration": "number",
        "status": "string", 
        "sessionLink": "string",
        "caseDetails": "string",
        "price": "number",
        "paymentStatus": "string",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
    ```
  - Valeurs possibles pour `status` : "scheduled", "confirmed", "completed", "cancelled", "reschedule_requested"
  - Note: `doctor` est un ObjectId référençant le modèle 'Doctor'
  - Note: `patient` est un ObjectId référençant le modèle 'Patient'
  - Note: `availability` est un ObjectId référençant le modèle 'Availability'

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

- **Créer un rendez-vous** : `POST /api/appointments`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Corps :
    ```json
    {
      "doctor": "ObjectId",
      "patient": "ObjectId",
      "availability": "ObjectId",
      "slotStartTime": "string",
      "slotEndTime": "string",
      "duration": "number",
      "price": "number",
      "caseDetails": "string",
      "status": "string"
    }
    ```

- **Mettre à jour un rendez-vous** : `PUT /api/appointments/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Corps : Les champs à mettre à jour

- **Supprimer un rendez-vous** : `DELETE /api/appointments/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

### Notes des Rendez-vous

- **Notes d'un rendez-vous** : `GET /api/appointment-notes?appointmentId=:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Retourne les notes associées à un rendez-vous

- **Ajouter une note** : `POST /api/appointment-notes`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Corps : `{ appointmentId: "string", content: "string" }`

- **Détails d'une note** : `GET /api/appointment-notes/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

- **Mettre à jour une note** : `PUT /api/appointment-notes/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Corps : `{ content: "string" }`

- **Supprimer une note** : `DELETE /api/appointment-notes/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

### Paiements

- **Liste des paiements** : `GET /api/payments`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `?doctorId=id&patientId=id&startDate=date&endDate=date&status=status`

- **Détails d'un paiement** : `GET /api/payments/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

- **Créer un paiement** : `POST /api/payments`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Corps :
    ```json
    {
      "amount": "number",
      "doctorId": "string",
      "patientId": "string",
      "appointmentId": "string",
      "method": "string",
      "description": "string"
    }
    ```

- **Mettre à jour un paiement** : `PUT /api/payments/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

- **Statistiques de paiements** : `GET /api/payments/stats`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `?period=month`

### Méthodes de Paiement

- **Liste des méthodes de paiement** : `GET /api/payment-methods`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

- **Méthodes de paiement d'un utilisateur** : `GET /api/payment-methods?userId=:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

- **Détails d'une méthode de paiement** : `GET /api/payment-methods/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

### Disponibilités

- **Liste des disponibilités** : `GET /api/availability`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `?doctorId=id`

- **Détails d'une disponibilité** : `GET /api/availability/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

- **Créer une disponibilité** : `POST /api/availability`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

### Utilisateurs

- **Liste des utilisateurs** : `GET /api/users`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `?role=Admin&page=1&limit=20`

- **Détails d'un utilisateur** : `GET /api/users/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Format de réponse :
    ```json
    {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "isActive": "boolean",
      "createdAt": "date",
      "updatedAt": "date"
    }
    ```

- **Créer un utilisateur** : `POST /api/users`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Corps :
    ```json
    {
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "password": "string",
      "role": "string"
    }
    ```
  - Rôles possibles : "Admin", "Patient", "Doctor"

- **Modifier un utilisateur** : `PUT /api/users/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Corps : Les champs à mettre à jour

- **Supprimer un utilisateur** : `DELETE /api/users/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

### Spécialisations

- **Liste des spécialisations** : `GET /api/specializations`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Format de réponse :
    ```json
    [
      {
        "_id": "string",
        "name": "string",
        "description": "string",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
    ```

- **Détails d'une spécialisation** : `GET /api/specializations/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

- **Créer une spécialisation** : `POST /api/specializations`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Corps : `{ name: "string", description: "string" }`

- **Modifier une spécialisation** : `PUT /api/specializations/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

- **Supprimer une spécialisation** : `DELETE /api/specializations/:id`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

### Notifications

- **Liste des notifications** : `GET /api/notifications`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`
  - Paramètres optionnels : `?userId=id&read=true/false`

- **Marquer comme lue** : `PUT /api/notifications/:id/read`
  - Headers : `{ Authorization: "Bearer YOUR_TOKEN" }`

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

## Services Clients

Les services suivants sont déjà implémentés pour faciliter la communication avec l'API:

- `authService.js`: Gestion de l'authentification des utilisateurs
- `doctorsService.js`: Gestion des médecins
- `patientsService.js`: Gestion des patients 
- `appointmentsService.js`: Gestion des rendez-vous
- `paymentsService.js`: Gestion des paiements (avec fallback de données maquettes)
- `usersService.js`: Gestion des utilisateurs

### Mise à jour du service doctorsService.js

Pour intégrer la fonctionnalité de comptage des patients associés à un médecin, ajoutez la méthode suivante à votre service `doctorsService.js` :

```javascript
/**
 * Récupère le nombre de patients associés à un médecin
 * @param {string} doctorId - ID du médecin
 * @returns {Promise<number>} - Nombre de patients
 */
async getDoctorPatientCount(doctorId) {
  try {
    console.log(`🔢 Récupération du nombre de patients pour le médecin ${doctorId}...`);
    const response = await api.get(`/doctors/${doctorId}/patients/count`);
    console.log('✅ Nombre de patients récupéré:', response.data);
    
    return response.data.patientCount;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération du nombre de patients: ${error}`);
    return 0; // Valeur par défaut en cas d'erreur
  }
},

/**
 * Version enrichie de mapDoctorData pour inclure le nombre de patients
 * @param {Object} backendDoctor - Données du médecin depuis l'API
 * @param {number} patientCount - Nombre de patients (optionnel)
 * @returns {Object} - Données du médecin formatées pour le frontend
 */
async mapDoctorDataWithPatients(backendDoctor) {
  // Récupérer le nombre de patients si disponible
  let patientCount = 0;
  try {
    patientCount = await this.getDoctorPatientCount(backendDoctor._id);
  } catch (error) {
    console.warn(`Impossible de récupérer le nombre de patients: ${error.message}`);
  }

  // Utiliser mapDoctorData existant et ajouter patientCount
  const doctorData = this.mapDoctorData(backendDoctor);
  return {
    ...doctorData,
    patientCount
  };
},

/**
 * Version enrichie de getAllDoctors pour inclure le nombre de patients
 */
async getAllDoctorsWithPatientCount(params = {}) {
  try {
    console.log('🔍 Fetching doctors with patient counts...');
    const response = await api.get('/doctors', { params });
    
    // Transformer chaque médecin et ajouter le nombre de patients
    const doctorsWithPatients = await Promise.all(
      response.data.map(async doctor => {
        return await this.mapDoctorDataWithPatients(doctor);
      })
    );
    
    return doctorsWithPatients;
  } catch (error) {
    console.error('❌ Error fetching doctors with patient counts:', error);
    throw error.response?.data || { message: 'Error fetching doctors' };
  }
}
```

### Exemples d'utilisation

```jsx
// Dans un composant React
import { doctorsService } from '../services';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // Utiliser la nouvelle méthode qui inclut les décomptes de patients
        const doctorsData = await doctorsService.getAllDoctorsWithPatientCount();
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    
    fetchDoctors();
  }, []);
  
  return (
    <div>
      <h2>Liste des médecins</h2>
      <ul>
        {doctors.map(doctor => (
          <li key={doctor.id}>
            {doctor.displayName} - {doctor.specialty} - 
            <strong>{doctor.patientCount} patients</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## Transformation des données

Les services côté client sont responsables de la transformation des données entre le format API et le format utilisé par le frontend:

### Exemple - Transformation des données médecin

```javascript
// Exemple de mapDoctorData dans doctorsService.js
mapDoctorData(backendDoctor) {
  return {
    id: backendDoctor._id,
    firstName: backendDoctor.first_name || '',
    lastName: backendDoctor.last_name || '',
    fullName: backendDoctor.full_name || `${backendDoctor.first_name || ''} ${backendDoctor.last_name || ''}`.trim(),
    email: backendDoctor.email || backendDoctor.user?.email || 'Not available',
    specialty: backendDoctor.specialization?.name || '',
    status: backendDoctor.verified ? 'verified' : 'pending',
    // Pour accéder aux spécialisations multiples si disponibles
    specializations: (backendDoctor.specializations || []).map(spec => ({
      id: spec._id || spec,
      name: spec.name || ''
    })),
    // ... autres champs
  };
}
```

### Exemple - Transformation des données rendez-vous

```javascript
// Exemple de transformAppointmentData dans appointmentsService.js
transformAppointmentData(apiAppointment) {
  return {
    id: apiAppointment._id,
    date: apiAppointment.slotDate,
    time: apiAppointment.slotStartTime || 'Time not set',
    // Gestion des références médecin/patient
    doctor: apiAppointment.doctor && typeof apiAppointment.doctor === 'object' 
      ? { 
          id: apiAppointment.doctor._id,
          name: `Dr. ${apiAppointment.doctor.full_name || apiAppointment.doctor.first_name}` 
        }
      : { id: apiAppointment.doctor, name: 'Unknown doctor' },
    // ... autres transformations
  };
}
```

### Exemple - Récupération du nombre de patients par médecin

```javascript
// Exemple d'ajout dans doctorsService.js
async getDoctorPatientCount(doctorId) {
  try {
    console.log(`🔢 Récupération du nombre de patients pour le médecin ${doctorId}...`);
    const response = await api.get(`/doctors/${doctorId}/patients/count`);
    console.log('✅ Nombre de patients récupéré:', response.data);
    
    return response.data.patientCount;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération du nombre de patients: ${error}`);
    return 0; // Valeur par défaut en cas d'erreur
  }
}
```

## Gestion des sessions

L'authentification est basée sur les JWT (JSON Web Tokens). La configuration :

1. Stocker le token reçu lors de la connexion dans le localStorage
2. Inclure ce token dans les en-têtes des requêtes API
3. Gérer l'expiration des tokens et la déconnexion

## Vérification des rôles administrateur

Pour sécuriser votre application web d'administrateur, assurez-vous de vérifier que l'utilisateur connecté possède bien le rôle "Admin" après la connexion :

```javascript
// Exemple de vérification du rôle après connexion
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password, role: 'Admin' });
    const { user, token } = response.data;
    
    // Vérifier si l'utilisateur est un administrateur
    if (user.role !== 'Admin') {
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