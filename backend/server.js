const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { exec } = require('child_process');

// Charger les variables d'environnement
dotenv.config();

// Connecter à la base de données
connectDB();

// Initialiser Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Logger en développement
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: logger.stream }));
}

// Middleware pour capturer et logger les erreurs
app.use((req, res, next) => {
  // Capturer les erreurs de parsing JSON
  const originalJson = res.json;
  res.json = function(body) {
    if (res.statusCode >= 400) {
      logger.error(`Réponse d'erreur: ${res.statusCode} ${JSON.stringify(body)}`);
    }
    return originalJson.call(this, body);
  };
  next();
});

// Dossier pour les uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/ping', require('./routes/ping'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/specializations', require('./routes/specializations'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/cron', require('./routes/cron'));
app.use('/api/payment-methods', require('./routes/paymentMethods'));
app.use('/api/notifications', require('./routes/notifications'));

// Gestion des erreurs 404
app.use((req, res) => {
  logger.warn(`Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  logger.error(`Erreur non gérée: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    message: err.message || 'Erreur interne du serveur',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Port et démarrage du serveur
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
  logger.info(`Serveur démarré sur le port ${PORT}`);
});

// Programmer la tâche de nettoyage des rendez-vous non payés
// Exécution toutes les 10 minutes
cron.schedule('*/10 * * * *', () => {
  logger.info('Lancement du nettoyage des rendez-vous non payés');
  exec('node scripts/cleanupUnpaidAppointments.js', (error, stdout, stderr) => {
    if (error) {
      logger.error(`Erreur d'exécution du script de nettoyage: ${error.message}`);
      return;
    }
    if (stderr) {
      logger.error(`Erreur dans le script de nettoyage: ${stderr}`);
      return;
    }
    logger.info(`Résultat du nettoyage: ${stdout}`);
  });
}); 