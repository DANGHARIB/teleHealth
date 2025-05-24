# Rapport Complet du Projet TeleHealth

## Table des matières
1. [Introduction](#introduction)
2. [Architecture Backend](#architecture-backend)
   - [Structure des dossiers](#structure-des-dossiers-backend)
   - [Technologies utilisées](#technologies-utilisées-backend)
   - [Modèles de données](#modèles-de-données)
   - [Contrôleurs](#contrôleurs)
   - [Routes API](#routes-api)
   - [Middlewares](#middlewares)
3. [Architecture Frontend](#architecture-frontend)
   - [Structure des dossiers](#structure-des-dossiers-frontend)
   - [Technologies utilisées](#technologies-utilisées-frontend)
   - [Navigation](#navigation)
   - [Services](#services)
   - [Composants](#composants)
4. [Intégration Backend-Frontend](#intégration-backend-frontend)
   - [Communication API](#communication-api)
   - [Authentification](#authentification)
   - [Gestion des données](#gestion-des-données)
5. [Fonctionnalités clés](#fonctionnalités-clés)
   - [Gestion des rendez-vous](#gestion-des-rendez-vous)
   - [Téléconsultation](#téléconsultation)
   - [Paiements](#paiements)
   - [Notifications](#notifications)
6. [Conclusion](#conclusion)

## Introduction

Le projet TeleHealth est une application mobile complète de télémédecine permettant la mise en relation entre patients et médecins pour des consultations à distance. Ce système comprend deux composants principaux : une API backend RESTful développée avec Node.js/Express et une application mobile frontend développée avec React Native (Expo).

L'application permet aux utilisateurs de rechercher des médecins par spécialité, de prendre rendez-vous, d'effectuer des consultations vidéo, de gérer des paiements, et de recevoir des notifications en temps réel.

## Architecture Backend

### Structure des dossiers backend

L'architecture backend suit le modèle MVC (Modèle-Vue-Contrôleur) et est organisée comme suit :

- **models/** : Définition des schémas et modèles de données MongoDB
- **controllers/** : Logique métier et traitement des requêtes
- **routes/** : Définition des points d'entrée API
- **middlewares/** : Fonctions intermédiaires pour l'authentification, la validation, etc.
- **config/** : Configuration de la base de données, logger, etc.
- **services/** : Services réutilisables (email, paiement, etc.)
- **scripts/** : Scripts utilitaires et tâches planifiées
- **uploads/** : Stockage des fichiers téléchargés
- **logs/** : Fichiers journaux de l'application

### Technologies utilisées backend

Le backend s'appuie sur les technologies suivantes :
- **Node.js** : Environnement d'exécution JavaScript côté serveur
- **Express** : Framework web pour créer des API RESTful
- **MongoDB** : Base de données NoSQL (via Mongoose)
- **JWT** : Authentification basée sur les tokens
- **Bcrypt** : Hachage sécurisé des mots de passe
- **Winston** : Journalisation avancée
- **Node-cron** : Planification de tâches

### Modèles de données

Les principaux modèles de données incluent :

- **User** : Modèle de base pour tous les utilisateurs du système
- **Doctor** : Profil spécifique aux médecins (spécialités, tarifs, etc.)
- **Patient** : Profil spécifique aux patients (antécédents médicaux, etc.)
- **Appointment** : Rendez-vous entre patients et médecins
- **AppointmentNote** : Notes médicales associées aux rendez-vous
- **Availability** : Disponibilités des médecins
- **Payment** : Transactions financières
- **PaymentMethod** : Méthodes de paiement enregistrées
- **Notification** : Notifications système
- **Question** : Questions médicales préalables
- **PatientResponse** : Réponses aux questions médicales
- **Specialization** : Spécialités médicales

### Contrôleurs

Les contrôleurs gèrent la logique métier et incluent :

- **authController** : Gestion de l'authentification (connexion, inscription)
- **userController** : Opérations CRUD sur les utilisateurs
- **doctorController** : Gestion des profils médecins
- **patientController** : Gestion des profils patients
- **appointmentController** : Création et gestion des rendez-vous
- **appointmentNoteController** : Gestion des notes médicales
- **availabilityController** : Gestion des disponibilités
- **paymentController** : Traitement des paiements
- **notificationController** : Gestion des notifications
- **specializationController** : Gestion des spécialités médicales
- **questionController** : Gestion des questionnaires médicaux

### Routes API

Les routes API définissent les points d'entrée RESTful :

- **/api/auth** : Authentification et gestion des profils
- **/api/users** : Gestion des utilisateurs
- **/api/doctors** : Opérations spécifiques aux médecins
- **/api/patients** : Opérations spécifiques aux patients
- **/api/appointments** : Gestion des rendez-vous
- **/api/availability** : Gestion des disponibilités
- **/api/payments** : Traitement des paiements
- **/api/payment-methods** : Gestion des méthodes de paiement
- **/api/notifications** : Gestion des notifications
- **/api/appointment-notes** : Gestion des notes médicales
- **/api/specializations** : Gestion des spécialités
- **/api/questions** : Gestion des questionnaires médicaux
- **/api/cron** : Endpoints pour les tâches planifiées

### Middlewares

Les middlewares assurent diverses fonctions :

- **Authentification** : Vérification des tokens JWT
- **Autorisation** : Contrôle des accès basé sur les rôles
- **Validation** : Validation des données entrantes
- **Gestion d'erreurs** : Capture et traitement des erreurs
- **Logging** : Enregistrement des activités et erreurs

## Architecture Frontend

### Structure des dossiers frontend

L'application mobile est structurée comme suit :

- **app/** : Pages principales de l'application (utilisant Expo Router)
  - **(patient)/** : Routes spécifiques aux patients
  - **(doctor)/** : Routes spécifiques aux médecins
- **components/** : Composants réutilisables
- **services/** : Services d'API et logique métier
- **contexts/** : Contextes React pour la gestion d'état globale
- **hooks/** : Hooks personnalisés
- **constants/** : Constantes et configurations
- **assets/** : Ressources statiques (images, polices, etc.)

### Technologies utilisées frontend

Le frontend s'appuie sur les technologies suivantes :
- **React Native** : Framework pour le développement d'applications mobiles
- **Expo** : Plateforme pour simplifier le développement React Native
- **Expo Router** : Système de navigation basé sur les fichiers
- **Axios** : Client HTTP pour les requêtes API
- **AsyncStorage** : Stockage local persistant
- **React Navigation** : Navigation entre les écrans
- **Expo Notifications** : Gestion des notifications push

### Navigation

L'application utilise Expo Router pour la navigation, organisée en :
- Navigation principale (tabs) pour les patients et médecins
- Navigation par pile pour les flux spécifiques
- Layouts imbriqués pour la réutilisation des éléments d'interface

### Services

Les services principaux incluent :
- **api.js** : Client API central avec intercepteurs pour l'authentification
- **authService.js** : Gestion de l'authentification et des sessions
- **notificationService.js** : Gestion des notifications push et locales

### Composants

L'application comprend divers composants réutilisables pour :
- Formulaires d'entrée
- Cartes de profil médecin
- Calendrier et sélection d'horaires
- Interface de chat/vidéo
- Éléments de paiement
- Indicateurs de chargement et notifications

## Intégration Backend-Frontend

### Communication API

L'intégration entre le backend et le frontend se fait principalement via :

1. **Client API centralisé** : Le fichier `api.js` définit un client Axios configuré avec :
   - URL de base provenant des variables d'environnement
   - Intercepteurs pour ajouter automatiquement les tokens d'authentification
   - Fonctions API organisées par domaine (auth, doctors, patients, etc.)

2. **Gestion des erreurs** : Traitement cohérent des erreurs API avec :
   - Intercepteurs de réponse pour capturer les erreurs
   - Propagation structurée des messages d'erreur
   - Refresh token automatique

### Authentification

Le système d'authentification comprend :

1. **JWT côté backend** : 
   - Génération de tokens lors de la connexion
   - Vérification des tokens pour les routes protégées
   - Refresh tokens pour maintenir la session

2. **Stockage sécurisé côté frontend** :
   - Stockage des tokens dans AsyncStorage
   - Ajout automatique des tokens aux en-têtes des requêtes
   - Déconnexion et nettoyage des tokens

### Gestion des données

La synchronisation des données entre backend et frontend comprend :

1. **Modèle de chargement** :
   - Chargement initial des données au démarrage
   - Mise à jour périodique des données critiques
   - Mise en cache locale pour améliorer les performances

2. **Flux de données bidirectionnel** :
   - Mises à jour en temps réel pour les notifications
   - Synchronisation des statuts de rendez-vous
   - Optimistic UI pour une meilleure expérience utilisateur

## Fonctionnalités clés

### Gestion des rendez-vous

Le système de rendez-vous permet :
- Recherche de médecins par spécialité
- Consultation des disponibilités
- Prise de rendez-vous avec paiement intégré
- Confirmation, annulation ou reprogrammation
- Rappels automatiques

### Téléconsultation

La fonctionnalité de téléconsultation comprend :
- Intégration d'une solution de visioconférence
- Partage de documents médicaux
- Prise de notes pendant la consultation
- Prescription électronique

### Paiements

Le système de paiement permet :
- Paiement sécurisé des consultations
- Gestion des méthodes de paiement
- Facturation automatique
- Historique des transactions

### Notifications

Le système de notifications inclut :
- Notifications push pour les événements importants
- Notifications in-app
- Rappels de rendez-vous
- Alertes de paiement

## Conclusion

Le projet TeleHealth est une solution complète de télémédecine intégrant un backend robuste et un frontend mobile intuitif. L'architecture modulaire et l'organisation claire du code permettent une maintenance facile et une évolution future du système.

L'utilisation de technologies modernes comme Node.js, MongoDB, React Native et Expo garantit des performances optimales et une expérience utilisateur fluide sur les appareils mobiles.

Les principaux points forts du projet sont :
- Architecture MVC claire et bien structurée
- Sécurité renforcée avec authentification JWT
- Intégration transparente entre backend et frontend
- Fonctionnalités complètes de télémédecine
- Interface utilisateur intuitive et responsive 