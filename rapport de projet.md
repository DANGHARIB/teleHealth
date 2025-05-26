# Rapport de projet - Système de Télésanté

## Sommaire
1. [Introduction](#introduction)
2. [Stack Technologique](#stack-technologique)
3. [Architecture du Projet](#architecture-du-projet)
4. [Frontend](#frontend)
   - [Structure](#structure-frontend)
   - [Composants Réutilisables](#composants-réutilisables)
   - [Styles et UI/UX](#styles-et-uiux)
   - [Navigation](#navigation)
   - [Gestion d'État](#gestion-détat)
   - [Services et API](#services-et-api)
5. [Backend](#backend)
   - [Structure](#structure-backend)
   - [Modèles](#modèles)
   - [Contrôleurs](#contrôleurs)
   - [Routes](#routes)
   - [Services](#services)
   - [Middlewares](#middlewares)
6. [Base de Données](#base-de-données)
   - [Modèle de Données](#modèle-de-données)
   - [Schémas MongoDB](#schémas-mongodb)
7. [Intégration Frontend-Backend](#intégration-frontend-backend)
   - [Communication API](#communication-api)
   - [Authentification et Autorisation](#authentification-et-autorisation)
8. [Fonctionnalités Clés](#fonctionnalités-clés)
9. [Conclusion](#conclusion)

## Introduction
Ce document présente le rapport technique détaillé du projet de télésanté. Le système développé est une plateforme complète permettant la gestion des consultations médicales à distance, incluant la prise de rendez-vous, les consultations vidéo, la gestion des dossiers patients, et plus encore.

## Stack Technologique
Notre application repose sur un stack MERN (MongoDB, Express, React Native, Node.js) modernisé:

**Frontend:**
- React Native avec Expo
- Expo Router pour la navigation
- Axios pour les requêtes HTTP
- AsyncStorage pour le stockage local
- Bibliothèques UI: Expo Vector Icons, Expo Image, React Native Reanimated
- Plusieurs modules Expo pour des fonctionnalités natives

**Backend:**
- Node.js avec Express
- MongoDB avec Mongoose pour l'ORM
- JWT pour l'authentification
- Bcrypt pour le hachage des mots de passe
- Multer pour la gestion des fichiers
- Winston pour la journalisation
- Nodemailer pour l'envoi d'emails
- Node-schedule pour les tâches planifiées

**Outils de Développement:**
- TypeScript pour le typage statique (frontend)
- ESLint pour le linting
- Nodemon pour le rechargement automatique du serveur

## Architecture du Projet

L'architecture de notre projet suit une structure moderne et modulaire, divisée clairement entre le frontend et le backend, avec une communication via API REST.

### Organisation Générale

```
teleHealth/
├── frontend/          # Application React Native avec Expo
├── backend/           # Serveur Node.js/Express
├── scripts/           # Scripts utilitaires
└── logs/              # Journaux d'application
```

Cette séparation nette entre frontend et backend nous permet de suivre une approche de développement découplée, où chaque partie peut évoluer indépendamment tant que les contrats d'API sont respectés.

## Frontend

### Structure Frontend

Le frontend est structuré selon les principes de développement React Native moderne avec Expo, et organisé par fonctionnalités et types de composants:

```
frontend/
├── app/                # Routage et écrans principaux (Expo Router)
│   ├── (doctor)/       # Routes spécifiques aux médecins (groupe)
│   ├── (patient)/      # Routes spécifiques aux patients (groupe)
│   ├── doctor/         # Écrans des médecins
│   ├── patient/        # Écrans des patients
│   ├── _layout.tsx     # Layout principal
│   ├── +not-found.tsx  # Page d'erreur 404
│   └── index.js        # Page d'accueil
├── components/         # Composants réutilisables
│   ├── ui/             # Éléments d'interface utilisateur
│   └── ...             # Autres composants
├── contexts/           # Contextes React pour la gestion d'état
├── services/           # Services pour la communication API
├── constants/          # Constantes et configurations
├── hooks/              # Hooks personnalisés
└── assets/             # Ressources statiques (images, fonts)
```

### Composants Réutilisables

Notre approche de développement frontend repose fortement sur des composants réutilisables et modulaires qui permettent une maintenance simplifiée et une cohérence de l'interface utilisateur. Voici les principaux composants que nous avons développés:

#### Composants UI de Base

Nous avons créé un ensemble de composants de base qui encapsulent des styles et comportements récurrents:

- **ThemedText.tsx**: Composant de texte qui s'adapte automatiquement au thème de l'application
- **ThemedView.tsx**: Conteneur avec adaptation au thème
- **Collapsible.tsx**: Élément pliable/dépliable pour afficher/masquer du contenu
- **ParallaxScrollView.tsx**: Défilement avec effet parallaxe pour les listes
- **ExternalLink.tsx**: Liens vers des ressources externes
- **HapticTab.tsx**: Composant d'onglet avec retour haptique

#### Composants de Notification

Le système de notification utilise plusieurs composants spécialisés:
- **NotificationsModal.tsx**: Modal d'affichage des notifications
- **NotificationHandler.js**: Gestionnaire de notifications
- **NotificationIcon.tsx** et **NotificationBadge.tsx**: Indicateurs visuels

Cette approche modulaire nous permet de réutiliser ces composants dans différentes parties de l'application tout en maintenant une cohérence visuelle et comportementale.

### Styles et UI/UX

Notre application utilise une approche de stylisation cohérente et moderne:

#### Système de Thèmes

Nous avons implémenté un système de thème complet qui permet:
- Le passage entre mode clair et sombre
- Des couleurs définies de manière centralisée
- Une adaptation automatique aux préférences système de l'utilisateur

#### Composants Stylisés

Les composants UI utilisent une approche de styling JavaScript qui:
- S'appuie sur les propriétés de style natif de React Native
- Implémente des valeurs constantes pour les espacements, rayons de bordure et typographie
- Assure une cohérence visuelle sur toutes les plateformes

#### Éléments d'Interface Utilisateur

L'interface de l'application intègre:
- Des animations fluides avec React Native Reanimated
- Des effets visuels comme le flou avec Expo Blur
- Des transitions entre les écrans pour une expérience fluide
- Un retour haptique pour les interactions importantes (via Expo Haptics)

### Navigation

La navigation est gérée via Expo Router, une solution moderne basée sur le système de fichiers:

#### Structure de Navigation

L'application utilise une structure de navigation hiérarchique:
- Navigation à onglets pour les sections principales
- Navigateurs imbriqués pour les flux spécifiques (médecin/patient)
- Modals pour les actions contextuelles

#### Séparation des Flux

La navigation est organisée selon les rôles utilisateur:
- Le dossier `app/(doctor)/` contient les routes accessibles uniquement aux médecins
- Le dossier `app/(patient)/` contient les routes pour les patients
- Les routes communes sont à la racine du dossier `app/`

Cette séparation permet une gestion claire des autorisations et des flux utilisateur distincts.

### Gestion d'État

La gestion d'état utilise plusieurs approches complémentaires:

#### Contextes React

Les contextes fournissent un état global accessible dans tout l'arbre de composants:
- `contexts/`: Définition des différents contextes de l'application

#### Stockage Local

AsyncStorage est utilisé pour la persistance des données entre les sessions:
- Informations d'authentification (token JWT)
- Préférences utilisateur
- Mise en cache de certaines données

#### État des Composants

L'état local des composants est géré via les hooks React standards:
- `useState` pour l'état simple
- `useReducer` pour les états complexes
- `useMemo` et `useCallback` pour les optimisations de performance

### Services et API

La communication avec le backend est structurée via des services dédiés:

#### Fichiers de Services

- `services/api.js`: Points d'accès à l'API regroupés par domaine fonctionnel
- `services/authService.js`: Gestion de l'authentification
- `services/notificationService.js`: Gestion des notifications

#### Architecture Client HTTP

Le client HTTP est configuré avec:
- Axios comme bibliothèque de requêtes
- Des intercepteurs pour l'ajout automatique des tokens d'authentification
- Une gestion centralisée des erreurs
- Un système de mise en cache pour limiter les appels réseau

Cette architecture permet une communication efficace et sécurisée avec le backend, tout en garantissant une expérience utilisateur fluide même en cas de connectivité réseau instable.

## Backend

### Structure Backend

Le backend est structuré selon une architecture MVC (Modèle-Vue-Contrôleur) adaptée pour une API REST, organisée par responsabilités:

```
backend/
├── server.js           # Point d'entrée de l'application
├── models/             # Modèles et schémas MongoDB
├── controllers/        # Logique métier et traitement des requêtes
├── routes/             # Définition des endpoints API
├── middlewares/        # Middlewares pour l'authentification, etc.
├── services/           # Services métier réutilisables
├── config/             # Configuration (DB, logging, etc.)
├── utils/              # Fonctions utilitaires
├── uploads/            # Stockage des fichiers uploadés
└── scripts/            # Scripts pour maintenance, seeding, etc.
```

Cette organisation permet:
- Une séparation claire des responsabilités
- Une meilleure testabilité de chaque composant
- Une maintenance simplifiée
- Une évolutivité facilitée

### Modèles

Les modèles définissent la structure des données dans MongoDB via Mongoose. Notre application comprend plusieurs modèles interconnectés:

#### Utilisateurs et Authentification

```javascript
// User.js - Modèle central pour l'authentification
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Patient', 'Doctor', 'Admin'], required: true },
  verified: { type: Boolean, default: false },
  // Autres champs...
});
```

Les modèles `Patient` et `Doctor` étendent les fonctionnalités de base des utilisateurs:

```javascript
// Patient.js
const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Informations spécifiques aux patients...
});

// Doctor.js
const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  full_name: {
    type: String,
    // Le nom complet est dérivé du modèle User lors de l'inscription
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  specialization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialization',
  },
  doctor_image: {
    type: String
  },
  about: {
    type: String
  },
  education: {
    type: String
  },
  experience: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  dob: {
    type: Date
  },
  certifications: { // Tableau de chemins de fichiers pour les certificats
    type: [String],
    default: []
  },
  specializations: [{ // Possibilité d'avoir plusieurs spécialisations
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialization'
  }]
}, {
  timestamps: true
});
```

#### Gestion des Rendez-vous

```javascript
// Appointment.js
const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  dateTime: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  meetingLink: { type: String },
  // Autres informations sur le rendez-vous...
});
```

#### Disponibilité des Médecins

```javascript
// Availability.js
const availabilitySchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  // Autres informations sur la disponibilité...
});
```

#### Notifications

```javascript
// Notification.js
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  // Métadonnées additionnelles...
});
```

#### Paiements

```javascript
// Payment.js et PaymentMethod.js
const paymentSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  // Autres informations de paiement...
});
```

#### Questionnaires Médicaux

```javascript
// Question.js
const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['YesNo', 'MultiChoice', 'Text'],
    required: true
  },
  options: {
    type: mongoose.Schema.Types.Mixed,
    required: function() {
      return this.type === 'MultiChoice';
    }
  },
  scoring: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  id: {
    type: Number,
    required: true
  },
  specialization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialization'
  },
  targetGroup: {
    type: String,
    enum: ['child', 'adult', 'disability', 'all'],
    default: 'all'
  }
});

// PatientResponse.js
const patientResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  response: {
    type: String,
    required: true
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
```

Les modèles implémentent:
- Des validateurs pour assurer l'intégrité des données
- Des hooks pre/post pour les opérations automatiques (ex: hashage des mots de passe)
- Des méthodes d'instance pour les fonctionnalités spécifiques
- Des relations bien définies entre les entités

### Contrôleurs

Les contrôleurs servent d'intermédiaires entre les routes et les modèles. Ils contiennent la logique métier de l'application:

#### Authentification et Gestion des Utilisateurs

Le contrôleur `authController.js` gère toutes les fonctionnalités liées à l'authentification:

```javascript
// Inscription utilisateur
exports.register = async (req, res) => {
  try {
    // Extraction des données de la requête
    const { fullName, email, password, role } = req.body;
    
    // Vérification si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Utilisateur existe déjà' });
    }
    
    // Génération OTP et création utilisateur
    const otpCode = generateOTP();
    const user = await User.create({ fullName, email, password, role, otp_code: otpCode });
    
    // Création du profil spécifique (patient ou médecin)
    if (role === 'Patient') {
      await Patient.create({ user: user._id });
    } else if (role === 'Doctor') {
      await Doctor.create({ user: user._id, full_name: fullName });
    }
    
    // Envoi du code OTP par email
    await sendOtpEmail(email, otpCode);
    
    // Retour de la réponse
    res.status(201).json({
      _id: user._id,
      // Autres données utilisateur
      token: generateToken(user._id)
    });
  } catch (error) {
    // Gestion des erreurs
    res.status(500).json({ message: error.message });
  }
};

// Autres méthodes d'authentification...
```

#### Gestion des Rendez-vous

Le contrôleur `appointmentController.js` implémente une logique complexe pour la gestion des rendez-vous:

```javascript
// Création d'un nouveau rendez-vous
exports.createAppointment = async (req, res) => {
  try {
    // Extraction et validation des données
    const { doctorId, date, time } = req.body;
    
    // Vérification de la disponibilité du médecin
    const isAvailable = await checkDoctorAvailability(doctorId, date, time);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Le médecin n\'est pas disponible à cette date et heure' });
    }
    
    // Création du rendez-vous
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      dateTime: new Date(`${date}T${time}`),
      // Autres données du rendez-vous
    });
    
    // Notification au médecin
    await createNotification({
      recipient: doctorId,
      sender: req.user._id,
      type: 'new_appointment',
      content: `Nouveau rendez-vous le ${formatDate(date)} à ${time}`
    });
    
    // Réponse
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Autres méthodes de gestion des rendez-vous...
```

#### Notifications

Le contrôleur `notificationController.js` gère le système de notifications en temps réel:

```javascript
// Récupération des notifications de l'utilisateur
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate('sender', 'fullName role');
      
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    // Vérification que la notification appartient à l'utilisateur
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

Les contrôleurs sont conçus pour:
- Traiter les requêtes HTTP et produire des réponses appropriées
- Implémenter la logique métier, avec validation et traitement des données
- Déléguer les opérations complexes à des services spécialisés
- Gérer les erreurs de manière centralisée avec journalisation appropriée

### Routes

Les routes définissent les points d'entrée de l'API et connectent les URL aux contrôleurs:

#### Structure des Routes

Chaque domaine fonctionnel possède son propre fichier de routes:

```javascript
// auth.js - Routes d'authentification
const express = require('express');
const router = express.Router();
const { register, login, getUserProfile, verifyOTP } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);

// Routes protégées
router.get('/profile', protect, getUserProfile);

module.exports = router;
```

#### Protection des Routes

Le middleware `protect` vérifie l'authentification sur les routes protégées:

```javascript
// authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  
  // Vérifier la présence du token dans les headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, pas de token' });
  }
  
  try {
    // Vérifier la validité du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Rechercher l'utilisateur correspondant
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    res.status(401).json({ message: 'Non autorisé, token invalide' });
  }
};
```

### Services

Les services encapsulent des opérations complexes et réutilisables:

```javascript
// emailService.js - Service d'envoi d'emails
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

exports.sendOtpEmail = async (email, otpCode) => {
  try {
    // Configuration du transporteur
    const transporter = nodemailer.createTransport({
      // Configuration SMTP...
    });
    
    // Envoi de l'email
    await transporter.sendMail({
      to: email,
      subject: 'Votre code de vérification',
      html: `<p>Votre code de vérification est: <strong>${otpCode}</strong></p>`,
    });
    
    logger.info(`Email envoyé à ${email}`);
  } catch (error) {
    logger.error(`Erreur d'envoi d'email: ${error.message}`);
    throw error;
  }
};
```

#### Service d'Évaluation Médicale

Notre application intègre un système d'évaluation sophistiqué pour orienter les patients vers les spécialistes appropriés:

```javascript
// assessmentService.js - Service d'évaluation médicale
const specializations = {
  EMOTIONAL_SUPPORT : '68277ad1a509f09b51a8e84a',
  DISABILITY_SUPPORT: '68277ad1a509f09b51a8e84c',
  PTSD_TRAUMA       : '68277ad1a509f09b51a8e84b',
  CHILD_DEVELOPMENT : '68277ad1a509f09b51a8e849',
  DEPRESSION_ANXIETY: '68286253d9598f93465bbbbf',
};

// Algorithme de recommandation basé sur les réponses
function recommendSpecializations(answers) {
  const scores = {};

  // Parcourir toutes les réponses
  Object.keys(answers).forEach(questionId => {
    const question = assessmentQuestions.find(q => q.id === parseInt(questionId));
    if (!question) return;
    
    const userAnswer = answers[questionId];
    if (!userAnswer) return;
    
    let target;
    
    if (question.type === 'YesNo') {
      target = question.scoring[userAnswer];
    } else if (question.type === 'MultiChoice') {
      target = question.scoring[userAnswer];
    }
    
    if (target) {
      scores[target] = (scores[target] || 0) + 1;
    }
  });

  // Retourner les spécialisations triées par score décroissant
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([specializationId, score]) => ({ specializationId, score }));
}
```

Ce service permet:
- La définition d'un ensemble standardisé de questions d'évaluation
- La catégorisation des questions par type de spécialisation
- Un algorithme intelligent de scoring pour recommander des spécialistes
- L'adaptation des recommandations aux besoins spécifiques (enfants, adultes, personnes handicapées)

### Middlewares

Outre le middleware d'authentification, notre application utilise plusieurs middlewares spécialisés:

```javascript
// Gestion des erreurs
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

// Journalisation des requêtes
const requestLogger = (req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
};

// Gestion des fichiers uploadés
const upload = multer({ 
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
});
```

## Base de Données

### Architecture de la Base de Données

Notre application utilise MongoDB comme base de données NoSQL, ce qui offre plusieurs avantages:
- Flexibilité du schéma pour une évolution rapide
- Modèle de données orienté document qui correspond bien aux objets JavaScript
- Haute performance pour les opérations de lecture/écriture
- Scalabilité horizontale

### Schémas MongoDB

Les schémas MongoDB définissent la structure et les validations des documents:

#### Relations entre les Modèles

Le diagramme ci-dessous illustre les principales relations entre nos modèles:

```
User
 ├── Patient (1:1)
 │    └── Appointments (1:N)
 │    └── PatientResponses (1:N)
 └── Doctor (1:1)
      ├── Specialization (N:1)
      ├── Availability (1:N)
      └── Appointments (1:N)
          └── AppointmentNotes (1:N)
          └── Payments (1:1)
```

#### Indexation et Performance

Pour optimiser les performances, plusieurs index ont été définis:

```javascript
// Indexation du modèle User
userSchema.index({ email: 1 }, { unique: true });

// Indexation des rendez-vous
appointmentSchema.index({ doctor: 1, dateTime: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ status: 1 });

// Indexation des notifications
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
```

### Gestion des Relations

Bien que MongoDB soit une base de données NoSQL, notre implémentation utilise des relations entre documents via des références:

```javascript
// Récupération d'un rendez-vous avec les informations patient et médecin
const appointment = await Appointment.findById(id)
  .populate('patient', 'fullName')
  .populate({
    path: 'doctor',
    select: 'fullName specialization',
    populate: { path: 'specialization', select: 'name' }
  });
```

Cette approche nous permet de maintenir l'intégrité référentielle tout en bénéficiant de la flexibilité de MongoDB.

## Intégration Frontend-Backend

L'intégration entre le frontend et le backend est un élément critique qui permet à notre application de fonctionner comme un système cohérent et performant. Nous avons mis en place une architecture client-serveur moderne qui facilite la communication efficace entre les deux parties.

### Communication API

#### Architecture des Services Frontend

Notre frontend utilise une couche de services bien structurée pour interagir avec l'API backend:

```javascript
// services/api.js - Configuration du client API
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// URL de base de l'API depuis les variables d'environnement
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.0.106:5000/api';

// Créer une instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

#### Services API Spécialisés

La communication est organisée par domaine fonctionnel:

```javascript
// services/authService.js - Service d'authentification
export const authService = {
  // Inscription d'un nouvel utilisateur
  register: async (userData) => {
    try {
      const response = await authApi.post('/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de l\'inscription' };
    }
  },
  
  // Connexion
  login: async (credentials) => {
    try {
      const response = await authApi.post('/login', credentials);
      
      // Stocker le token et les infos utilisateur
      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Identifiants incorrects' };
    }
  },
  
  // Autres méthodes d'authentification...
};
```

#### Gestion des Erreurs et États de Chargement

L'application implémente une gestion robuste des erreurs et des états de chargement:

```javascript
// Exemple d'utilisation dans un composant
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await someApiService.getData();
    // Traitement des données...
  } catch (err) {
    setError(err.message || 'Une erreur est survenue');
    // Affichage de notification d'erreur...
  } finally {
    setLoading(false);
  }
};
```

### Authentification et Autorisation

#### Flux d'Authentification

Notre système implémente un flux d'authentification complet:

1. **Inscription**: L'utilisateur s'inscrit en fournissant ses informations
2. **Vérification par OTP**: Un code de vérification est envoyé par email
3. **Connexion**: L'utilisateur se connecte avec ses identifiants
4. **Gestion des sessions**: Utilisation de tokens JWT stockés localement
5. **Déconnexion**: Nettoyage des données de session lors de la déconnexion

#### Sécurisation des Requêtes

Toutes les requêtes nécessitant une authentification incluent le token JWT:

```javascript
// Intercepteur Axios pour inclure le token dans chaque requête
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### Protection des Routes Backend

Du côté backend, un middleware vérifie l'authenticité du token:

```javascript
// middleware/authMiddleware.js
exports.protect = async (req, res, next) => {
  // Extraction et vérification du token...
  // Ajout des informations utilisateur à la requête
  req.user = await User.findById(decoded.id).select('-password');
  next();
};
```

#### Gestion des Rôles et Autorisations

Les autorisations sont gérées selon le rôle de l'utilisateur:

```javascript
// middleware/authMiddleware.js
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Vous n\'avez pas la permission d\'effectuer cette action'
      });
    }
    next();
  };
};

// Utilisation dans les routes
router.get('/doctors/dashboard', 
  protect, 
  restrictTo('Doctor', 'Admin'),
  getDoctorDashboard
);
```

### Stratégies d'Optimisation

#### Mise en Cache

L'application implémente plusieurs niveaux de mise en cache pour optimiser les performances:

1. **Cache côté client**:
   - Stockage local des données fréquemment utilisées
   - Invalidation du cache basée sur les timestamps

2. **Requêtes optimisées**:
   - Pagination des résultats volumineux
   - Chargement conditionnel basé sur la visibilité des composants

#### État de Connectivité

L'application gère intelligemment l'état de connectivité:

```javascript
// Hook personnalisé de gestion de la connectivité
function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    // Surveillance de l'état de connectivité...
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);
  
  return isConnected;
}
```

## Fonctionnalités Clés

Notre application de télésanté offre un ensemble complet de fonctionnalités pour les patients et les médecins:

### Pour les Patients

1. **Profil de Santé**: Renseignement d'informations médicales personnelles
2. **Évaluation Initiale**: Questionnaire intelligent pour orienter vers le spécialiste adapté
3. **Recherche de Médecins**: Filtrage par spécialité, évaluations, disponibilité
4. **Prise de Rendez-vous**: Consultation des disponibilités et réservation
5. **Consultations Vidéo**: Téléconsultations via intégration Zoom
6. **Paiements Sécurisés**: Règlement des consultations en ligne
7. **Historique Médical**: Accès aux antécédents de consultation
8. **Rappels et Notifications**: Alertes de rendez-vous et suivi

### Pour les Médecins

1. **Gestion du Profil**: Configuration des informations professionnelles
2. **Planning des Disponibilités**: Définition des créneaux de consultation
3. **Gestion des Rendez-vous**: Vue d'ensemble et détails des consultations
4. **Dossiers Patients**: Accès et mise à jour des informations médicales
5. **Notes de Consultation**: Enregistrement des observations et prescriptions
6. **Suivi des Paiements**: Tableaux de bord financiers
7. **Module de Communication**: Échanges sécurisés avec les patients

### Fonctionnalités Transversales

1. **Système de Notifications**: Alertes en temps réel pour les événements importants
2. **Authentification Sécurisée**: Protection par OTP et JWT
3. **Journalisation Avancée**: Suivi des activités pour audit et débogage
4. **Mode Hors-ligne**: Fonctionnalités de base disponibles sans connexion
5. **UI/UX Adaptative**: Interface s'ajustant aux différents appareils et préférences

#### Système d'Orientation des Patients

Notre plateforme utilise des évaluations ciblées pour chaque patient:

1. **Questionnaire d'Évaluation Initiale**: Proposé dès l'inscription du patient
2. **Algorithme d'Orientation**: Analyse des réponses pour recommander des spécialistes
3. **Catégorisation des Besoins**: Identification des problématiques principales:
   - Dépression et anxiété
   - Traumatisme et TSPT
   - Soutien émotionnel
   - Handicap et accessibilité
   - Développement de l'enfant
4. **Score de Compatibilité**: Classement des spécialistes selon leur adéquation au profil

Ce système sophistiqué permet:
- Une meilleure adéquation entre patients et spécialistes
- Une réduction du temps nécessaire pour trouver le bon médecin
- Une expérience personnalisée pour chaque patient
- Une optimisation des résultats thérapeutiques

### Recherche et Filtrage des Médecins

Notre système permet aux patients de trouver le médecin le plus adapté à leurs besoins:

1. **Recherche Multicritères**: Les patients peuvent rechercher des médecins selon:
   - Leur spécialisation (issue de l'évaluation initiale)
   - Leur expérience professionnelle
   - Leur tarif de consultation
   - Leur disponibilité

2. **Profil Détaillé du Médecin**: Chaque médecin dispose d'un profil complet incluant:
   - Photo professionnelle
   - Présentation personnalisée
   - Formation et parcours académique
   - Années d'expérience
   - Certifications et accréditations professionnelles
   - Tarifs des consultations

3. **Vérification des Qualifications**: Un système de badge "vérifié" indique que les qualifications du médecin ont été validées par notre équipe, garantissant la qualité des soins proposés.

## Conclusion

Le développement de cette plateforme de télésanté représente un effort significatif d'intégration de technologies modernes pour résoudre des problèmes concrets dans le domaine de la santé. Notre architecture modulaire et évolutive répond efficacement aux défis spécifiques de ce secteur:

### Points Forts Techniques

1. **Architecture Découplée**: La séparation claire entre frontend et backend permet une évolution indépendante des composants.

2. **Sécurité et Confidentialité**: L'implémentation de standards élevés de sécurité (JWT, OTP, encryption) protège les données sensibles des patients.

3. **Scalabilité**: La conception basée sur MongoDB et l'architecture en microservices facilite la montée en charge.

4. **Expérience Utilisateur Optimisée**: L'interface utilisateur réactive et intuitive, avec des composants réutilisables, offre une navigation fluide.

5. **Maintenance Facilitée**: L'organisation du code, la documentation et les pratiques de développement modernes simplifient la maintenance.

### Perspectives d'Évolution

Notre plateforme a été conçue pour évoluer facilement avec plusieurs améliorations possibles:

1. **Intégration d'Intelligence Artificielle**: Assistance au diagnostic et analyse prédictive des données patients.

2. **Expansion des Intégrations**: Connexions avec d'autres systèmes de santé et dispositifs médicaux connectés.

3. **Internationalisation**: Support multi-langues et adaptation aux réglementations sanitaires internationales.

4. **Télémédecine Avancée**: Intégration d'outils de réalité augmentée pour l'assistance à distance.

Ce projet illustre comment une architecture logicielle bien conçue peut servir efficacement le secteur de la santé en associant robustesse technique et expérience utilisateur intuitive.

N'hésitez pas à nous contacter si vous avez des questions ou des besoins supplémentaires. 