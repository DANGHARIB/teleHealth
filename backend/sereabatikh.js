const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const logger = require('./config/logger');

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
app.listen(PORT, () => {
  logger.info(`Serveur en cours d'exécution sur le port ${PORT}`);
}); 