# Rapport d'Installation - Application TeleHealth

Ce rapport explique en détail comment installer et exécuter l'application TeleHealth sur n'importe quel PC.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les logiciels suivants :

- [Node.js](https://nodejs.org/) (version 14+ recommandée)
- [MongoDB](https://www.mongodb.com/try/download/community) (version 4.4+ recommandée)
- [Git](https://git-scm.com/downloads) pour le contrôle de version

## 1. Cloner le projet

```bash
# Cloner le dépôt Git
git clone <URL_DU_DEPOT> teleHealth

# Accéder au répertoire du projet
cd teleHealth
```

## 2. Configuration de la base de données MongoDB

### Installation locale de MongoDB

1. Assurez-vous que MongoDB est installé sur votre machine
2. Démarrez le service MongoDB
   - Windows: via les Services Windows ou `net start MongoDB`
   - Linux/Mac: `sudo systemctl start mongod`

### Création de la base de données

1. Ouvrez une console MongoDB:
   ```bash
   mongosh
   ```

2. Créez une nouvelle base de données:
   ```bash
   use telehealth
   ```

3. Vous pouvez quitter la console MongoDB avec:
   ```bash
   exit
   ```

## 3. Configuration du Backend

1. Accédez au dossier backend:
   ```bash
   cd backend
   ```

2. Installez les dépendances:
   ```bash
   npm install
   ```

3. Créez un fichier `.env` à la racine du dossier backend:
   ```bash
   # Sur Windows
   echo PORT=5000 > .env
   echo MONGODB_URI=mongodb://localhost:27017/telehealth >> .env
   echo JWT_SECRET=votre_secret_jwt_securise >> .env
   echo NODE_ENV=development >> .env

   # Sur Linux/Mac
   echo "PORT=5000" > .env
   echo "MONGODB_URI=mongodb://localhost:27017/telehealth" >> .env
   echo "JWT_SECRET=votre_secret_jwt_securise" >> .env
   echo "NODE_ENV=development" >> .env
   ```

4. **Modification de l'adresse IP (si nécessaire)**:
   
   Ouvrez le fichier `backend/server.js` et modifiez la configuration CORS pour inclure l'URL de votre frontend:
   ```javascript
   const corsOptions = {
     origin: [
       'http://localhost:5173', 
       'http://votre-ip:5173',
       // Ajoutez d'autres origines au besoin
     ],
     // ...
   };
   ```

5. Démarrez le serveur backend:
   ```bash
   # En mode développement avec redémarrage automatique
   npm run dev
   
   # Ou en mode standard
   npm start
   ```

   Le serveur backend sera accessible à l'adresse: http://localhost:5000

## 4. Configuration du Frontend

1. Accédez au dossier frontend:
   ```bash
   cd ../frontend
   ```

2. Installez les dépendances:
   ```bash
   npm install
   ```

3. **Configuration de l'adresse IP du backend**:
   
   Créez un fichier `.env` à la racine du dossier frontend:
   ```bash
   # Sur Windows
   echo EXPO_PUBLIC_API_URL=http://VOTRE_ADRESSE_IP:5000/api > .env
   
   # Sur Linux/Mac
   echo "EXPO_PUBLIC_API_URL=http://VOTRE_ADRESSE_IP:5000/api" > .env
   ```
   
   Remplacez `VOTRE_ADRESSE_IP` par l'adresse IP de la machine qui exécute le backend (utilisez `ipconfig` sur Windows ou `ifconfig` sur Linux/Mac pour trouver votre adresse IP).

   **Note importante**: Si vous exécutez le backend et le frontend sur le même appareil, vous pouvez utiliser `192.168.0.X` ou votre adresse IP locale.

4. Démarrez l'application frontend:
   ```bash
   npx expo start
   ```

## 5. Installation de Expo Go sur votre téléphone

1. Téléchargez l'application Expo Go sur votre smartphone:
   - [Android - Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Assurez-vous que votre téléphone et votre ordinateur sont connectés au même réseau Wi-Fi.

3. Scannez le code QR qui s'affiche dans votre terminal ou dans la fenêtre du navigateur Metro Bundler avec l'application Expo Go.

4. L'application devrait maintenant se charger sur votre téléphone.

## 6. Utilisation de Git pour le suivi du projet

Notre projet utilise Git comme système de contrôle de version. Voici les commandes essentielles pour travailler avec le dépôt:

```bash
# Vérifier l'état du dépôt
git status

# Ajouter des modifications pour un commit
git add .

# Créer un commit avec un message descriptif
git commit -m "Description des changements"

# Pousser les modifications vers le dépôt distant
git push

# Récupérer les dernières modifications
git pull

# Créer une nouvelle branche pour une fonctionnalité
git checkout -b nom-de-la-fonctionnalite
```

Notre workflow Git suit une approche basée sur les branches:
- `main`: branche de production stable
- `develop`: branche de développement
- Branches de fonctionnalités: nommées selon la convention `feature/nom-de-la-fonctionnalite`

## 7. Résolution des problèmes courants

### Problème de connexion à la base de données

Si MongoDB ne se connecte pas:
1. Vérifiez que le service MongoDB est en cours d'exécution
2. Vérifiez l'URL de connexion dans le fichier `.env`
3. Assurez-vous que le port 27017 n'est pas bloqué par un pare-feu

### Problème de connexion au backend depuis le frontend

Si le frontend ne se connecte pas au backend:
1. Vérifiez que le backend est en cours d'exécution
2. Vérifiez que l'adresse IP dans le fichier `.env` du frontend est correcte
3. Assurez-vous que le port 5000 n'est pas bloqué par un pare-feu
4. Vérifiez que CORS est correctement configuré dans le backend

### Problème avec Expo Go

Si l'application ne se charge pas sur Expo Go:
1. Vérifiez que votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi
2. Essayez de redémarrer le serveur Expo avec `npx expo start --clear`
3. Vérifiez les journaux pour les erreurs de compilation

## 8. Commandes utiles

### Backend

```bash
# Démarrer le serveur en mode développement
npm run dev

# Démarrer le serveur en mode production
npm start
```

### Frontend

```bash
# Démarrer le serveur de développement Expo
npx expo start

# Démarrer avec effacement du cache
npx expo start --clear

# Générer une version web (si configurée)
npx expo export:web
```

## Contact

Pour toute question ou problème concernant l'installation, veuillez contacter l'équipe de développement. 